import {go, Ch} from "ribu"

/*
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



export function* worker($locateFiles, filePaths_Ch, testFileResult_Ch) {
	const onlyUsed_Ch = Ch()
	let cancel = false
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

		cancel = true  // don't launch anymore workers
		$locateFiles.cancel()  // cancel upstream

		yield resumeWorker.put()  // resume only one worker
	})

	yield go(function* handleFilePath() {
		while (true) {
			const filePath = yield filePaths_Ch.rec
			if (cancel) {
				continue  // this will flush $locateFiles -> void
				// here I need to let know my parent that I'm done
			}
			loadFileProcs.push(yield go(processTestFile(filePath, onlyUsed_Ch)))
			// if $locateFiles.cancel(), it will not put anymore data into the chan but
				// this process continue sending the outstanding data to $processTestFile
				// options:
					// 1) if (cancel) continue
					// 2) const $handleFilePath = yield go(...)
							// $handleFilePath.return()
		}
	})

	// CANCELLATION??


	// error?
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