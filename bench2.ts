class Link<T> {
	value: T;
	next: Link<T> | null = null

	constructor(value: T) {
		this.value = value;
		this.next = null;
	}
}

class LinkedList<T> {
	head: Link<T> | null = null

	constructor() {
		this.head = null;
	}

	add(value: T) {
		const node = new Link(value);
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
const list = new LinkedList<number>();
for (let i = 1; LLSize >= i; i++) {
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

function makeIterator<T>(head: Link<T> | null) {
	node = head;
	return iterator as Iterable<T>;
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
		let sum = 0;
		for (const value of makeIterator(list.head)) {
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




let ptcl1Node = null;

function next() {
	if (!ptcl1Node) {
		return null;
	}
	const value = ptcl1Node.value;
	ptcl1Node = ptcl1Node.next;
	return value;
}

function iter<T>(head: Link<T> | null): T | typeof NaN {
	if (!head) {
		return NaN;
	}
	ptcl1Node = head.next;
	return head.value;
}


const customProtocolResults = benchmark(
	() => {
		let sum = 0;
		for (let v = iter(list.head); v; v = next()) {
			sum += v;
		}
		return sum;
	},
	100,
	1000
); // 100 iterations, 1000 runs per iteration


let ptcl2Node: Link<unknown> | null = null;

const iter2Obj = {
	next<T>() {
		if (!ptcl2Node) {
			return false;
		}
		const value = ptcl2Node.value;
		ptcl1Node = ptcl2Node.next;
		return value as T
	}
}

type Iter<T> = {
	next: () => T | false;
}

function iter2T<T>(head: Link<T> | null) {
	return iter2Obj as Iter<T>;
}


const _iter = iter2T(list.head)
for (let v = _iter.next(); v; v = iter2Obj.next()) {
	console.log("hi");
	console.log(v);
}


const custom2Results = benchmark(
	() => {
		let sum = 0;

		return sum;
	},
	100,
	1000
); // 100 iterations, 1000 runs per iteration



console.log("For...of (ms):", forOfResults);
console.log("While loop (ms):", whileResults);
console.log("Custom protocol (ms):", customProtocolResults);
console.log("Custom 2 (ms):", custom2Results);

// Collect and sort results
const results = [
	{ name: "For...of", avg: forOfResults.avg },
	{ name: "While loop", avg: whileResults.avg },
	{ name: "Custom protocol", avg: customProtocolResults.avg },
	{ name: "Custom 2", avg: custom2Results.avg },
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
