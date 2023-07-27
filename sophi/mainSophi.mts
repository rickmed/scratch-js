import { go, ch, waitAll, workerGo, readdir, DONE, onCancel } from "ribu"


go(function* main() {
	const sophiConfig = {}

	const $locateFiles = locateFiles(sophiConfig)
	const $reporter = go(reporter)

	for (const workerId of range(cpus().length)) {
		workerGo("./sophiWorker.mjs", $locateFiles, $reporter, workerId)
	}

	const res = yield waitAll
	console.log("sophi done. Goodbye")
})


function locateFiles(sophiConfig) {

	const { include: { folders, subStrings, extensions } } = sophiConfig
	const filePathS = ch<string>(30)

	return go(function* locateFiles() {

		for (const dir of sophiConfig.folders) {
			go(readDir(dir))
		}

		function* readDir(dirPath) {
			const entries = yield* readdir(dirPath, {withFileTypes: true})
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

		onCancel(function* () {
			yield* filePathS.put(DONE)
		})

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
