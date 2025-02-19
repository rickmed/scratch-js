// 1. DOM Event Listeners
// Subscribe
element.addEventListener('click', handleClick);
// Unsubscribe
element.removeEventListener('click', handleClick);





// 2. Node.js EventEmitter
import { EventEmitter } from 'events';

const emitter = new EventEmitter();

// Subscribe
const handler = (data) => console.log(data);
emitter.on('myEvent', handler);
// or for one-time subscription
emitter.once('myEvent', handler);

// Unsubscribe
emitter.off('myEvent', handler);
// or remove all listeners
emitter.removeAllListeners('myEvent');





// 3. Rx.js Observables
import { Observable, Subject } from 'rxjs';

// Create an Observable
const observable = new Observable(subscriber => {
  subscriber.next('Hello');
  // Cleanup function
  return () => console.log('Cleaned up');
});

// Subscribe
const subscription = observable.subscribe({
  next: value => console.log(value),
  error: err => console.error(err),
  complete: () => console.log('Complete')
});

// Unsubscribe
subscription.unsubscribe();





// 4. Custom Event System using Pub/Sub Pattern
class EventBus {
  constructor() {
    this.subscribers = new Map();
  }

  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event).add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(event).delete(callback);
      if (this.subscribers.get(event).size === 0) {
        this.subscribers.delete(event);
      }
    };
  }

  publish(event, data) {
    if (this.subscribers.has(event)) {
      this.subscribers.get(event).forEach(callback => callback(data));
    }
  }
}

const eventBus = new EventBus();
const unsubscribe = eventBus.subscribe('userUpdate', data => console.log(data));
unsubscribe(); // Remove subscription






// 5. Promise-based Subscriptions (Web APIs)
// WebSocket
const ws = new WebSocket('wss://example.com');

ws.addEventListener('message', handleMessage);
ws.addEventListener('error', handleError);
// Unsubscribe by closing
ws.close();

// Server-Sent Events (SSE)
const eventSource = new EventSource('https://api.example.com/events');

eventSource.addEventListener('update', handleUpdate);
// Unsubscribe by closing
eventSource.close();





// 6. Node.js Streams
import { Readable } from 'node:stream';

const readable = Readable.from(['a', 'b', 'c']);

// Subscribe
const subscription = readable.on('data', chunk => console.log(chunk));
readable.on('end', () => console.log('Stream ended'));

// Unsubscribe
readable.removeListener('data', subscription);

readable.on('close', () => console.log('Stream closed'))

readable.destroy(new Error('Failed to close'))









// 7. MutationObserver (DOM changes)
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => console.log(mutation));
});

// Subscribe
observer.observe(targetNode, {
  childList: true,
  attributes: true,
  subtree: true
});

// Unsubscribe
observer.disconnect();

// 8. ResizeObserver (Element size changes)
const resizeObserver = new ResizeObserver(entries => {
  entries.forEach(entry => console.log(entry));
});

// Subscribe
resizeObserver.observe(element);

// Unsubscribe
resizeObserver.unobserve(element);
// or
resizeObserver.disconnect();





// 9. IntersectionObserver (Viewport visibility)
const intersectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => console.log(entry.isIntersecting));
});

// Subscribe
intersectionObserver.observe(element);

// Unsubscribe
intersectionObserver.unobserve(element);
// or
intersectionObserver.disconnect();






// 10. Worker Messages
const worker = new Worker('worker.js');

// Subscribe
worker.addEventListener('message', handleMessage);

// Unsubscribe
worker.removeEventListener('message', handleMessage);
// or terminate the worker
worker.terminate();






// 11. Process Events in Node.js
process.on('uncaughtException', handleError);
process.on('SIGTERM', handleTermination);

// Unsubscribe
process.removeListener('uncaughtException', handleError);
process.removeListener('SIGTERM', handleTermination);






// 12. AbortController (for cancelling operations)
const controller = new AbortController();
const { signal } = controller;

fetch(url, { signal })
  .then(response => console.log(response))
  .catch(err => {
    if (err.name === 'AbortError') {
      console.log('Fetch aborted');
    }
  });

// Unsubscribe/cancel
controller.abort();