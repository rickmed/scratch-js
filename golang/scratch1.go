type hchan struct {
	qcount   uint   // number of elements in the buffer
	dataqsize uint  // size of the circular buffer
	buf      unsafe.Pointer // pointer to the ring buffer (only for buffered channels)
	sendx    uint   // send index (next slot in ring buffer)
	recvx    uint   // receive index (next element to be received)

	recvq    waitq  // linked list of waiting receivers
	sendq    waitq  // linked list of waiting senders
}


// This is a simplified version of the sudog structure
// found in the Go runtime (e.g., in runtime/proc.go).
// It represents a goroutine waiting on a synchronization primitive,
// such as a channel or as part of a select statement.
type sudog struct {
	// g is the pointer to the goroutine that is waiting.
	g *g

	// next and prev link sudogs together in a wait queue.
	next *sudog
	prev *sudog

	// waitlink is used when the sudog is linked into channel wait queues.
	waitlink *sudog

	// selectdone indicates whether the goroutine waiting in a select has been chosen.
	// 0 means not selected, 1 means the case has been executed.
	selectdone uint32

	// elem may store a pointer to data associated with the wait (e.g., a channel element).
	elem interface{}

	// key is used for additional bookkeeping, for example,
	// it can represent a mode or flag associated with the wait.
	key uint32
}
