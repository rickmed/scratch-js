import {go, Ch, cancel} from "ribu"

/*
	Fix this whole file bc onlyUsed_Ch should be notified to sophiMain.js
	otherwise, file processing in other workers won't be cancelled
*/

function* worker($upstream, $reporter) {
	const onlyUsed_Ch = Ch()
	let loadFileProcs = []

	go(function* handleFilePath() {
		while (true) {
			const filePath = yield $upstream.filePathS
	const proc = go(processTestFile(filePath, onlyUsed_Ch))
			loadFileProcs.push(proc)
		}
	})

	go(function* handleOnlyUsed() {
		const [proc, resumeWorker] = yield onlyUsed_Ch.rec

		/* cancel the rest of workers (and $upstream: more sending data) */
		loadFileProcs.splice(loadFileProcs.indexOf(proc), 1)
		yield cancel(loadFileProcs, $upstream).rec  // cancels in parallel
		go(flushQueue($upstream.filePathS))  // flush chans is unnecessary 99%
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


function* flushQueue(filePathS) {
	while (true) {
		const filePath = yield filePathS.rec
		if (filePath === ribu.DONE) break
		// do something with filePath
	}
}

export default worker