package collector

import (
	"context"
	"runtime"
	"time"

	"nodeguardian/agent/internal/buffer"
	"nodeguardian/agent/internal/types"
)

func StartMetricCollector(ctx context.Context, buf *buffer.MemoryBuffer) {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			buf.Push(types.Event{
				Type:     "host_metrics",
				Severity: "info",
				Payload: map[string]interface{}{
					"goroutines": runtime.NumGoroutine(),
					"timestamp":  time.Now().UTC().Format(time.RFC3339),
				},
				Timestamp: time.Now().UTC(),
			})
		}
	}
}
