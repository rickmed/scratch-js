import { go, Go, Ch, cancel, DONE, type Prc } from "ribu"
import { E, e} from "../ribu/error-modeling"
import { error } from "effect/Brand"

/*
	Fix this whole file bc onlyUsed_Ch should be notified to mainSophi.ts
	otherwise, file processing in other workers won't be cancelled
*/

function* worker($locateFiles, $reporter) {
	const onlyUsedCh = Ch()
	const resumeCh = Ch()
	let $loadFileS: Array<unknown> = []

	const handleFilePath = go(function* handleFilePath() {

		// this guy "should" handle if loadFile cancellation fails.
			// bc it's its owner (it launched it)

		while (true) {
			const filePath = yield $locateFiles.filePathS.rec
			if (filePath === DONE) {
				// I know it's
			}

			// this guy probably shouldn't churn $loadFile prcS, but should create
				// a fixed amount of workers.
			const $loadFile = go(loadFile, filePath, onlyUsedCh, $reporter)
			$loadFileS.push($loadFile)
		}
	})

	const handleOnlyUsed = go(function* handleOnlyUsed() {
		const prc = yield onlyUsedCh

// If cancel(...) fails, it throws, if user doesn't catch here, ribu will
// terminate calling prc (handleOnlyUsed) with Esomething.
// Since worker's waitErr cancels eveything at any Err, it will terminate with err.

		yield cancel($locateFiles, ...pluck(prc, $loadFileS))

		go(flushQueue($locateFiles.filePathS))  // flush chans is almost always unnecessary
		yield resumeCh.put()  // resume only one worker
	})

	const res = yield waitErr(handleFilePath, handleOnlyUsed)
	if (e(res)) return res
	// return "ok", undefined, whatever.
}


function* loadFile(filePath, onlyUsedCh, resumeCh, $reporter) {
	const onlyUsed = yield fileSuite(filePath)
	if (onlyUsed) {
		const shouldResume = Ch()
		yield onlyUsedCh.put(this)
		yield resumeCh
		// if I continue here it means I wasn't cancelled
		const testsResult = processFile(filePath)
		while (true) {
			const testResult = yield* testsResult.rec
			$reporter.send(testResult)
		}
	}
}


async function flushQueue(filePathS) {
	while (true) {
		const filePath = await filePathS.rec
		if (filePath === DONE) return
		// do something with filePath
	}
}

export default worker


/*
	ok so ._done waiters should be resumed on the way BACK from recursive cancellling()
	

*/


// :: Error | customizableData
// if any prc fails, it returns immediatly with Err (and cancels the rest)
	// this is the default behavior if genFn finishes and still active children.
function* waitErr(...prcS: Prc) {

	const ch = Ch.fanIn(...prcS)

	while (ch.notDone) {

		const res: Ch<typeof ch> = yield ch.rec

		if (e(res) && res.tag !== "Cancelled") {
			const failedPrc = ch.justDone

// if cancel throws, and I don't catch here, ribu will catch it and
// prc (worker in this case) will finish with Eother (which is a nice default behavior)
			yield cancel(pluck(failedPrc, prcS))

// @todo: maybe need to cancel ch as well? what happens if I don't?
	//
			return Error()
		}
	}

	return "OK"
	/* or collect results
		return prcs.map(prc => prc.returnedVal)
	*/
}

function pluck<T>(x: T, xS: T[]) {
	xS.splice(xS.indexOf(x), 1)
	return xS
}