// Utility to measure execution time
function benchmark(fn, iterations = 10000000) {
	const start = performance.now();
	for (let i = 0; i < iterations; i++) {
		 fn(i);
	}
	return performance.now() - start;
}

// Regular function
function regularFunc(val) {
	return val * 2;
}

// Generator function
function* generatorFunc(val) {
	yield val * 2;
}

// Test scenarios
const regularTest = () => {
	const val = regularFunc(42);
};

const generatorTest = () => {
	const val = generatorFunc(42).next().value;
};

// Run multiple times to account for variance
for (let i = 0; i < 5; i++) {
	console.log(`\nRun ${i + 1}:`);
	console.log('Regular function:', benchmark(regularTest), 'ms');
	console.log('Generator function:', benchmark(generatorTest), 'ms');
}