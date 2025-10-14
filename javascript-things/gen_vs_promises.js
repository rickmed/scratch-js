// Run with: node --expose-gc benchmark.js
const { performance } = globalThis

function forceGC() {
   if (typeof gc === "function") gc()
}

function bench(label, fn, iterations = 1_000_000) {
   forceGC()
   const start = performance.now()
   fn(iterations)
   const end = performance.now()
   console.log(`${label}: ${(end - start).toFixed(3)} ms`)
}

// ===========================================================
// Shared iterator and result (completely static)
// ===========================================================
const sharedResult = { value: 1, done: false }

const sharedIterator = {
   next() {
      // Always return the *same exact object*; no mutation
      return sharedResult
   },
}

const iterable = {
   [Symbol.iterator]() {
      // Always return the same iterator object
      return sharedIterator
   },
}

// ===========================================================
// Generator using yield* twice (so it yields 2 values total)
// ===========================================================
function* genTwice() {
   yield 1
   yield 1
}

// ===========================================================
// Async equivalent (two await steps)
// ===========================================================
async function asyncTwice() {
   await Promise.resolve(1)
}

// ===========================================================
// Benchmark functions
// ===========================================================
function runGenerators(iterations) {
   for (let i = 0; i < iterations; i++) {
      const g = genTwice()
      // We’ll just consume two next()s to match the two yields
      g.next() // from first yield*
      g.next() // from second yield*
   }
}

async function runAsyncs(iterations) {
   for (let i = 0; i < iterations; i++) {
      await asyncTwice()
   }
}

// ===========================================================
// Run benchmarks
// ===========================================================
;(async function main() {
   const iterations = 1_000_000

   bench(
      "Generator (yield* ×2, same iterator/result)",
      runGenerators,
      iterations
   )

   forceGC()
   const start = performance.now()
   await runAsyncs(iterations)
   const end = performance.now()
   console.log(`Async/await ×2: ${(end - start).toFixed(3)} ms`)
})()
