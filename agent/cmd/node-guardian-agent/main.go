package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"nodeguardian/agent/internal/buffer"
	"nodeguardian/agent/internal/client"
	"nodeguardian/agent/internal/collector"
	"nodeguardian/agent/internal/logtail"
)

func main() {
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()

	apiURL := getenv("NG_API_URL", "https://localhost:8000/api/v1/events")
	cert := os.Getenv("NG_CLIENT_CERT")
	key := os.Getenv("NG_CLIENT_KEY")
	ca := os.Getenv("NG_CA_CERT")
	token := getenv("NG_AGENT_TOKEN", "")

	eventBuffer := buffer.NewMemoryBuffer(5000)
	httpClient, err := client.NewMTLSClient(apiURL, cert, key, ca, token)
	if err != nil {
		log.Printf("failed to initialize mTLS client: %v", err)
	}

	go logtail.StartAuthLogWatcher(ctx, eventBuffer)
	go collector.StartMetricCollector(ctx, eventBuffer)
	go client.StartRetrySender(ctx, httpClient, eventBuffer, 5*time.Second)

	log.Println("node-guardian-agent started")
	<-ctx.Done()
	log.Println("node-guardian-agent stopped")
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
