package client

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"time"

	"synexguard/agent/internal/types"
)

type Client struct {
	baseURL    string
	token      string
	httpClient *http.Client
}

func NewClient(baseURL, token string) (*Client, error) {
	if baseURL == "" {
		return nil, errors.New("empty API URL")
	}

	tlsConfig := &tls.Config{
		MinVersion:         tls.VersionTLS12,
		InsecureSkipVerify: true, // allow self-signed certs in dev
	}

	transport := &http.Transport{TLSClientConfig: tlsConfig}
	return &Client{
		baseURL: baseURL,
		token:   token,
		httpClient: &http.Client{
			Timeout:   15 * time.Second,
			Transport: transport,
		},
	}, nil
}

// SendHeartbeat posts the full heartbeat payload to /api/v1/agents/heartbeat.
func (c *Client) SendHeartbeat(ctx context.Context, payload types.HeartbeatPayload) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	url := c.baseURL + "/api/v1/agents/heartbeat"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Agent-Token", c.token)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		return errors.New("heartbeat rejected: HTTP " + resp.Status)
	}

	log.Printf("heartbeat sent — hostname=%s cpu=%.1f%% ram=%.1f%% disk=%.1f%% conns=%d events=%d logins=%d",
		payload.Hostname, payload.CPU, payload.RAM, payload.Disk, payload.Conns,
		len(payload.Events), len(payload.LoginAttempts))
	return nil
}
