import {go, Group, Ch, freeGo} from "ribu"
import { err } from "./error-modeling.js"

/*
	- A state is a prc

	- Arrow going into a substate:
		- arrow : parameter
			- Check parameter to launch some prc.

	- An Arrow going out of grouped states:
		- Composition: group of waiting events can be reused in +1 states.
		- OR: a coordinator listening for that event (and cancelling children)

	- Arrow conditions are just if statements within a prc.

	- UI Effects?
*/

// channels
const buttons = Ch()

// state is reactive
type State = {
	num1?: number,
	num2?: number,
	op?: "+" | "-",  // ...
}

let state: State = {}

let prcS: Group

go(function* supervisor() {
	prcS = Group()
	for (;;) {
		const prcRet = yield* prcS.rec
		if (err(prcRet)) {
			yield* prcS.cancel()
		}
	}
})

prcS.go(function* C() {
	while (true) {
		yield* CButton.onClick
		yield* prcS.cancel()
		prcS.go(start)
	}
})


prcS.go(start)


function* start() {
	// or can type op and now state is {num1: 0, op: op} and now listening for num2
	state = {}
	const but = yield* buttons.rec
	if (isZero9OrDot(but)) {
		prcS.freeGo(Operand1, but)  // freeGo used so that start has no active children to wait
	}
	if (isNegOp(but)) {
		prcS.freeGo(NegNum, but)
	}
}



function* Operand1(but) {
	let prc =
		but === 0 ? go(zero) :
		but === one9 ? go(beforeDot) :
		go(afterDot)


	const _but = yield* button(op, percentage, CE).rec
	yield prc.cancel()
	if (but === percentage) prcS.freeGo(result)
	if (but === CE) prcS.freeGo(start)
	prcS.freeGo(OpEntered)

	// helpers
	function* zero() {
		const but = yield* buttons(one9, dot).rec  // rest of buttons are disabled and not listening
		if (isOne9(but)) {
			prc = freeGo(beforeDot)
		}
		prc = freeGo(beforeDot)
	}

	function* beforeDot() {
		while (true) {
			const but = yield* buttons(zero9, dot).rec
			if (isDot(but)) {
				prc = freeGo(afterDot)
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
