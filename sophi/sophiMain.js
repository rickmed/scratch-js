import { go, ch, waitAll, workerGo, onCancel } from "ribu"


go(function* main() {

	const $reporter = go(reporter, {testResults: ch(30)})
	const $locateFiles = go(locateFiles(sophiConfig), {filePathS: ch(30)})

	for (const workerId of range(cpus().length)) {
		workerGo("./sophiWorker.mjs", $locateFiles, $reporter, workerId)
	}

	yield waitChildren
	console.log("sophi done. Goodbye")
})


function* locateFiles(sophiConfig) {
	const { include: { folders, subStrings, extensions } } = sophiConfig
	const { filePathS } = this

	for (const dir of sophiConfig.folders) {
		go(readDir(dir))
	}

	function* readDir(dirPath) {
		const entries = yield ribu.readdir(dirPath, { withFileTypes: true })
		for (const entry of entries) {
			if (entry.isFile() && hasCorrectNamesAndExtensions(entry)) {
				yield filePathS.put(entry.path)
			}
			if (entry.isDirectory()) {
				go(readDir(entry.path))
			}
		}
	}

	onCancel(function* () {
		yield filePathS.put(ribu.DONE)
	})
}




function* reporter() {
	while (true) {
		this.testResults.rec
		// print things or whatever
	}
}


function* range(start, end) {
	for (let i = start; i <= end; i++) {
		yield i;
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
