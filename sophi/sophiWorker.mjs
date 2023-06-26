import {go, Ch} from "ribu"

/* Threads support

	so I need somehow to send/receive messages related to parameters of the worker fn.
		and route them to the appropiate object

	2 options:

		1) Modify ribu.core so that it supports threads (go(), Ch())
			- con: can't be used in browser (unless supports browser web worker api as well)
			- con: bit slower.
				- now would need to have map in which thread the process is and route appropiately
					- this COULD be nice
					- idem channels
			- con/pro: implicit

		2) Have special worker_Go()/worker_Ch()
			- pro: original go()/Ch() stay fast.
			- con/pro: explicit


		* goWorker() needs to exist either way (+pro: explicit)
			- bc worker needs to be in a separate file.


		* workerCh():
			- All Chans used/used-From worker need to be explicit
			- And all Procs (return by go()) used/used-From worker would need to be explicit as well.
		* Ch(): ??


		I'm leaning towards support workers internally, otherwise is
			too ugly for user.
*/

// resources that need to cancel here:
	//
function* worker($locateFiles, filesPath_ch, testFileResult_Ch) {
	const onlyUsed_Ch = Ch()
	let loadFileProcs = []
	const testFileResult_Ch = Ch(100)

	yield go(function* handleOnlyUsed() {

		const [proc, resumeWorker] = yield onlyUsed_Ch.rec

		/* cancel the rest of workers and upstream to stop sending more data */
		loadFileProcs.splice(loadFileProcs.indexOf(proc), 1)
		yield cancel(loadFileProcs, $locateFiles).rec  // cancels in parallel
		processFiles = false
		yield go(flushQueue(filesPath_ch))
		yield filesPath_ch.put(ribu.DONE)  // don't send before launching flushQueue bc probably get deadlocked
		yield resumeWorker.put()  // resume only one worker
	})


	yield go(function* handleFilePath() {
		while (true) {
			filePath = yield filesPath_ch.rec
			loadFileProcs.push(yield go(processTestFile(filePath, onlyUsed_Ch)))
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