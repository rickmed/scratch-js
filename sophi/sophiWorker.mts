import { go, Go, Ch, waitAll, cancel, DONE } from "ribu"
import { E, e} from "../ribu/error-modeling"

/*
	Fix this whole file bc onlyUsed_Ch should be notified to mainSophi.ts
	otherwise, file processing in other workers won't be cancelled
*/

function* worker($locateFiles, $reporter) {
	const onlyUsedCh = Ch()
	const resumeCh = Ch()
	let loadFileProcs: unknown[] = []

	go(function* handleFilePath() {
		while (true) {
			const filePath = yield $locateFiles.filePathS.rec
			if (filePath === DONE) {
				// I know it's
			}
			const proc = go(processTestFile, filePath, onlyUsedCh)
			loadFileProcs.push(proc)
		}
	})

	go(function* handleOnlyUsed() {
		const proc = yield onlyUsedCh

		/* cancel the rest of workers (and $upstream from sending more data) */
		loadFileProcs.splice(loadFileProcs.indexOf(proc), 1)
		yield cancel(loadFileProcs, $locateFiles)

		go(flushQueue($locateFiles.filePathS))  // flush chans is almost always unnecessary
		yield resumeCh.put()  // resume only one worker
	})

	// here I need to wait for all children to finish, respond to errors, etc.
	const res = yield waitAll
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