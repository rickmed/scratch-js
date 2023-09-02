// I could reuse the same returned obj for all operations

import { random } from "effect/Hash"

let i = 0

const obj1 = {value: 78, done: false}

const iterator = {
	[Symbol.iterator]() {
		return {
			next(msg) {
				console.log({msg})
				if (i++ === 0) {
					return obj1
				}
				return {value: "dsad", done: true}
			}
		}
	},
	cancel() {
		return 2
	}
}

function* gen() {
	yield 21
	console.log("2nd gen")
	// yield* calls iterator[Symbol.iterator]().next(undefined)
		// if {done: false}, the obj is forwarded to gen.next() caller
		// else ({done: true}), x is {value}, ie, the obj itself is ignored
	const x = yield* iterator
	console.log({x})
}

const g = gen()
let y
y = g.next("ep")
console.log(y)
y = g.next("yo")
console.log(y === obj1)
console.log(y)
y = g.next("hi")
console.log(y)