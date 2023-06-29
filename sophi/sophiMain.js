import { go, Ch, workerGo } from "ribu"


go(function* main() {

	const $locateFiles = go(locateFiles(sophiConfig), {filePathS: Ch(100), cancel: true})

	const $reporter = go(reporter, {testResults: Ch(30)})

	let workers = Array(cpus().length)  // collect workers so I can wait for them when done
	for (const workerId of [1,2,3,4]) {
		const worker = workerGo("./sophiWorker.mjs", $locateFiles, $reporter)
		workers.push(worker)
	}


	yield done($locateFiles, ...workers).rec
})


function* locateFiles(sophiConfig) {
	const {include: {folders, subStrings, extensions}} = sophiConfig
	const {filePathS} = this

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

	this.onCancel(function* () {
		yield filePathS.put(ribu.DONE)
	})
}




function* reporter() {
	// print things
}







// /* === Ribu Higher level APIs */
// go(function* main() {
// 	const [$locateFiles, $loadFiles] = yield forkPipe(locateFilesPath(this), worker())
// })
