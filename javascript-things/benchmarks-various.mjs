/* For comparison:
	A server doing 10k req/sec -> process a req in 10 µs
*/


// /* --- Add first 1_000_000 numbers calling method  --- */

// const symb = Symbol.iterator

// class Car {
// 	door(i) {}
// 	[symb](i) {}
// 	[Symbol.iterator](i) {}
// }

// const car = new Car()
// const now = performance.now()
// let res = 0
// for (let i = 0; i < 1_000_000; i++) {
// 	// res += car.door(i)
// 	res += car[Symbol.iterator](i)
// 	// res += car[symb](i)
// }
// console.log(performance.now() - now)
// // car.door(): ~5 ms -> 0.005 µs/call
// // 	can call 1800 times in a single request at 10k req/s
// // idem Symbol.iterator & symb



// /* ----  create 1_000_000 generators ---- */

// const now = performance.now()
// function* gen1(i) {
// 	return i
// }

// let res
// for (let i = 0; i <= 1_000_000; i++) {
// 	res = gen1(i)
// }
// console.log({res})
// console.log(performance.now() - now)
// 30ms -> 0.03 µs/generator
	// can create 300 generators per single request at 10k req/s



// /*  ---  1_000_000 custom iterator .next() call  ---  */

// const now = performance.now()
// let iterRes = { done: false, value: 0 }

// function gen1() {
// 	let obj = {}
// 	obj.next = function (i) {
// 		iterRes.value = i++
// 		iterRes.done = false
// 		return iterRes
// 	}
// 	return obj
// }

// const gen = gen1()
// let count = 0
// for (let i = 0; i <= 1_000_000; i++) {
// 	count = gen.next(i).value
// }
// console.log({count})
// console.log(performance.now() - now)
// // 11ms -> 0.01 µs/call
//	// 1k calls per single request at 10k req/s



// /* ----  sync vs async-await calls  ----  */

// // sync:

// function two(i) {
// 	return i
// }

// function main(i) {
// 	// i = two(i)
// 	// return t
// 	return i
// }

// const now = performance.now()
// let res
// for (let i = 0; i <= 1_000_000; i++) {
// 	res = main(i)
// }
// console.log(res)
// console.log(performance.now() - now)
// // calling main -> two: ~5ms
// // calling only main: ~4ms

// // async-await:

// async function three(i) {
// 	return i
// }

// async function two(i) {
// 	return three(i)
// 	// i = await three(i)
// 	// return i
// }

// async function main(i) {
// 	return two(i)
// 	// i = await two(i)
// 	// return i
// }

// const now = performance.now()
// let res
// for (let i = 0; i <= 1_000_000; i++) {
// 	res = await main(i)
// }
// console.log({res})
// console.log(performance.now() - now)
// // calling only main: ~80ms
// // calling main -> two: ~180ms
// // calling main -> two -> three: ~550ms
// // idem but using using direct return: ~400ms


// /*  ---  Cost of resolving a promise --- */
// let iterations = 1_000_000
// let returnTime
// async function fn(i) {
// 	returnTime = performance.now()
// 	return i
// }

// let totalTime = 0
// for (let i = 0; i <= iterations; i++) {
// 	const now = performance.now()
// 	await fn(i)
// 	totalTime += (returnTime - now)
// }

// console.log(totalTime, " total time")
	// ~60ms
// console.log(totalTime / iterations, " per promise")
	// ~ 0.06 µs/promise



/*  ---  Array vs Set --- */

// // Creation: array is ~3-4x faster
// // set
// let now = performance.now()
// let set
// for (let i = 0; i <= 1_000; i++) {
// 	set = new Set()
// }
// console.log(performance.now() - now)
// // ~0.4ms

// // array
// now = performance.now()
// let arr
// for (let i = 0; i <= 1_000; i++) {
// 	arr = []
// }
// console.log(performance.now() - now)
// // ~0.12ms



// /*  ---  Last Item removal ---------------------------- */
// // Remove item (array removes last): same ~50-100 objects (even 1_000 I think)

// const N_THINGS = 10_000
// const arr = Array.from({length: N_THINGS}, (_, i) => i)
// const middleItem = Math.round(N_THINGS / 2)
// const lastItem = N_THINGS - 1

// // Set last item (should be indifferent)
// let set = new Set(arr)
// let now = performance.now()
// set.delete(lastItem)
// console.log(performance.now() - now, "Set")

// // Array first item
// now = performance.now()
// arr.splice(0, 1)
// console.log(performance.now() - now, "Array first")

// // Array middle item
// now = performance.now()
// arr.splice(middleItem, 1)
// console.log(performance.now() - now, "Array middle")

