#!sudo /usr/local/bin/tsx

let yielded

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
//
// const genObj = gen1()
//
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
// 	yield
// 	console.log(this.hey)
// }
// const obj = {hey: 2}
// const gen3 = hi.call(obj)
// // all the future next() calls are bound to the obj above
// gen3.next()
// obj.hey = 5
// yielded = gen3.next()
// console.log("sone", yielded)


/*** gen.return() and try/finally ******************************************* */

// function* genfn() {
// 	yield 1;
// 	try {
// 	  yield 2;
// 	  yield 3;
// 	} finally {
// 	  yield 4
// 	  yield 5
// 	}
//  }

// const gen = genfn()
// gen3.next()

// yielded = gen3.next()  //  -> 2, done: false
// yielded = gen3.return() // ->  4, done: false
// yielded = gen3.return()  //  -> undefined, done: true
// console.log(yielded)
//
// yielded = gen.next()  // 2, done: false
// yielded = gen.return() // 4, done: false
// yielded = gen.next()  // 5, done:false
// console.log(yielded)



/* +++ check if genFn    ++++++++++++++++++++++++++++++++++++++++++++++++++++ */

// const GenFnConstructor = function* () {}.constructor

// /** @type {(x: any) => boolean} */
// function isGenFn(x) {
// 	if (x instanceof GenFnConstructor) {
// 		return true
// 	}
// 	return false
// }


/* +++ .next() after .return()     ++++++++++++++++++++++++++++++++++++++++++ */

// function* genFn() {
// 	yield 1
// }

// const gen = genFn()
// let val
// val = gen.return()
// console.log(val)
// val = gen.return()
// console.log(val)
// val = gen.next()
// console.log(val)
// val = gen.next()
// console.log(val)

// // all prints { value: undefined, done: true }


/* +++ delegate generator    ++++++++++++++++++++++++++++++++++++++++++ */

// function* sub() {
// 	yield 1
// 	yield 2
// 	return 3
// }

// function* main() {
// 	const res = yield* sub()
// 	console.log({res})
// 	return "MAIN DONE"
// }

// const gen = main()
// yielded = gen.next()
// console.log(yielded)
// yielded = gen.return("THIS")  // return "MAIN DONE" never executes
// console.log(yielded)


/* +++ where are method prototypes++++++++++++++++++++++++++++++++++++++++++ */
// const Ks = Object.getOwnPropertyNames

// function* fn() {}
// const gen = fn()
// console.log(Ks(gen.__proto__))  // []
// console.log(Ks(gen.__proto__.__proto__))  // ['constructor', 'next', 'return', 'throw']
