// this is the default behavior if genFn finishes and still active children.
function* waitErr(...prcS: Prc) {

	const donePrc = anyDone(...prcS)

	while (donePrc.notDone) {

		const prc: Prc = yield* donePrc.rec
		const res = prc.doneVal

		if (e(res) && res.tag !== "Cancelled") {

			// If cancel(...) fails, it throws, if user doesn't catch here, ribu will
			// terminate calling prc (worker in this case) and resolve it with Exc.
			// which the parent should react to (and up the stack)

			yield cancel(prcS)  // cancel is idempotent so no need to pull donePrcs
			return Error()
		}
	}

	return prcS.map(prc => prc.doneVal)
}



function* waitErr2(...prcS: Prc) {

	const doneValS = anyVal(...prcS)

	while (doneValS.notDone) {

		// the type of doneVal should be: Union<PrcsRetVals>
		const doneVal = yield* doneValS.rec

		if (e(doneVal) && doneVal.tag !== "Cancelled") {

			yield cancel(prcS)  // cancel is void if prc failed so no need to pull donePrcs
			return Error()
		}
	}

	return prcS.map(prc => prc.doneVal)
}






function* waitErr4(...prcS: Prc) {
	// I could return on next() the same ch, when ch is done, return {done: true}
	for (const ch of anyPrc(...prcS)) {
		const res = yield* ch.rec
		if (e(res) && res.tag !== "Cancelled") {
			yield cancel(prcS)  // cancel is idempotent so no need to pull donePrcs
			return Error()
		}
	}
	return prcS.map(prc => prc.doneVal)
}



/* Happy EyeBalls in pseudo-english:
	launch attempt
	if any of the previous in-flight attempts failed or a timeout fires:
		launch another one
	cancel everything when one attempt is succesful.

*/