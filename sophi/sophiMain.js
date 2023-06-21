import { fork as go, Ch } from "ribu"
import {worker} from "./sophiWorker.mjs"

go(function* main() {
	const [$locateFiles, filePath_Ch] = yield go(locateFilesPath(sophiConfig))

	const testFileResults_Ch = Ch(100)

	/* workers must be cancelled if main is cancelled */
	let workers = Array(cpus().length)  // collect workers so I can wait for them when done
	for (const workerId of [1,2,3,4]) {
		/*  ==>>> continue here. how to share channels between nodejs threads? */
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
