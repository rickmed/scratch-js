const usedMemory = () => {
	const used = process.memoryUsage().heapUsed / 1024 / 1024;
	console.log(`Memory used: ${Math.round(used * 100) / 100} MB`);
};



// // Class
// class NumberIterator {
// 	constructor() {
// 		this.i = 0;
// 	}
// 	next() {
// 		if (this.i < 1e7) return { value: this.i++, done: false };
// 		return { done: true };
// 	}
// }

// console.time('Class');
// const iterator = new NumberIterator();
// let result;
// while (!(result = iterator.next()).done) { }
// usedMemory();
// console.timeEnd('Class');


// Generator
function* numberGenerator() {
	let i = 0;
	while (i < 1e7) yield i++;
}

console.time('Generator');
const gen = numberGenerator();
for (let num of gen) { }
usedMemory();
console.timeEnd('Generator');