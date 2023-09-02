import {Timeout, any, anyPrc, err, cancel, type Prc} from "ribu"

// any ignores prcS that resolve with "Cancelled"

// Return array of values. Short-circuit on error.
function* waitErr(...prcS: Prc) {

	const inFlight = anyPrc(...prcS)

	while (inFlight.notDone) {

		const prc = yield* inFlight.rec
		const res = prc.doneVal

		if (err(res)) {

			yield* inFlight.cancel()  // cancel is idempotent so no need to pull donePrcs
			return Error()
		}
	}

	return prcS.map(prc => prc.doneVal)
}



function* waitErr2(...prcS: Prc) {
	const inFlight = any(...prcS)
	while (inFlight.count) {
		const doneVal = yield* inFlight.rec
		if (err(doneVal)) {
			yield* inFlight.cancel()  // cancel is void if prc failed so no need to pull donePrcs
			return Error()
		}
	}
	return prcS.map(prc => prc.doneVal)
}



// don't think this api is worth it to save 1 line (with performance lost)
function* waitErr4(...prcS: Prc) {
	for (const ch of anyPrc(...prcS)) {
		const res = yield* ch.rec
		if (err(res)) {
			yield* cancel(prcS)  // cancel is idempotent so no need to pull donePrcs
			return Error()
		}
	}
	return prcS.map(prc => prc.doneVal)
}
