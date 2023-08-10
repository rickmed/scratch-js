import { go, Go, Ch, cancel, DONE, type Prc } from "ribu"
import { E, e} from "../ribu/error-modeling"

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

		/* cancel the rest of workers (and $upstream from sending more data) */
			// if $locateFiles cancel fails, it will be reported in main's waitErr
				// there, parent can decide what to do.
			// But is $loadFileS cancel fails, nobody is listening
				// to its completion status.

		// => let's see cancel returns any errs is better
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


// :: "OK" | Error
// returns a Ch that resolves immediately if Err (and cancels), or "OK"
// this is the default behavior if genFn finishes and still active children.
function* waitErr(...prcS: Prc) {

	const ch = Ch.fanIn(...prcS)

	while (ch.notDone) {
		const res: Ch<typeof ch> = yield ch.rec
		if (e(res) && res.tag !== "Cancelled") {
			const failedPrc = ch.justDone

			// cancel can fail. Design cancel fail options:
				// throws to parent, returns a value, throws to caller.
			yield cancel(pluck(failedPrc, prcS))

			// maybe need to cancel ch as well?
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