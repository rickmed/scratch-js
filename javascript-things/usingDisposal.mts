import { open, close } from "node:fs"
import { open as openP, type FileHandle} from "node:fs/promises"
import { runningJob } from "../ribu/system.mjs"
import { go } from "../ribu/Job.mjs"


/***  Ribu Auto-resource usage  ***********************************************/

// *** Async Resources

function* usingRscRibu2(): Generator<Promise<File> | Promise<unknown>, any, File> {
	const rsc = yield File2('./file.js')
	yield rsc.file.read()
}

// or ribu-native

async function File2(path: string) {
	const job = runningJob()
	const fHandle = await openP(path)
	job.onEnd(fHandle)  // fileHandle has [Symbol.asyncDispose]
	return fHandle
}

function File3(path: string) {
	const job = runningJob()
	//...using callbacks....
}

// *** Sync Resources

function* manual(): Generator<Promise<FileHandle>, any, FileHandle> {
	const rsc = yield openP("./path.js")
	onEnd(rsc)  // can pass asyncdisposable|disposable

	onEnd(() => rsc.close())  // can return a promise, ribu supports it
	onEnd(function* () {
		// a complex disposaal
	})

}


// onEndFn needs to check for errors. This ok
function* manual2(): Generator<Promise<unknown>, any, FileHandle | Error> {
	const rsc = yield openP("./path.js")
	if (rsc instanceof Error) return rsc
	const x = rsc   // use rsc...
	onEnd(() => rsc.close())
}


// if rsc is error, rsc runs but throws since rsc is not FileHandle
	// it's ok I guess
function* manual3(): Generator<Promise<unknown>, any, FileHandle | Error> {
	const rsc = yield openP("./path.js").$
	//

	onEnd(() => (rsc as FileHandle).close())

	// or
	onEnd(() => err(rsc) || rsc.close())
}

function err(x: unknown): x is Error {
	return x instanceof Error
}


/***   Ribu auto-unsubscribable from things   *********************************/

function* job() {
	const computed_ = computed(predFn)
	const computedVals = Ch()
	effectUse(() => {
		computedVals.put(computed_.value)
	})
	// ... code
}

function effectUse(cb) {
	const disposeFn = effect(cb)
	onEnd(disposeFn)
}