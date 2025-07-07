class Node {
	constructor(value) {
		this.value = value;
		this.next = null;
	}
}

class LinkedList {
	constructor() {
		this.head = null;
	}

	add(value) {
		const node = new Node(value);
		if (!this.head) {
			this.head = node;
			return;
		}
		let current = this.head;
		while (current.next) {
			current = current.next;
		}
		current.next = node;
	}
}

const LLSize = 3;

// Create test data
const list = new LinkedList();
for (let i = 1; i < LLSize; i++) {
	list.add(i);
}

let node;
let iterRes = {
	done: false,
	value: node,
};

const iterator = {
	[Symbol.iterator]() {
		return {
			next() {
				if (!node) {
					iterRes.done = true;
				} else {
					const value = node.value;
					iterRes.done = false;
					iterRes.value = value;
					node = node.next;
				}
				return iterRes;
			},
		};
	},
};

function makeIterator(head) {
	node = head;
	return iterator;
}

// Warmup phase
const listIterator = makeIterator(list.head);
for (let i = 0; i < 1000; i++) {
	for (const value of listIterator) {
		/* noop */
	}
	let current = list.head;
	while (current) {
		current = current.next;
	}
}

// Benchmark function
function benchmark(fn, iterations = 1000, runsPerIteration = 1000) {
	const times = [];
	for (let i = 0; i < iterations; i++) {
		const start = process.hrtime();
		for (let j = 0; j < runsPerIteration; j++) {
			fn();
		}
		const end = process.hrtime(start);
		// Convert to milliseconds: seconds * 1000 + nanoseconds / 1e6
		times.push(end[0] * 1000 + end[1] / 1e6);
	}
	return {
		avg: times.reduce((a, b) => a + b, 0) / times.length,
		min: Math.min(...times),
		max: Math.max(...times),
	};
}

// Run benchmarks
global.gc();

const forOfResults = benchmark(
	() => {
		const iter = makeIterator(list.head);
		let sum = 0;
		for (const value of iter) {
			sum += value;
		}
		return sum;
	},
	100,
	1000
); // 100 iterations, 1000 runs per iteration

const whileResults = benchmark(
	() => {
		let sum = 0;
		let current = list.head;
		while (current) {
			sum += current.value;
			current = current.next;
		}
		return sum;
	},
	100,
	1000
); // 100 iterations, 1000 runs per iteration

let customNode;

function next() {
	if (!customNode) {
		customNode = null;
		return false;
	}
	const value = customNode.value;
	customNode = customNode.next;
	return value;
}

function iter(head) {
	customNode = head;
}

const customProtocolResults = benchmark(
	() => {
		let sum = 0;
		for (let v = iter(list.head); (v = next()); v) {
			sum += v;
		}
		return sum;
	},
	100,
	1000
); // 100 iterations, 1000 runs per iteration

console.log("For...of (ms):", forOfResults);
console.log("While loop (ms):", whileResults);
console.log("Custom protocol (ms):", customProtocolResults);

// Collect and sort results
const results = [
	{ name: "For...of", avg: forOfResults.avg },
	{ name: "While loop", avg: whileResults.avg },
	{ name: "Custom protocol", avg: customProtocolResults.avg },
];

results.sort((a, b) => a.avg - b.avg);

// Calculate ratios
const fastest = results[0].avg;
results.forEach((result) => {
	result.ratio = (result.avg / fastest).toFixed(2) + "x";
});

// Display sorted results with ratios
console.log("Sorted Results:");
results.forEach((result) => {
	console.log(
		`${result.name}: avg = ${result.avg.toFixed(3)} ms, ratio = ${result.ratio}`
	);
});
