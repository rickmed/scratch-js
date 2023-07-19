
import { go, ch, onCancel } from "ribu"
import fs from "node:fs"



export function sleep(ms) {
	// Cancellable doesn't run anything. But marks as child of last called go()
	const proc = Cancellable(() => clearTimeout(timeoutID))
	const timeoutID = setTimeout(proc.done.dispatch, ms)
	return proc.done.rec
}

// to use it
go(function* main() {
	yield sleep(1).rec
})



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

	const proc = Cancellable(function* _cancel() {
		ws.close()
		// at this point, no more "message" events are fired.
		const reason = yield wsClosed.rec
		yield proc.done.put(reason)  // the parent handles if errors.
	})

	ws.addEventListener("close", wsClosed.dispatch)
	ws.addEventListener("message", data.dispatch);


	ws.addEventListener("open", (event) => {
		// ??
	 });

	// return desired api to interface with ws
}



export function Go<GenFnArgs, OptKs extends string>(
	opt: Opt<OptKs>,
	genFn: GenFn<GenFnArgs, Opt<OptKs>>,
	...genFnArgs: GenFnArgs[]
): Proc<OptKs> {