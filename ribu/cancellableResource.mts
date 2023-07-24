import { go, ch, onCancel, Cancellable } from "ribu"
import fs from "node:fs"

/*
	I could wrap someIO to set appropiate csp no problem

	Problem is that sleep(3) might get some wrong prc and set _timeout to wrong
	prc. When prc.cancel(), prc deletes a wrong _timeout

	thinking that using *this* (or a "me" 1st param) for chans/sleep could be a solution
		since they have a pre access to prc.

*/


go(async function main() {

	const ch1 = ch<number>()

	go(async function child() {
		// await sleep(3)
		await sleepProm(4)
		await sleep(3)  // runningPrc is main
		console.log(csp.runningPrc?._fnName)
		// await ch1.put(2)
	})

	await promSleep(2)
	const rec = await ch1
})

// need to get the environment runningPrc
// and set it when wrapped callback runs


function readFile_(file, opts) {

	const controller = new AbortController()

	opts.signal = controller.signal

	const proc = Cancellable(() => controller.abort())

	fs.readFile(file, opts, (err, file) => {
		proc.done.dispatch(err ? err : file)
	})

	return proc.done
}




function readFile_(file, opts) {
	const controller = new AbortController()
	opts.signal = controller.signal
	const proc = Cancellable(() => controller.abort())
	fs.readFile(file, opts, (err, file) => {
		proc.done.dispatch(err ? err : file)
	})
	return proc.done
}

// to use it
go(function* main() {
	const res = yield readFile_("./package.json")
})



function cancellableFetch(url, opts) {
	const controller = new AbortController()
	opts.signal = controller.signal

	const proc = Cancellable(() => controller.abort())

	const prom = fetch(url, opts)

	return [prom, proc.cancel.bind(proc)]
}


// to use it
go(function* main() {
	const [prom, cancelProm] = cancellableFetch("http://example.com/movies.json")
	yield prom
	// yield cancelProm()  // cancelProm returns a channel fulfilled when cancelling is done

	// another process can do $main.cancel() and the fetch will be auto-cancelled
})


function webSocket(url) {

	const ws = new WebSocket(url)
	const wsClosed = ch()
	const data = ch()




	const proc = Cancellable(async function _cancel() {
		ws.close()
		// at this point, no more "message" events are fired.
		const reason = await wsClosed
		await proc.done.put(reason)  // the parent handles if errors.
	})

	ws.addEventListener("close", wsClosed.dispatch)
	ws.addEventListener("message", data.dispatch);

	ws.addEventListener("open", (event) => {
		// ??
	});

	// return desired api to interface with ws
}
