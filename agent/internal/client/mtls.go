package client

import (
	"bytes"
	"context"
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"time"

	"nodeguardian/agent/internal/buffer"
	"nodeguardian/agent/internal/types"
)

type MTLSClient struct {
	url        string
	token      string
	httpClient *http.Client
}

func NewMTLSClient(url, certPath, keyPath, caPath, token string) (*MTLSClient, error) {
	if url == "" {
		return nil, errors.New("empty API URL")
	}

	tlsConfig := &tls.Config{MinVersion: tls.VersionTLS12}
	if certPath != "" && keyPath != "" {
		cert, err := tls.LoadX509KeyPair(certPath, keyPath)
		if err != nil {
			return nil, err
		}
		tlsConfig.Certificates = []tls.Certificate{cert}
	}

	if caPath != "" {
		caBytes, err := os.ReadFile(caPath)
		if err != nil {
			return nil, err
		}
		pool := x509.NewCertPool()
		pool.AppendCertsFromPEM(caBytes)
		tlsConfig.RootCAs = pool
	}

	transport := &http.Transport{TLSClientConfig: tlsConfig}
	return &MTLSClient{
		url:   url,
		token: token,
		httpClient: &http.Client{
			Timeout:   10 * time.Second,
			Transport: transport,
		},
	}, nil
}

func (c *MTLSClient) SendEvent(ctx context.Context, event types.Event) error {
	body, _ := json.Marshal(event)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.url, bytes.NewBuffer(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	if c.token != "" {
		req.Header.Set("Authorization", "Bearer "+c.token)
	}
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		return errors.New("event rejected")
	}
	return nil
}

func StartRetrySender(ctx context.Context, c *MTLSClient, buf *buffer.MemoryBuffer, interval time.Duration) {
	if c == nil {
		return
	}
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			batch := buf.PopBatch(50)
			for _, item := range batch {
				_ = c.SendEvent(ctx, item)
			}
		}
	}
}