// // Array last item
// now = performance.now()
// arr.splice(lastItem, 1)
// console.log(performance.now() - now, "Array last")



// /*  ---  Array Iteration for, for...of, forEach and Set --- */

// const benchIterations = 100_000
// let now
// const arr = Array.from({length: 1_000}).map((x, idx) => idx)
// const arrLen = arr.length
// let lastNum

// now = performance.now()
// for (let i = 0; i <= benchIterations; i++) {
// 	for (let idx = 0; idx < arrLen; i++) {
// 		lastNum = arr[idx++]
// 	}
// }
// console.log("for:")
// console.log(performance.now() - now)

// now = performance.now()
// for (let i = 0; i <= benchIterations; i++) {
// 	for (const x of arr) {
// 		lastNum = x
// 	}
// }
// console.log("for of:")
// console.log(performance.now() - now)

// now = performance.now()
// for (let i = 0; i <= benchIterations; i++) {
// 	arr.forEach(x => {
// 		lastNum = x
// 	})
// }
// console.log("forEach:")
// console.log(performance.now() - now)

// const set = new Set(arr)
// now = performance.now()
// for (let i = 0; i <= benchIterations; i++) {
// 	for (const x of set) {
// 		lastNum = x
// 	}
// }
// console.log("Set:")
// console.log(performance.now() - now)

// // Results:
// 	// for: 1x
// 	// for..of: ~10-100x
// 	// forEach: ~10-80xms
// 	// Set: ~200x



// /***  Array splice vs delete  *************************************************/

// const arrL = 1_000_000
// const arr = Array.from({length: arrL}, (_, i) => 1)
// const arr2 = Array.from({length: arrL}, (_, i) => 1)

// // delete middle item
// let now = performance.now()
// delete arr[50000]
// console.log(performance.now() - now, "delete")

// // mark undefined middle item
// now = performance.now()
// arr[50000] = undefined
// console.log(performance.now() - now, "mark undefined")

// // splice middle item
// now = performance.now()
// arr.splice(50000, 1)
// console.log(performance.now() - now, "splice")

// CONCLUSION:
	// mark undefined is 10000x faster than splice()
	// and 2x faster than delete


// /***  Array iteration vs idem but with conditional  ***************************/
// const benchIterations = 100_000

// const arr1 = [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}]
// const arr2 = [{}, {}, undefined, {}, {}, {}, undefined, {}, {}, {}]

// let sum = 0

// let now = performance.now()
// for (let i = 0; i <= benchIterations; i++) {
// 	for (let j = 0; j < 10; j++) {
// 		const x = arr1[j]
// 		if (x === undefined) sum++
// 		else sum++
// 	}
// }
// console.log(performance.now() - now, "With conditional")

// now = performance.now()
// for (let i = 0; i <= benchIterations; i++) {
// 	for (let j = 0; j < 10; j++) {
// 		sum++
// 	}
// }
// console.log(performance.now() - now, "No conditional")

// // CONCLUSION:
// 	// No conditional is %50 faster


// /***  class dynamic key lookup vs array heterogeneous iteration  **************/
// const benchIterations = 1000000

// class One {}

// const one = new One()

// one["hello1"]
// one["hello2"]
// one["hello3"]
// const arrLen = 3
// one["hello4"] = Array.from({length: arrLen}, (_, i) => 1)
// one["hello5"]

// let now = performance.now()
// for (let i = 0; i <= benchIterations; i++) {
// 	const arr = one["hello4"]
// 	for (let j = 0; j < arrLen; j++) {
// 		arr[j]
// 	}
// }
// console.log(performance.now() - now, "class dynamic key")

// // array
// const arrL = 10
// const arr = Array.from({length: arrL}, (_, i) => 1)

// now = performance.now()
// for (let i = 0; i <= benchIterations; i++) {
// 	for (let j = 0; j < arrL; j++) {
// 		arr[j]
// 	}
// }
// console.log(performance.now() - now, "array iteration")

// // CONCLUSION:
// 	// dynamic key lookups are very fast, even compared to arr iteration
// 	// no gain in putting all keys in heterogeneous array


/***  Cost of creating a js fn closure  ***************************************/
// add firs 1_000_000 numbers
const benchIterations = 1_000_000

let now = performance.now()
let count = 0
for (let i = 0; i <= benchIterations; i++) {
	count++
}
console.log(performance.now() - now, "without closure")

now = performance.now()
let fn
for (let i = 0; i <= benchIterations; i++) {
	fn = function () {
		count++
	}
	fn()
}
console.log(performance.now() - now, "fn closure")
// CONCLUSION:
	// fn closures: ~15ms, ie are fast.