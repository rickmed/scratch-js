// Import the Err class from bench.js
import { Err } from './bench.js';
import Benchmark from 'benchmark';

// Create a simple benchmark suite
const suite = new Benchmark.Suite('Simple Error Instantiation Benchmark');

// Helper function to force garbage collection if available
function forceGC() {
  if (global.gc) {
    console.log('Running garbage collection...');
    global.gc();
  } else {
    console.log('Note: For more accurate results, run with --expose-gc flag');
  }
}

// Basic instantiation tests
suite
  .add('Native Error', function() {
    new Error('test error message');
  })
  .add('Custom Err', function() {
    new Err('TestErr', 'test error message', 'testFunction');
  });

// Add listeners
suite
  .on('start', function() {
    console.log('Starting simple benchmark...');
  })
  .on('cycle', function(event) {
    console.log(String(event.target));
    // Force GC after each test
    forceGC();
  })
  .on('complete', function() {
    console.log('Benchmark completed');
    console.log('Fastest is ' + this.filter('fastest').map('name'));

    // Final GC
    forceGC();
  });

// Run the benchmark
console.log('Running benchmark. This may take a moment...');
suite.run({ 'async': true });

// Note: For more accurate results, run with:
// node --expose-gc simple-error-benchmark.js