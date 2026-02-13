package logtail

import (
	"bufio"
	"context"
	"os"
	"strings"
	"time"

	"nodeguardian/agent/internal/buffer"
	"nodeguardian/agent/internal/types"
)

func StartAuthLogWatcher(ctx context.Context, buf *buffer.MemoryBuffer) {
	watchFile(ctx, "/var/log/auth.log", buf)
}

func watchFile(ctx context.Context, path string, buf *buffer.MemoryBuffer) {
	f, err := os.Open(path)
	if err != nil {
		return
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		select {
		case <-ctx.Done():
			return
		default:
			line := scanner.Text()
			if strings.Contains(strings.ToLower(line), "failed password") {
				buf.Push(types.Event{
					Type:     "ssh_login_failed",
					Severity: "warning",
					Payload: map[string]interface{}{
						"raw":       line,
						"tentativas": 1,
					},
					Timestamp: time.Now().UTC(),
				})
			}
		}
	}
}
