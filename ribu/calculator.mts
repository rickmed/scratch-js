import {go, myJobs, Ch, me, cancel, Pool } from "ribu"
import { e } from "./ribu-errors.js"

/* Statechart implementation in ribu.

	- A state is a prc

	- Arrow going into a substate:
		- arrow: parameter (check parameter to launch what substate/prc to launch).

	- An Arrow going out of grouped states:
		- Composition: group of waiting events can be reused in +1 states.
		- OR: a coordinator listening for that event (and cancelling children)

	- Arrow conditions are just if statements within a prc.

 * Key ribu learnings:
		- "free" version of go() is wrong bc it leads to ambiguity of which
		is the prc's ancestor, which breaks throw/catch.
		- solution is for some ancestor access its child_s() and pass down, so
		that children can launch prcS from that bundle.
*/

// channels
const buttons = Ch()

// state is reactive
type Model = {
	num1?: number,
	num2?: number,
	op?: "+" | "-",  // ...
	init(): void
}

let model: Model = {
	init() {
		this.num1 = undefined
		this.num2 = undefined
		this.op = undefined
	}
}

let jobs: Pool<void>

go(function* main() {
	jobs = myJobs()

	jobs.go(function* C() {
		while (true) {
			yield* C_button.onClick
			const siblings = jobs.toSpliced(jobs.indexOf(me()), 1)
			yield* cancel(siblings).$  // cancel() can pass Job | Job[]
			jobs.go(start)
		}
	})

	go(start)

}).catchRun((err: Error) => {

})


// if/when start* launches another prc. It finishes, so Group
	// needs to delete the pointer to start* (or memory leak otherwise)

function* start() {
	model.init()
	const but = yield* buttons.rec
	if (isZero9OrDot(but)) {
		// *Operand1 is not a child of *start, but of *supervisor, so *start can finish
			// without waiting for *Operand1 to finish.
		// IMPLEMENTATION: *supervisor's children changes all the time, so when some
			// finishes and others are added, ribu needs to handle internally _when_ to let supervisor finish.
		jobs.go(Operand1, but)
	}
	if (isNegOp(but)) {
		jobs.go(NegNum, but)
	}
}


function* Operand1(but) {
	let prc =
		but === 0 ? go(zero) :
		but === "1-9" ? go(beforeDot) :
		go(afterDot)

	const _but = yield* button(op, percentage, CE).rec
	yield prc.cancel()
	if (but === percentage) jobs.go(result)
	if (but === CE) jobs.go(start)
	jobs.go(OpEntered)

	// helpers
	function* zero() {
		const but = yield* buttons(one9, dot).rec  // rest of buttons are disabled and not listening
		if (isOne9(but)) {
			prc = go(beforeDot)
		}
		prc = go(beforeDot)
	}

	function* beforeDot() {
		while (true) {
			const but = yield* buttons(zero9, dot).rec
			if (isDot(but)) {
				prc = go(afterDot)
				return
			}
			continue
		}
	}

	function* afterDot() {}
}








function any(...eventNames: string[]) {
	// subscribe to those events an returns a channel that resolves
	// when any of those occured. This can be typed.
}










/* Scratch  */
// channels
// const z = 0
// const zero = Ch<0>()
// const z_9 = [z, 2, 3, 4, 5, 6, 7, 8, 9] as const
// type Z9 = (typeof z_9)[number]
// const zero_9 = Ch<Z9>()
// const dot = Ch<'.'>()
// const ops = ["+", "-", "x", "/"] as const
// type Op = (typeof ops)[number]
// const op = Ch<Op>()


/* vs one listener (or Elm's msg in step function) per button:

	PRO: buttons are finite so there's a nice discrimination.
	CON: the rest of the code isn't understandable/maintainable.

*/
