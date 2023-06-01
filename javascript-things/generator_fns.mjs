function* hey() {
	// const firstIn = yield 5
	// console.log("from gen:", firstIn)
	// console.log("fron gen: ", yield 10)
	// return "yes"
}

// console.log(hey.constructor.name)  // "GeneratorFunction"

const genObj = hey()
// console.dir(Object.prototype.toString.call(genObj))  // "[object Generator]"

// calling hey() does nothing until you call .next()


const cinco = genObj.next(1)   // passing 1 in does nothing.
console.log(cinco)  // { value: 5, done: false }
/* how it works:
	- when you call .next(), you send a message to the gen where the yield is at that point
	- it responds with the value on its right and stops there.
	- when you call .next(msg) again, it moves to the expression on the right (catching the msg).
	- runs to the next yield (returning 10)



*/

// console.log(genObj.next(2))
	// prints "from gen: 2"
	// { value: 10, done: false }

// console.log(genObj.next("third"))
	// prints "from gen: third"
	// returns { value: undefined, done: true }
	// if it would have a return statement it would return
		// { value: 'yes', done: true }
