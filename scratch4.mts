// Test class and instance
class TestClass {
	constructor() {
		 this.a = 1;
		 this.b = 2;
	}
	method1() {

	}
}
const testObj = new TestClass();
const iterations = 10000000;


function benchmarkProperty() {
	const start = performance.now();
	for (let i = 0; i < iterations; i++) {
		 if ('a' in testObj) {
			testObj.method1()
		 }
	}
	return performance.now() - start;
}

function benchmarkArrayIsArray() {
	const start = performance.now();
	for (let i = 0; i < iterations; i++) {
		 if (Array.isArray(testObj)) {

		 }
	}
	return performance.now() - start;
}

// Run benchmarks
console.log(`Running benchmarks (${iterations.toLocaleString()} iterations each)...`);
console.log('----------------------------------------');

const propertyTime = benchmarkProperty();
const arrayIsArrayTime = benchmarkArrayIsArray();

console.log(`'in' operator: ${propertyTime.toFixed(2)}ms`);
console.log(`Array.isArray: ${arrayIsArrayTime.toFixed(2)}ms`);

// Sort results
const results = [
	{ name: 'in operator', time: propertyTime },
	{ name: 'Array.isArray', time: arrayIsArrayTime }
].sort((a, b) => a.time - b.time);

console.log('\nFrom fastest to slowest:');
results.forEach((result, index) => {
	console.log(`${index + 1}. ${result.name}`);
});