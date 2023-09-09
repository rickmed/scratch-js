import { go, Go, Ch, DONE, type Prc, Group, me } from "ribu"
import { E, e } from "../ribu/error-modeling"
import { error } from "effect/Brand"

/*
	Fix this whole file bc onlyUsed_Ch should be notified to mainSophi.ts
	otherwise, file processing in other workers won't be cancelled
*/

function* worker($locateFiles, resultsCh) {
	const onlyUsedCh = Ch()
	const resumeCh = Ch()
	const {filePathS} = $locateFiles

	let $loadFileS = Group()

	const handleFilePath = go(function* handleFilePath() {

		while (filePathS.notDone) {  // ??
			// what if $locateFiles is cancelled ?
			const filePath = yield* filePathS.rec

			// this guy probably shouldn't churn $loadFile prcS, but should create
			// a fixed amount of workers.
			$loadFileS.go(loadFile, filePath, onlyUsedCh, resultsCh)
		}

		// this guy will block here and wait when all it's $loadFileS childS are done
			// is this good?
	})

	const handleOnlyUsed = go(function* handleOnlyUsed() {
		const prc = yield* onlyUsedCh

		yield* $loadFileS.pluck(prc).cancel()

		go(flushQueue($locateFiles.filePathS))  // flush chans is almost always unnecessary
		yield resumeCh.put()  // resume only one worker
	})

	const res = yield* waitErr(handleFilePath, handleOnlyUsed)
	if (e(res)) return res
	// return "ok", undefined, whatever.
}


function* loadFile(filePath, onlyUsedCh, resumeCh, resultsCh) {
	const onlyUsed = yield fileSuite(filePath)
	if (onlyUsed) {
		const shouldResume = Ch()
		yield onlyUsedCh.put(me())
		yield resumeCh
		// if I continue here it means I wasn't cancelled
		const testsResult = processFile(filePath)
		while (true) {
			const testResult = yield* testsResult.rec
			yield* resultsCh.put(testResult)
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
