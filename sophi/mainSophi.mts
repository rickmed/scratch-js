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

	return go(async function locateFiles() {

		for (const dir of sophiConfig.folders) {
			go(readDir(dir))
		}

		async function readDir(dirPath) {
			const entries = await readdir(dirPath, {withFileTypes: true})
			for (const entry of entries) {
				if (entry.isFile() && hasCorrectNamesAndExtensions(entry)) {
					await filePathS.put(entry.path)
				}
				if (entry.isDirectory()) {
					go(readDir(entry.path))
				}
			}
		}

		onCancel(async function () {
			await filePathS.put(DONE)
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
