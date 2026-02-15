package types

// HeartbeatPayload matches the backend's /api/v1/agents/heartbeat schema.
type HeartbeatPayload struct {
	Hostname      string          `json:"hostname"`
	IPPublico     string          `json:"ip_publico"`
	OSInfo        string          `json:"os_info"`
	CPU           float64         `json:"cpu"`
	RAM           float64         `json:"ram"`
	Disk          float64         `json:"disk"`
	Uptime        string          `json:"uptime"`
	Conns         int             `json:"conns"`
	OpenPorts     []int           `json:"open_ports"`
	Interfaces    []InterfaceInfo `json:"interfaces"`
	LoginAttempts []LoginAttempt  `json:"login_attempts"`
	Events        []EventEntry   `json:"events"`
}

type InterfaceInfo struct {
	Name    string `json:"name"`
	RxBytes uint64 `json:"rx_bytes"`
	TxBytes uint64 `json:"tx_bytes"`
}

type LoginAttempt struct {
	User    string `json:"user"`
	IP      string `json:"ip"`
	Method  string `json:"method"`
	Success bool   `json:"success"`
}

type EventEntry struct {
	Tipo       string `json:"tipo"`
	Severidade string `json:"severidade"`
	Mensagem   string `json:"mensagem"`
	OrigemIP   string `json:"origem_ip,omitempty"`
}
