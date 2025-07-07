# JavaScript Object Operations Benchmark

A simple benchmark to compare the performance of:
1. Object reference equality checks (`obj1 === obj2`)
2. Object assignment operations (`objTarget = objSource`)

## Running the Benchmark

Make sure you have Node.js installed, then:

```bash
# Compile the TypeScript
npx tsc benchmark.ts

# Run the benchmark
node benchmark.js
```

## What This Measures

This benchmark compares two fundamental JavaScript operations:

- **Object Reference Equality**: Testing if two object references point to the same object in memory using the strict equality operator (`===`)
- **Object Assignment**: Assigning one object reference to another variable (`objA = objB`)

The results show operations per second for each operation type, giving you a clear picture of their relative performance.

## Interpreting the Results

Higher numbers = better performance (more operations per second)

The benchmark runs each operation 10 million times to get reliable performance metrics.