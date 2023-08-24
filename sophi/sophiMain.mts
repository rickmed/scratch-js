import { go, chBuff, waitErr, workerGo, readdir, onCancel, e } from "ribu"
import {cpus} from "node:os"

go(function* main() {
	const sophiConfig = {}

	const $locateFiles = locateFiles(sophiConfig)
	const $reporter = go(reporter)

	const workers = cpus()
		.map(() => workerGo("./sophiWorker.mjs", $locateFiles, $reporter))

	// const res = yield* waitErr($locateFiles, $reporter, ...workers)
	// console.log("sophi done. Goodbye")
	return "done"
})


function locateFiles(sophiConfig) {

	const { include: { folders, subStrings, extensions } } = sophiConfig
	const filePathS = chBuff<string>(30)

	return go(function* locateFiles() {

		onCancel(function* () {
			yield* filePathS.putDone()   // just a wrapper of ch.put(DONE)
		})

		for (const dir of sophiConfig.folders) {
			go(readDir(dir))
		}

		function* readDir(dirPath) {
			const entries = yield* readdir(dirPath, {withFileTypes: true})

			if (e(entries)) {
				// ?? maybe here would be nice to throw.
				// which will fail locateFiles and be caught handled by main.
			}

			// entries can be an error, maybe readdir can return a ch<file | err>
			for (const entry of entries) {
				if (entry.isFile() && hasCorrectNamesAndExtensions(entry)) {
					yield* filePathS.put(entry.path)
				}
				if (entry.isDirectory()) {
					go(readDir(entry.path))
				}
			}
		}

	}).ports({filePathS})
}




function reporter() {
	while (true) {
		this.testResults.rec
		// print things or whatever
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

// /* === Ribu Higher level APIs */
// go(function* main() {
// 	const [$locateFiles, $loadFiles] = yield forkPipe(locateFilesPath(this), worker())
// })
