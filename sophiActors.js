import { fork } from "ribu"

// me === self()
fork(function* main({me}) {

	// yield lets ribu knows this is are children of main (for actor monitoring)
	// both are launched in parallel
	const [$locate, $loadFiles] = yield forkPipe(locateFilesPath(me), loadFiles())
	// return handles so can do $locate.cancel()

	// loadFiles is made of workers
	// a worker can signal


	yield rec("done", "")


})



const locateFilesPath = ($main, sophiConfig) => function* () {
	for (const folder of sophiConfig.folders) {  // list of folders where tests are
		lookRecursive(folder)
	}

	// ideally, here I would want to launch as many actor/goroutines as files (have them send the result to the loadFiles stage):
		// but can't launch them eagerly bc it would be the same
		// as sending messages without backpressure
	// so, I'd need feedback from the next stage to continue (keep launching goroutines). How?
		// bc




	async function lookRecursive(dirPath) {
		const files = await fs.readdir(dirPath, { withFileTypes: true })
		const fileNames = await Promise.all(files.map(async file => {
			const filePath = path.join(dirPath, file.name)
			if (file.isDirectory()) {
				return lookRecursive(filePath)
			} else {
				return filePath
			}
		}))
		return fileNames.flat()
	}

}

const loadFiles = () => async function*() {

}


/*
	between locateFilesPath() and loadFiles(), there needs to be a queue from which loadFiles
	can pull from.
	loadFiles() import testFile and builds fileSuiteObj
	execTests() actually execute tests from fileSuiteObj
		- then some step beautifies tests which errored
	report()

*/