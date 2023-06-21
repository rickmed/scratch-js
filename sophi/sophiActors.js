import { fork as go, Ch } from "ribu"

go(function* main() {
	const [$locateFiles, filePath_Ch] = yield go(locateFilesPath(this))
	const $loadFiles = yield go(loadFiles($locateFiles, filePath_Ch))

	// this will wait for both to be done
	yield $loadFiles.done($loadFiles)

	/*
		or
		yield done($loadFiles, $loadFiles)

		alternatively, can use the return value
		const [res1, res2] = yield $loadFiles.done($loadFiles)

		when parent proc finishes, cancel all unfinished children
	*/

})


function* loadFiles($locateFiles, files_Ch) {
	const onlyUsed_Ch = Ch()
	let onlyUsed = false
	let loadFileProcs = []

	go(function* handleOnlyUsed() {

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

	go(function* handleFilePath() {
		while (true) {
			const filePath = yield $locateFiles.filePaths_Ch.rec
			if (!onlyUsed) {
				loadFileProcs.push(yield go(loadFile(filePath, onlyUsed_Ch)))
			}
			// if $locateFiles.cancel(), this process will flush the filePaths_Ch -> void
			// and get parked forever at filePaths_Ch.recv
		}
	})

	// error?
	// CANCELLATION??

}


function* loadFile(filePath, onlyUsed_Ch) {
	const onlyUsed = yield process(filePath)  // some async work
	if (onlyUsed) {
		const shouldResume = Ch()
		yield onlyUsed_Ch.put([this, shouldResume])
		yield shouldResume.rec
		// if I continue here it means I wasn't cancelled
	}
}




// pretend `go` returns a Process handle instead of a channel
let proc = go(function* () {
	setState({ word: "Connecting in a moment..." });

	yield csp.timeout(500);

	let ws;
	try {
		ws = new WebSocket("http://wat.com");
		setState({ word: "Connecting now..." });

		yield makeOnConnectChannel(ws);

		setState({ word: "Connected!" });

		let chan = makeMessageChannel(ws);
		while (true) {
			let value = yield chan;
			setState({ word: `Got message: ${value}` });
		}
	} finally {
		ws.close();
		setState({ word: "Disconnected!" });
		// ...and any other cleanup
		// this block would be invoked upon termination
		// (a lesser known fact about generators is that calling .throw/.return
		// on them will still run finally blocks and even let you yield additional values before closing)
	}
});

// later, after user presses a button, or leaves a route
proc.kill();





/* === Other higher level APIs */
go(function* main() {

	// both are launched in parallel
		// and tracked as main's children bc yield was used
		// returns handles so can do $locateFiles.cancel()
	const [$locateFiles, $loadFiles] = yield forkPipe(locateFilesPath(this), loadFiles())

	// this:
		// is the

	/* Why use *this* api? "this.rec()"
		so I don't pass "me" as an argument
		*this* could contain an internal state as well
			yield rec("done", "") could be used as well
				difference is that you don't use *this* every time you need to import
		which would interfere with the gen's natural arguments.
		go(): works exactly like goroutines + lifetime scoping
		spawn(): have a single inbox Ch() accesible with *this"
			can send an object with don't need to use *yield*
	*/

})







// function* locateFilesPath() {
// 	const filePath_ch = Ch(100)
// 	for (const folder of sophiConfig.folders) {  // list of folders where tests are
// 		lookRecursive(folder)
// 	}

// 	// ideally, here I would want to launch as many actor/goroutines as files (have them send the result to the loadFiles stage):
// 		// but can't launch them eagerly bc it would be the same
// 		// as sending messages without backpressure
// 	// so, I'd need feedback from the next stage to continue (keep launching goroutines). How?
// 		// bc


// 	async function lookRecursive(dirPath) {
// 		const files = await fs.readdir(dirPath, { withFileTypes: true })
// 		const fileNames = await Promise.all(files.map(async file => {
// 			const filePath = path.join(dirPath, file.name)
// 			if (file.isDirectory()) {
// 				return lookRecursive(filePath)
// 			} else {
// 				return filePath
// 			}
// 		}))
// 		return fileNames.flat()
// 	}

// 	return [this, filePath_ch]
// }