import { go, Ch, workerGo } from "ribu"


go(function* main() {

	const [$locateFiles, filePath_Ch] = locateFilesPath(sophiConfig)

	const testFileResults_Ch = Ch(100)

	let workers = Array(cpus().length)  // collect workers so I can wait for them when done
	for (const workerId of [1,2,3,4]) {
		const worker = workerGo("./sophiWorker.mjs", $locateFiles, filePath_Ch, testFileResults_Ch)
		workers.push(worker)
	}

	go(reporter(testFileResults_Ch))

	yield done($locateFiles, ...workers).rec
})




// Cancellation: locateFilesPath does not need to do anything manually. If blocked in:
	// 3) ribu.readdir(), ribu will cancel automatically
	// 2) filesPath_ch.put(), ribu will auto clean up as well.
		// ie, no more data will be put on queue
		// its up the consumers what to do with the data still in queue.
			// this way, no danger of a channel receiver to close the channel (panics in golang's ch.send())
function locateFilesPath(sophiConfig) {

	const filesPath_ch = Ch(100)

	const $locateFiles = go(function* () {
		const {include: {folders, subStrings, extensions}} = sophiConfig

		for (const dir of sophiConfig.folders) {
			go(readDir(dir))
		}

		function* readDir(dirPath) {
			const entries = yield ribu.readdir(dirPath, { withFileTypes: true })
			for (const entry of entries) {
				if (entry.isFile() && hasCorrectNamesAndExtensions(entry)) {
					yield filesPath_ch.put(entry.path)
				}
				if (entry.isDirectory()) {
					go(readDir(entry.path))
				}
			}
		}

		function hasCorrectNamesAndExtensions(fileName) {
			const fileExt = extname(fileName).slice(1)
			if (!extensions.includes(fileExt)) {
				return false
			}
			for (const str of subStrings) {
				if (fileName.includes(str)) {
					return true
				}
			}
			return false
		}
	})

	return [$locateFiles, filesPath_ch]
}


/*
	If I need to _manually_ cancel a process I could run it with go(genFn, {cancel: true})
		- and comms??:

*/

function* locateFilesPath(sophiConfig) {

	const filesPath_ch = Ch(100)

	const $locateFiles = go(function* () {
		const {include: {folders, subStrings, extensions}} = sophiConfig

		for (const dir of sophiConfig.folders) {
			go(readDir(dir))
		}

		function* readDir(dirPath) {
			const entries = yield ribu.readdir(dirPath, { withFileTypes: true })
			for (const entry of entries) {
				if (entry.isFile() && hasCorrectNamesAndExtensions(entry)) {
					yield filesPath_ch.put(entry.path)
				}
				if (entry.isDirectory()) {
					go(readDir(entry.path))
				}
			}
		}

		function hasCorrectNamesAndExtensions(fileName) {
			const fileExt = extname(fileName).slice(1)
			if (!extensions.includes(fileExt)) {
				return false
			}
			for (const str of subStrings) {
				if (fileName.includes(str)) {
					return true
				}
			}
			return false
		}
	})

	return [$locateFiles, filesPath_ch]
}



















// /* === ribu higher level APIs */
// go(function* main() {

// 	const [$locateFiles, $loadFiles] = yield forkPipe(locateFilesPath(this), worker())

// 	/* Use *this* api? "this.rec()"
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
