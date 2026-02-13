package types

import "time"

type Event struct {
	Type      string                 `json:"tipo"`
	Severity  string                 `json:"severidade"`
	OriginIP  string                 `json:"origem_ip,omitempty"`
	Payload   map[string]interface{} `json:"payload"`
	Timestamp time.Time              `json:"timestamp"`
}
