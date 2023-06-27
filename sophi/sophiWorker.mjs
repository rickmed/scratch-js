import {go, Ch} from "ribu"


function* worker($locateFiles, filesPath_ch, testFileResult_Ch) {
	const onlyUsed_Ch = Ch()
	let loadFileProcs = []
	const testFileResult_Ch = Ch(100)

	// If I create a cancelCtx here


	go(function* handleOnlyUsed() {

		const [proc, resumeWorker] = yield onlyUsed_Ch.rec

		/* cancel the rest of workers and upstream to stop sending more data */
		loadFileProcs.splice(loadFileProcs.indexOf(proc), 1)


		yield cancel(loadFileProcs, $locateFiles).rec  // cancels in parallel
		processFiles = false
		go(flushQueue(filesPath_ch))
		yield filesPath_ch.put(ribu.DONE)  // don't send before launching flushQueue bc probably get deadlocked
		yield resumeWorker.put()  // resume only one worker
	})


	go(function* handleFilePath() {
		while (true) {
			filePath = yield filesPath_ch.rec
			const proc = go(processTestFile(filePath, onlyUsed_Ch))
			loadFileProcs.push(proc)
		}
	})

}


function* processTestFile(filePath, onlyUsed_Ch) {
	const onlyUsed = yield process(filePath)  // actually process the filePath
	if (onlyUsed) {
		const shouldResume = Ch()
		yield onlyUsed_Ch.put([this, shouldResume])
		yield shouldResume.rec
		// if I continue here it means I wasn't cancelled
	}
}


function* flushQueue(filePaths_Ch) {
	while (true) {
		const filePath = yield filePaths_Ch.rec
		if (filePath === ribu.DONE) break
		// do somthing with filePath
	}
}

export default worker