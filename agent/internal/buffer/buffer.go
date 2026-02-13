package buffer

import (
	"sync"

	"nodeguardian/agent/internal/types"
)

type MemoryBuffer struct {
	mu       sync.Mutex
	capacity int
	items    []types.Event
}

func NewMemoryBuffer(capacity int) *MemoryBuffer {
	return &MemoryBuffer{capacity: capacity, items: make([]types.Event, 0, capacity)}
}

func (b *MemoryBuffer) Push(event types.Event) {
	b.mu.Lock()
	defer b.mu.Unlock()

	if len(b.items) >= b.capacity {
		b.items = b.items[1:]
	}
	b.items = append(b.items, event)
}

func (b *MemoryBuffer) PopBatch(size int) []types.Event {
	b.mu.Lock()
	defer b.mu.Unlock()

	if len(b.items) == 0 {
		return nil
	}
	if size > len(b.items) {
		size = len(b.items)
	}
	batch := append([]types.Event{}, b.items[:size]...)
	b.items = b.items[size:]
	return batch
}
