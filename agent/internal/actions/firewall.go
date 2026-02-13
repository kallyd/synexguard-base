package actions

import "os/exec"

func BanIP(ip string) error {
	cmd := exec.Command("iptables", "-A", "INPUT", "-s", ip, "-j", "DROP")
	return cmd.Run()
}

func UnbanIP(ip string) error {
	cmd := exec.Command("iptables", "-D", "INPUT", "-s", ip, "-j", "DROP")
	return cmd.Run()
}

func BlockPort(port string) error {
	cmd := exec.Command("iptables", "-A", "INPUT", "-p", "tcp", "--dport", port, "-j", "DROP")
	return cmd.Run()
}
