import {go, myJobs, Ch, me, cancel, Pool } from "ribu"
import { e } from "./ribu-errors.mjs"

/* Statechart implementation in ribu.

	- A state is a job

	- Arrow going into a substate:
		- arrow: parameter (check parameter to launch what substate/job to launch).

	- An Arrow going out of grouped states:
		- Composition: group of waiting events can be reused in +1 states.
		- OR: a coordinator listening for that event (and cancelling children)

	- Arrow conditions are just if statements within a job.

 * Key ribu learnings:
		- "free" version of go() is wrong bc it leads to ambiguity of which
		is the job's ancestor, which breaks throw/catch.
		- solution is for some ancestor access its child_s() and pass down, so
		that children can launch jobS from that bundle.
*/

// channels
const buttons = Ch()

// state is reactive so ui can be synced
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

go(function* main() {

	let jobs = myJobs()

	go(function* C() {
		for (;;) {
			jobs.go(start, jobs)
			yield* C_button.onClick
			yield* jobs.cancel()
		}
	})

})


// if/when start* launches another job, it finishes, so jobs
	// needs to delete the pointer to start* (or memory leak otherwise)

function* start(jobs: Pool<void>) {
	model.init()  // ui updates, need a way to connect to the ui and events comming in
	const button = yield* buttons.rec
	if (isZero9OrDot(button)) {

		// *Operand1 is not a child of *start, but of *main, so *start can finish
			// without waiting for *Operand1 to finish.

		jobs.go(Operand1, button)

		return
	}
	if (isNegOp(button)) {
		jobs.go(NegNum, button)
	}
}


function* Operand1(button) {
	let job =
		button === 0 ? go(zero) :
		button === "1-9" ? go(beforeDot) :
		go(afterDot)

	const _but = yield* button(op, percentage, CE).rec
	yield job.cancel()
	if (button === percentage) jobs.go(result)
	if (button === CE) jobs.go(start)
	jobs.go(OpEntered)

	// helpers
	function* zero() {
		const button = yield* buttons(one9, dot).rec  // rest of buttons are disabled and not listening
		if (isOne9(button)) {
			job = go(beforeDot)
		}
		job = go(beforeDot)
	}

	function* beforeDot() {
		while (true) {
			const button = yield* buttons(zero9, dot).rec
			if (isDot(button)) {
				job = go(afterDot)
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
