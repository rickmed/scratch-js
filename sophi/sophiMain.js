import { go, Ch, workerGo } from "ribu"


go(function* main() {

	const $locateFiles = locateFiles(sophiConfig)

	const testFileResults_Ch = Ch(100)

	let workers = Array(cpus().length)  // collect workers so I can wait for them when done
	for (const workerId of [1,2,3,4]) {
		const worker = workerGo("./sophiWorker.mjs", $locateFiles, testFileResults_Ch)
		workers.push(worker)
	}

	go(reporter(testFileResults_Ch))

	yield done($locateFiles, ...workers).rec
})




function* locateFiles(sophiConfig) {
	const filesPath = Ch(100)
	const proc = go(function* () {
		const {include: {folders, subStrings, extensions}} = sophiConfig

		for (const dir of sophiConfig.folders) {
			go(readDir(dir))
		}

		function* readDir(dirPath) {
			const entries = yield ribu.readdir(dirPath, { withFileTypes: true })
			for (const entry of entries) {
				if (entry.isFile() && hasCorrectNamesAndExtensions(entry)) {
					yield filesPath.put(entry.path)
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

		this.cancel = function* () {
			yield filesPath.put(ribu.DONE)
		}

	})

	return {cancel: proc.cancel.bind(proc), rec: filesPath.rec}
}


/*
	needs to have 2 methods: .cancel() and .rec
	so need a spec for that.
		do i need specs for put? don't think so
*/
function* locateFiles(sophiConfig) {
	const filesPath = Ch(100)
	const proc = go(function* () {
		const {include: {folders, subStrings, extensions}} = sophiConfig

		for (const dir of sophiConfig.folders) {
			go(readDir(dir))
		}

		function* readDir(dirPath) {
			const entries = yield ribu.readdir(dirPath, {withFileTypes: true})
			for (const entry of entries) {
				if (entry.isFile() && hasCorrectNamesAndExtensions(entry)) {
					yield filesPath.put(entry.path)
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

		this.cancel = function* () {
			yield filesPath.put(ribu.DONE)
		}

	})

	return {cancel: proc.cancel.bind(proc), rec: filesPath.rec}
}


















// /* === Ribu Higher level APIs */
// go(function* main() {
// 	const [$locateFiles, $loadFiles] = yield forkPipe(locateFilesPath(this), worker())
// })
