import { fork as go } from "ribu"

spawn(function* main() {

	// yield lets ribu knows this is are children of main (for actor monitoring)
		// both are launched in parallel
		// and return handles so can do $locateFiles.cancel()
	const [$locateFiles, $loadFiles] = yield forkPipe(locateFilesPath(me), loadFiles())


	/* Why use *this* api?
		so I don't pass "me" as an argument
		*this* could contain an internal state as well
			yield rec("done", "") could be used as well
				difference is that you don't use *this* everytime you need to import
		which would interfere with the gen's natural arguments.
		go(): works exactly like goroutines + lifetime scoping
		spawn(): have a single inbox Ch() accesible with *this"
			can send an object with don't need to use *yield*
	*/


	/* Global onlyUsed checkpoint

		Worker reports to coordinator if any of
		its fileSuites used only(). Then, awaits for the coordinator to signal
		it that it can start testing its imported files.

	 	Else, each worker can start testing the files it imported (no coordination needed).
	*/
	yield this.rec("done", "")

})

/*
locateFilesPath sends to a queue to loadFiles
presummably, loadFiles launches a process for each filePath received
each worker needs to notify if fileSuite.only = true
a coordinator needs to cancel the rest of the workers

locateFilesPath -> {filePaths} ->
loadFiles
	each worker tasked with
		import(),
		build fileSuite,
		raise (yield) notification if fileSuite.only
			the coordinator (loadFiles) continues the worker and cancels the rest
				if some worker raised notification (loadFiles.this.only = true), no additional workers are launched after that
	How the "raise" mechanism should work?
		so loadFiles should have "+1 inboxes / msgType":
			the filePathsQueue
			childRaiseOnlyUsed
		need both of them bc needs to coordinate that if a child raised, not to pull anymore from filePathsQueue
			ideally, should cancel locateFilesPath as well
				how? maybe directly locateFilesPath.cancel() (locateFilesPath should implement finally/cancel to cancel any upstream dependencies)
			and delete any ouststanding filePaths in queue.
		options:
			1) processes have a this.raise()?
			2) parent pass itself to the child so the child can parent.send(onlyUsed)
			=> This is very similar to the general cancel semantics:
				ie, if a process is doing its "normal" job, what is the api when other messages arrive?
					eg, loadFiles is blocked on "yield filePaths.rec()" and receives a "onlyUsed" from a child
				- Options:
					- A process can be launched with +1 functions
					- A process have a single inbox which it pattern match of the kind of msg
*/


	// needs to have $main as a parameter to
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
1) processes have a this.raise()?
2) parent pass itself to the child so the child can parent.send(onlyUsed)

so cancel with generators are handled with finally?
	- let's do with finally and with pattern matching its single inbox
 */

function loadFiles(filePaths) {
	const filePath = yield filePaths.rec
	spawn(worker(filePath))
}

function* worker(filePath) {

}