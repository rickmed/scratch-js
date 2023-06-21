import {go, Ch} from "ribu"

export function* worker($locateFiles, files_Ch, testFileResult_Ch) {
	const onlyUsed_Ch = Ch()
	let onlyUsed = false
	let loadFileProcs = []
	const testFileResult_Ch = Ch(100)

	yield go(function* handleOnlyUsed() {

		const [proc, resumeWorker] = yield onlyUsed_Ch.rec

		// if onlyUsed_Ch is fired:

		// cancel the rest of workers
		loadFileProcs.splice(loadFileProcs.indexOf(proc), 1)
		// proc.cancel() needs to be async/parallel (+ timeouts)
			// eg: if a process needs to cancel an async resource
		loadFileProcs.forEach(proc => proc.cancel())

		onlyUsed = true  // don't launch anymore workers
		$locateFiles.cancel()  // cancel upstream

		yield resumeWorker.put()  // resume only one worker
	})

	yield go(function* handleFilePath() {
		while (true) {
			const filePath = yield $locateFiles.filePaths_Ch.rec
			if (!onlyUsed) {
				loadFileProcs.push(yield go(processTestFile(filePath, onlyUsed_Ch)))
			}
			// if $locateFiles.cancel(), this process will flush the filePaths_Ch -> void
			// and get parked forever at filePaths_Ch.recv, ie, cancellation works all around
		}
	})

	// error?
	// CANCELLATION??

	return this
}


function* processTestFile(filePath, onlyUsed_Ch) {
	const onlyUsed = yield process(filePath)  // some async work
	if (onlyUsed) {
		const shouldResume = Ch()
		yield onlyUsed_Ch.put([this, shouldResume])
		yield shouldResume.rec
		// if I continue here it means I wasn't cancelled
	}
}