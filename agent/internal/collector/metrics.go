package collector

import (
	"bufio"
	"fmt"
	"math"
	"net"
	"os"
	"strconv"
	"strings"
	"syscall"
	"time"

	"synexguard/agent/internal/types"
)

// CollectMetrics gathers current system metrics from /proc and syscall.
func CollectMetrics() types.HeartbeatPayload {
	h := types.HeartbeatPayload{}
	h.Hostname, _ = os.Hostname()
	h.IPPublico = getOutboundIP()
	h.OSInfo = readOSInfo()
	h.CPU = readCPUPercent()
	h.RAM = readRAMPercent()
	h.Disk = readDiskPercent("/")
	h.Uptime = readUptime()
	h.OpenPorts, h.Conns = readNetConnections()
	h.Interfaces = readInterfaces()
	if h.OpenPorts == nil {
		h.OpenPorts = []int{}
	}
	if h.Interfaces == nil {
		h.Interfaces = []types.InterfaceInfo{}
	}
	return h
}

func getOutboundIP() string {
	conn, err := net.DialTimeout("udp4", "8.8.8.8:80", 2*time.Second)
	if err != nil {
		return "0.0.0.0"
	}
	defer conn.Close()
	addr := conn.LocalAddr().(*net.UDPAddr)
	return addr.IP.String()
}

func readOSInfo() string {
	data, err := os.ReadFile("/etc/os-release")
	if err != nil {
		return "Linux"
	}
	for _, line := range strings.Split(string(data), "\n") {
		if strings.HasPrefix(line, "PRETTY_NAME=") {
			return strings.Trim(strings.TrimPrefix(line, "PRETTY_NAME="), "\"")
		}
	}
	return "Linux"
}

// readCPUPercent samples /proc/stat over 1s to calculate usage.
func readCPUPercent() float64 {
	idle1, total1 := readCPUSample()
	time.Sleep(1 * time.Second)
	idle2, total2 := readCPUSample()
	idleDelta := float64(idle2 - idle1)
	totalDelta := float64(total2 - total1)
	if totalDelta == 0 {
		return 0
	}
	pct := ((totalDelta - idleDelta) / totalDelta) * 100
	return math.Round(pct*10) / 10
}

func readCPUSample() (idle, total uint64) {
	data, err := os.ReadFile("/proc/stat")
	if err != nil {
		return 0, 0
	}
	line := strings.Split(string(data), "\n")[0] // "cpu  ..."
	fields := strings.Fields(line)
	if len(fields) < 5 {
		return 0, 0
	}
	for i := 1; i < len(fields); i++ {
		val, _ := strconv.ParseUint(fields[i], 10, 64)
		total += val
		if i == 4 { // idle is the 4th value
			idle = val
		}
	}
	return
}

func readRAMPercent() float64 {
	f, err := os.Open("/proc/meminfo")
	if err != nil {
		return 0
	}
	defer f.Close()

	var memTotal, memAvailable uint64
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := scanner.Text()
		if strings.HasPrefix(line, "MemTotal:") {
			memTotal = parseMemInfoValue(line)
		} else if strings.HasPrefix(line, "MemAvailable:") {
			memAvailable = parseMemInfoValue(line)
		}
	}
	if memTotal == 0 {
		return 0
	}
	pct := float64(memTotal-memAvailable) / float64(memTotal) * 100
	return math.Round(pct*10) / 10
}

func parseMemInfoValue(line string) uint64 {
	fields := strings.Fields(line)
	if len(fields) < 2 {
		return 0
	}
	v, _ := strconv.ParseUint(fields[1], 10, 64)
	return v
}

func readDiskPercent(path string) float64 {
	var stat syscall.Statfs_t
	if err := syscall.Statfs(path, &stat); err != nil {
		return 0
	}
	total := stat.Blocks * uint64(stat.Bsize)
	free := stat.Bfree * uint64(stat.Bsize)
	if total == 0 {
		return 0
	}
	pct := float64(total-free) / float64(total) * 100
	return math.Round(pct*10) / 10
}

func readUptime() string {
	data, err := os.ReadFile("/proc/uptime")
	if err != nil {
		return "0s"
	}
	fields := strings.Fields(string(data))
	if len(fields) == 0 {
		return "0s"
	}
	secs, _ := strconv.ParseFloat(fields[0], 64)
	d := int(secs) / 86400
	h := (int(secs) % 86400) / 3600
	m := (int(secs) % 3600) / 60
	if d > 0 {
		return fmt.Sprintf("%dd %dh %dm", d, h, m)
	}
	if h > 0 {
		return fmt.Sprintf("%dh %dm", h, m)
	}
	return fmt.Sprintf("%dm", m)
}

// readNetConnections parses /proc/net/tcp and tcp6 for open ports and total connections.
func readNetConnections() (openPorts []int, totalConns int) {
	seen := map[int]bool{}
	for _, path := range []string{"/proc/net/tcp", "/proc/net/tcp6"} {
		f, err := os.Open(path)
		if err != nil {
			continue
		}
		scanner := bufio.NewScanner(f)
		scanner.Scan() // skip header
		for scanner.Scan() {
			fields := strings.Fields(scanner.Text())
			if len(fields) < 4 {
				continue
			}
			totalConns++
			state := fields[3]
			if state == "0A" { // LISTEN
				parts := strings.Split(fields[1], ":")
				if len(parts) == 2 {
					port, _ := strconv.ParseInt(parts[1], 16, 32)
					if port > 0 && !seen[int(port)] {
						seen[int(port)] = true
						openPorts = append(openPorts, int(port))
					}
				}
			}
		}
		f.Close()
	}
	return
}

func readInterfaces() []types.InterfaceInfo {
	f, err := os.Open("/proc/net/dev")
	if err != nil {
		return nil
	}
	defer f.Close()

	var ifaces []types.InterfaceInfo
	scanner := bufio.NewScanner(f)
	scanner.Scan() // skip header 1
	scanner.Scan() // skip header 2
	for scanner.Scan() {
		line := scanner.Text()
		parts := strings.SplitN(strings.TrimSpace(line), ":", 2)
		if len(parts) != 2 {
			continue
		}
		name := strings.TrimSpace(parts[0])
		if name == "lo" {
			continue
		}
		fields := strings.Fields(parts[1])
		if len(fields) < 9 {
			continue
		}
		rx, _ := strconv.ParseUint(fields[0], 10, 64)
		tx, _ := strconv.ParseUint(fields[8], 10, 64)
		ifaces = append(ifaces, types.InterfaceInfo{
			Name:    name,
			RxBytes: rx,
			TxBytes: tx,
		})
	}
	return ifaces
}
