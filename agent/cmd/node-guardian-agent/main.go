package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"synexguard/agent/internal/client"
	"synexguard/agent/internal/collector"
	"synexguard/agent/internal/logtail"
)

func main() {
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()

	apiURL := getenv("NG_API_URL", "http://100.126.149.97:8000")
	token := getenv("NG_AGENT_TOKEN", "")
	intervalStr := getenv("NG_HEARTBEAT_INTERVAL", "15")

	if token == "" {
		// Also try AGENT_TOKEN from config file
		token = getenv("AGENT_TOKEN", "")
	}
	if apiURL == "http://100.126.149.97:8000" {
		// Also try API_URL from config file
		if v := os.Getenv("API_URL"); v != "" {
			apiURL = v
		}
	}

	interval := 30 * time.Second
	if d, err := time.ParseDuration(intervalStr + "s"); err == nil {
		interval = d
	}

	httpClient, err := client.NewClient(apiURL, token)
	if err != nil {
		log.Fatalf("failed to initialize client: %v", err)
	}

	log.Printf("synexguard-agent started — api=%s interval=%s", apiURL, interval)

	// Initial auth log scan (read existing log)
	logtail.ScanAuthLog()

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Println("synexguard-agent stopped")
			return
		case <-ticker.C:
			// 1. Scan auth.log for new entries
			logtail.ScanAuthLog()

			// 2. Collect system metrics
			payload := collector.CollectMetrics()

			// 3. Drain login attempts and events from logtail
			loginAttempts, events := logtail.Drain()
			payload.LoginAttempts = loginAttempts
			payload.Events = events

			// 4. Send heartbeat
			if err := httpClient.SendHeartbeat(ctx, payload); err != nil {
				log.Printf("heartbeat error: %v", err)
			}
		}
	}
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
