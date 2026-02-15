package logtail

import (
	"bufio"
	"os"
	"regexp"
	"strings"
	"sync"

	"synexguard/agent/internal/types"
)

var (
	mu       sync.Mutex
	attempts []types.LoginAttempt
	events   []types.EventEntry
	lastPos  int64

	reFailedPw  = regexp.MustCompile(`Failed password for(?: invalid user)? (\S+) from (\S+)`)
	reAcceptPw  = regexp.MustCompile(`Accepted (?:password|publickey) for (\S+) from (\S+)`)
	reInvalidUsr = regexp.MustCompile(`Invalid user (\S+) from (\S+)`)
)

// Drain returns collected login attempts and events since last call, then clears.
func Drain() ([]types.LoginAttempt, []types.EventEntry) {
	mu.Lock()
	defer mu.Unlock()
	a := attempts
	e := events
	attempts = nil
	events = nil
	if a == nil {
		a = []types.LoginAttempt{}
	}
	if e == nil {
		e = []types.EventEntry{}
	}
	return a, e
}

// ScanAuthLog reads new lines from /var/log/auth.log since last position.
func ScanAuthLog() {
	const path = "/var/log/auth.log"
	f, err := os.Open(path)
	if err != nil {
		// Try journalctl-based systems
		trySecureLog()
		return
	}
	defer f.Close()

	info, err := f.Stat()
	if err != nil {
		return
	}

	// If file was truncated (logrotate), reset
	if info.Size() < lastPos {
		lastPos = 0
	}

	if lastPos > 0 {
		f.Seek(lastPos, 0)
	}

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		parseLine(scanner.Text())
	}

	pos, _ := f.Seek(0, 1)
	lastPos = pos
}

func trySecureLog() {
	const path = "/var/log/secure"
	f, err := os.Open(path)
	if err != nil {
		return
	}
	defer f.Close()
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		parseLine(scanner.Text())
	}
}

func parseLine(line string) {
	mu.Lock()
	defer mu.Unlock()

	lower := strings.ToLower(line)

	if m := reFailedPw.FindStringSubmatch(line); m != nil {
		attempts = append(attempts, types.LoginAttempt{
			User:    m[1],
			IP:      m[2],
			Method:  "SSH",
			Success: false,
		})
		events = append(events, types.EventEntry{
			Tipo:       "ssh_login_failed",
			Severidade: "warning",
			Mensagem:   "Tentativa de login SSH falhou para " + m[1] + " de " + m[2],
			OrigemIP:   m[2],
		})
	} else if m := reAcceptPw.FindStringSubmatch(line); m != nil {
		attempts = append(attempts, types.LoginAttempt{
			User:    m[1],
			IP:      m[2],
			Method:  "SSH",
			Success: true,
		})
		events = append(events, types.EventEntry{
			Tipo:       "ssh_login_success",
			Severidade: "info",
			Mensagem:   "Login SSH bem-sucedido para " + m[1] + " de " + m[2],
			OrigemIP:   m[2],
		})
	} else if m := reInvalidUsr.FindStringSubmatch(line); m != nil {
		events = append(events, types.EventEntry{
			Tipo:       "ssh_invalid_user",
			Severidade: "warning",
			Mensagem:   "Tentativa com usuário inválido " + m[1] + " de " + m[2],
			OrigemIP:   m[2],
		})
	} else if strings.Contains(lower, "possible break-in attempt") {
		events = append(events, types.EventEntry{
			Tipo:       "intrusion_attempt",
			Severidade: "critical",
			Mensagem:   line,
		})
	}
}
