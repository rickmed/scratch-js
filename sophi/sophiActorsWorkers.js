import { fork as go, Ch } from "ribu"

go(function* main() {
	const [$locateFiles, filePath_Ch] = yield go(locateFilesPath(sophiConfig))

	const testFileResults_Ch = Ch(100)

	/* workers must be cancelled if main is cancelled */
	let workers = Array(cpus().length)  // collect workers so I can wait for them when done
	for (const workerId of [1,2,3,4]) {
		/*  ==>>> continue here. how to share channels between nodejs threads?du */
		const worker = yield go(worker($locateFiles, filePath_Ch, testFileResults_Ch))
		workers.push(worker)
	}

	yield go(reporter(testFileResults_Ch))

	yield done($locateFiles, ...workers)  /* ribu:does done return something?? */
	/*
		or
		yield done($loadFiles, $loadFiles)

		alternatively, can use the return value
		const [res1, res2] = yield $loadFiles.done($loadFiles)

		when parent proc finishes, cancel all unfinished children
	*/

})


function* worker($locateFiles, files_Ch, testFileResult_Ch) {
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






function* locateFilesPath(sophiConfig) {
	const {include: {folders, subStrings, extensions}} = sophiConfig
	const filesPath_ch = Ch(20)

	for (const dir of sophiConfig.folders) {  // list of folders where tests are
		yield go(lookIn(dir))
	}

	function* lookIn(dirPath) {
		const dirents = yield fs.readdir(dirPath, { withFileTypes: true })
		for (const dirent of dirents) {
			if (dirent.isFile() && hasCorrectNamesAndExtensions(dirent)) {
				yield filesPath_ch.put(dirent.path)
			}
			if (dirent.isDirectory()) {
				yield go(lookIn(dirent.path))
			}
		}
	}

	function hasCorrectNamesAndExtensions(file) {
		const fileExt = extname(file).slice(1)
		if (!extensions.includes(fileExt)) {
			return false
		}
		for (const str of subStrings) {
			if (file.includes(str)) {
				return true
			}
		}
		return false
	}

	return [this, filesPath_ch]
}





















// /* === Other higher level APIs */
// go(function* main() {

// 	// both are launched in parallel
// 		// and tracked as main's children bc yield was used
// 		// returns handles so can do $locateFiles.cancel()
// 	const [$locateFiles, $loadFiles] = yield forkPipe(locateFilesPath(this), worker())

// 	// this:
// 		// is the

// 	/* Why use *this* api? "this.rec()"
// 		so I don't pass "me" as an argument
// 		*this* could contain an internal state as well
// 			yield rec("done", "") could be used as well
// 				difference is that you don't use *this* every time you need to import
// 		which would interfere with the gen's natural arguments.
// 		go(): works exactly like goroutines + lifetime scoping
// 		spawn(): have a single inbox Ch() accesible with *this"
// 			can send an object with don't need to use *yield*
// 	*/

// })
