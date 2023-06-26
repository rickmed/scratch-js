/*** Generator functions general usage of .next() *************************** */

// function* hey() {
// 	const firstIn = yield 5
// 	// console.log("from gen:", firstIn)
// 	// console.log("fron gen: ", yield 10)
// 	// return "yes"
// }

// // console.log(hey.constructor.name)  // "GeneratorFunction"

// const genObj = hey()
// // console.dir(Object.prototype.toString.call(genObj))  // "[object Generator]"

// // calling hey() does nothing until you call .next()


// const cinco = genObj.next(1)   // passing 1 in does nothing.
// console.log(cinco)  // { value: 5, done: false }
// /* how it works:
// 	- when you call .next(), you send a message to the gen where the yield is at that point
// 	- it responds with the value on its right and stops there.
// 	- when you call .next(msg) again, it moves to the expression on the right (catching the msg).
// 	- runs to the next yield (returning 10)



/*** gen.throw() ************************************************************ */

/***  */

// function* gen1() {
// 	try {
// 		yield 1
// 	}
// 	finally {
// 		// some cleanup probably.
// 		console.log("in gen:")
// 		yield "sup"
// 		return "done"
// 	}
// }

// const genObj = gen1()

// let yielded;
// yielded = genObj.next()
// console.log(yielded)
// yielded = genObj.throw("yo")
// console.log(yielded)
// yielded = genObj.next()
// console.log(yielded)



/*** setting "this" used inside the gen ************************************ */

// function* hi() {
// 	console.log(this.hey)
// 	console.log(this.hey)
// }
// const thisObj = {hey: "76"}
// const gen = hi.call(thisObj)
// // all the future next() calls are bound to the obj above
// gen.next()
// gen.next()



/*** gen.return() and try/finally ******************************************* */

function* genfn() {
	yield 1;
	try {
	  yield 2;
	  yield 3;
	} finally {
	  yield 4
	  yield 5
	}
 }

const gen = genfn()
gen.next()

let yielded

yielded = gen.next()  //  -> 2, done: false
yielded = gen.return() // ->  4, done: false
yielded = gen.return()  //  -> undefined, done: trueu
console.log(yielded)

// yielded = gen.next()  // 2, done: false
// yielded = gen.return() // 4, done: false
// yielded = gen.next()  // 5, done:false
// console.log(yielded)
