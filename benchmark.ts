import { performance } from 'node:perf_hooks';

// Helper function to run a benchmark
function runBenchmark(name: string, fn: () => void, iterations: number) {
   const start = performance.now();
   for (let i = 0; i < iterations; i++) {
      fn();
   }
   const end = performance.now();

   const totalTime = end - start;
   const avgTime = totalTime / iterations;

   console.log(`${name}:`);
   console.log(`  Total time: ${totalTime.toFixed(4)} ms`);
   console.log(`  Average time per operation: ${avgTime.toFixed(8)} ms`);
   console.log(`  Operations per second: ${(1000 / avgTime).toFixed(0)}`);

   return { name, totalTime, avgTime, opsPerSecond: 1000 / avgTime };
}

// Benchmark parameters
const ITERATIONS = 10_000_000;

// Test objects
const obj1 = { a: 1, b: 2 };
const obj2 = { a: 1, b: 2 };
let targetObj = {};

console.log(`Running each benchmark with ${ITERATIONS.toLocaleString()} iterations\n`);

// CASE 1: Object reference equality check
const equalityResult = runBenchmark(
   'Object Reference Equality (===)',
   () => {
      return obj1 === obj2; // Different objects with same content
   },
   ITERATIONS
);

console.log(''); // Add a blank line for readability

// CASE 2: Object assignment
const assignmentResult = runBenchmark(
   'Object Assignment (=)',
   () => {
      targetObj = obj1;
   },
   ITERATIONS
);

// Simple comparison
console.log('\nCOMPARISON (operations per second, higher is better):');
console.log(`  Object Reference Equality: ${equalityResult.opsPerSecond.toLocaleString()}`);
console.log(`  Object Assignment:         ${assignmentResult.opsPerSecond.toLocaleString()}`);
console.log(`\nObject assignment is ${(assignmentResult.opsPerSecond / equalityResult.opsPerSecond).toFixed(2)}x ${assignmentResult.opsPerSecond > equalityResult.opsPerSecond ? 'faster' : 'slower'
   } than reference equality checks`);