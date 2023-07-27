import { go, ch, onCancel, Cancellable } from "ribu"
import fs from "node:fs"

/*
I'm investigating this bc:
	1) Not wrapping functions in promise-based ribu is unsafe.
	2) Tracking runningPrc is too tricky I think
 */

//// => What happens If I don't wrap promises in process?
// in ribu yield based version, when a prc is cancelled it would simply not

/*


*/

/* promises
	* network (still need to type manually)
	* fs: I don't wrap, types will complain.
*/

/*
ok every i/o by a process launches a genObj.
	those	yield "directly" to the prcGenManager

cancellation: do I need to get a reference to sub-genObjs??
	1) prcGenObj.return() returns sub-genObj as well so I'm ok with that.
	2) Cancelling a promise?

 */




let csp = {
	runningGen: undefined,
	name: ""
}


function go(genFn) {
	const gen = genFn()
	csp.runningGen = gen
	csp.name = genFn.name
	let val
	val = gen.next()
	console.log(val)
	gen.return()
	val = gen.next()
	console.log(val)
}


function* rec() {
	// const runningGen = csp.runningGen
	yield "wooow"
	yield 78

	return "rec Val"
	console.log("rec* finally")
}

go(function* main() {
	const y = yield* rec()
	// const w = yield* myFetch("https://jsonplaceholder.typicode.com/users", {method: "POST"})
	console.log("MAIN, received:", { y })
	return "epale"
	console.log("main finally")
})

console.log("PROGRAM DONE")



/**** Cancellable Things */

function CancellableFetch(url, opts) {
	return go(function* () {
		const controller = new AbortController()
		opts.signal = controller.signal

		onCancel(() => controller.abort())

		const x = yield fetch(url, opts)  // ribu can manage promises natively.
		return x as Awaited<ReturnType<typeof fetch>> // need to implement return vals
	})
}


go(function* main() {
	const result = yield* CancellableFetch("api.com/users", {method: "POST"}).rec  // .rec is just get rec() { this.done.rec } on Prc

	// const [done, cancelProm] = CancellableFetch("api.com/users", {method: "POST"})
	// const result = yield* done.rec  // or just "done" if implicit receiving is implemented
	// yield* cancelProm()  // somewhere else
})


//// Wrap Callback based


function readFile_(file, opts) {
	const prc =  go(function* () {
		const controller = new AbortController()
		opts.signal = controller.signal

		onCancel(() => controller.abort())

		fs.readFile(file, opts, (err, file) => {
			prc.done.dispatch(err ? err : file)
		})
	})

	return prc
}

//// Cancellable websockets.
//

function webSocket(url) {

	const ws = new WebSocket(url)
	const wsClosed = ch()
	const data = ch()

	const prc = go(function _cancel() {
		ws.close()
		// at this point, no more "message" events are fired.
		const reason = await wsClosed
		await prc.done.put(reason)  // the parent handles if errors.
	})

	ws.send("msg to server")   // ???

	ws.addEventListener("close", wsClosed.dispatch)
	ws.addEventListener("message", data.dispatch);

	ws.addEventListener("open", (event) => {
		// ??
	});

	// return desired api to interface with ws
}
