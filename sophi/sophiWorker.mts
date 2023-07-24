import { go, Go, Ch, wait, cancel, DONE } from "ribu"

/*
	Fix this whole file bc onlyUsed_Ch should be notified to sophiMain.js
	otherwise, file processing in other workers won't be cancelled
*/

function* worker($upstream, $reporter) {
	const onlyUsedCh = Ch()
	const resumeCh = Ch()
	let loadFileProcs: unknown[] = []

	go(function* handleFilePath() {
		while (true) {
			const filePath = yield $upstream.filePathS
			const proc = go(processTestFile, filePath, onlyUsedCh)
			loadFileProcs.push(proc)
		}
	})

	go(function* handleOnlyUsed() {
		const proc = yield onlyUsedCh

		/* cancel the rest of workers (and $upstream from sending more data) */
		loadFileProcs.splice(loadFileProcs.indexOf(proc), 1)
		yield cancel(loadFileProcs, $upstream)

		go(flushQueue($upstream.filePathS))  // flush chans is almost always unnecessary
		yield resumeCh.put()  // resume only one worker
	})

	// here I need to wait for all children to finish.
	const res = yield wait()
}


function* processTestFile(filePath, onlyUsedCh, resumeCh) {
	const onlyUsed = yield fileSuite(filePath)
	if (onlyUsed) {
		const shouldResume = Ch()
		yield onlyUsedCh.put(this)
		yield resumeCh
		// if I continue here it means I wasn't cancelled
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