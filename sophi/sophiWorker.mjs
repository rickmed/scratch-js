import {go, Ch} from "ribu"


function* worker($locateFiles, testFileResult_Ch) {
	const onlyUsed_Ch = Ch()
	let loadFileProcs = []
	const testFileResult_Ch = Ch(100)

	/*	weirdness: msgs to filesPathCh is done by original actor and worker (below)
		- is this necessary? let's check
		problem is that it is a bufferedChan, so there's data on the buffer.
			so the worker needs to put a message DONE in the chan
				- but it is ALWAYS best that the chan creator do it (upstream actor)

	*/

	/* IDEA: insead of "go(function* handleFilePath() {...}",
		this.$locateFiles.rec() {
			... maybe even make it a class.
		}

	*/

	go(function* handleFilePath() {
		while (true) {
			const filePath = yield $locateFiles.rec
			const proc = go(processTestFile(filePath, onlyUsed_Ch))
			loadFileProcs.push(proc)
		}
	})

	go(function* handleOnlyUsed() {

		const [proc, resumeWorker] = yield onlyUsed_Ch.rec

		/* cancel the rest of workers (and $upstream: more sending data) */
		loadFileProcs.splice(loadFileProcs.indexOf(proc), 1)
		yield cancel(loadFileProcs, $locateFiles).rec  // cancels in parallel
		go(flushQueue($locateFiles))  // flush chans is unnecessary 99%
		yield resumeWorker.put()  // resume only one worker
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


function* flushQueue($locateFiles) {
	while (true) {
		const filePath = yield $locateFiles.rec
		if (filePath === ribu.DONE) break
		// do something with filePath
	}
}

export default worker