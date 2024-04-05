import { open, close } from "node:fs"
import { open as openP, type FileHandle} from "node:fs/promises"
import { runningJob } from "../ribu/system.mjs"
import { go } from "../ribu/Job.mjs"

function getRsc() {
	return {
		[Symbol.dispose]() {
			console.log("done")
		}
	}
}



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


/* Ribu Error handling with resource management */

// using .cont
function* manual2(): Generator<Promise<unknown>, any, FileHandle | Error> {
	const rsc = yield openP("./path.js")
	if ((e(rsc))) return rsc
	// GOOD: typescript will complain if onEnd() is above error handling
	onEnd(() => rsc.close())
	const x = rsc   // use rsc...
}

// using .$ -> GREAT
function* manual3(): Generator<Promise<unknown>, any, FileHandle> {
	const rsc = yield openP("./path.js").$
	// GOOD: if openP() fails, onEnd() called, so rsc.dispose() is never registered
	onEnd(rsc)   // onEnd

}

function e(x: unknown): x is Error {
	return x instanceof Error
}


/* "await using" */
// if openP fails, it throws and await f.asyncDispose() is called, so:
	// 1) rsc within asyncDispose() has to check if acquired resource or not
		// if this.haveRsc = false, asyncDispose() resolves ok immediately if internally

// CONCLUSION: Ribu better bc:
// 1) No need to check if has rsc
// 2) Clearer control flow.

async function op() {
	await using f = await openP("./dummy.txt")
}

op()









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