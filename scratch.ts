import { AsyncLocalStorage } from 'async_hooks';

interface RequestContext {
  requestId: string;
  user?: { id: string; name: string };
  startTime: number;
}

// Create a typed ALS instance
const als = new AsyncLocalStorage<RequestContext>();

// Helper to get the current context, typed
function getContext(): RequestContext {
  const store = als.getStore();
  console.log('Current store:', store)
  return store;
}

// Run with a fully-typed context
async function demo() {
  await als.run(
    {
      requestId: 'abc-123',
      user: { id: 'u1', name: 'Alice' },
      startTime: Date.now(),
    },
    async () => {
      // `als.getStore()` is inferred as `RequestContext | undefined`
      const ctx = getContext(); // safely get a RequestContext
      console.log('Request ID:', ctx.requestId);
      await Promise.resolve();
      logSomething();
    }
  );
}

function logSomething() {
  // Here `als.getStore()` is inferred as `RequestContext | undefined`
  const store = getContext();
}

demo();
