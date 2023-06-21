import { go, Ch, workerGo } from "ribu"

function main() {

}

go(function* main() {

	const [$locateFiles, filePath_Ch] = locateFilesPath(sophiConfig)

	const testFileResults_Ch = Ch(100)

	/* workers must be cancelled if main is cancelled */
	let workers = Array(cpus().length)  // collect workers so I can wait for them when done
	for (const workerId of [1,2,3,4]) {
		const worker = yield workerGo("./sophiWorker.mjs", "worker", $locateFiles, filePath_Ch, testFileResults_Ch)
		workers.push(worker)
	}

	yield go(reporter(testFileResults_Ch))

	yield done($locateFiles, ...workers)  // ?? does done return something?
	// ?? or: yield $loadFiles.done(...workers)

})

// need to handle cancellation here
	// (from $worker), but really from anywhere
function locateFilesPath(sophiConfig) {

	const filesPath_ch = Ch(100)

	const $locateFiles = yield go(function* () {
		const {include: {folders, subStrings, extensions}} = sophiConfig

		for (const dir of sophiConfig.folders) {  // list of folders where tests are
			yield go(readDir(dir))
		}

		function* readDir(dirPath) {
			const entries = yield fs.readdir(dirPath, { withFileTypes: true })
			for (const entry of entries) {
				if (entry.isFile() && hasCorrectNamesAndExtensions(entry)) {
					yield filesPath_ch.put(entry.path)
				}
				if (entry.isDirectory()) {
					yield go(readDir(entry.path))
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
	})

	yield go(function* cancel() {
		this.cancel = true  // ?? or $locateFiles.return()
		// need to respond that I'm done cancelling
	})

	return [$locateFiles, filesPath_ch]
}























// /* === ribu higher level APIs */
// go(function* main() {

// 	// both are launched in parallel
// 		// and tracked as main's children bc yield was used
// 		// returns handles so can do $locateFiles.cancel()
// 	const [$locateFiles, $loadFiles] = yield forkPipe(locateFilesPath(this), worker())

// 	// this:
// 		// is the

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
