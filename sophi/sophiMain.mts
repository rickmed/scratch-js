import { go, chBuff, myJobs, workerGo, readdir, onCancel, err, Ch } from "ribu"
import {cpus} from "node:os"

go(function* main() {
	const sophiConfig = {}
	const resultsCh = Ch<string>()
	const $locateFiles = locateFiles(sophiConfig)
	for (const cpu of cpus()) {
		workerGo("./sophiWorker.mjs", $locateFiles, resultsCh)
	}
	go(reporter, resultsCh)

	// res :: Error
	const res = yield* myJobs().waitErr
	// log(res) or whatever
	console.log("sophi done. Goodbye")
})


function locateFiles(sophiConfig) {

	const { include: { folders, subStrings, extensions } } = sophiConfig
	const filePaths = chBuff<string>(30)

	return go(function* locateFiles() {

		onCancel(function* () {
			yield* filePaths.putDone()   // just a wrapper of ch.put(DONE)
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
					yield* filePaths.put(entry.path)
				}
				if (entry.isDirectory()) {
					go(readDir(entry.path))
				}
			}
		}

	}).ports({filePaths})
}

function* reporter(resultsCh) {
	while (true) {
		const str = yield* resultsCh.rec
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
