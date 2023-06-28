import { go, Ch } from "ribu"

function _fetch(url, opts) {
	let prom

	const proc = go(function* () {
		const controller = new AbortController()
		opts.signal = controller.signal

		prom = fetch(url, opts)

		this.cancel = function* () {
			// controller.abort()  // imagine is not this but:
			yield server.close()   // a prom
		}

		// can also pass a normal function is no need for async
		// this.cancel = () => controller.abort()

	}, opts._cancel ? {cancel: true} : undefined)

	return [prom, proc.cancel.bind(proc)]
}

// to use it
go(function* main() {
	const [prom, cancelProm] = _fetch("http://example.com/movies.json", {_cancel: true})
	yield prom
	// yield cancelProm()  // cancelProm returns a channel fulfilled when cancelling is done

	// another process can do $main.cancel() and the fetch will be auto-cancelled
})


function CancelCtx() {
	const cancelCh = Ch()
	const cancelCtx = new CancelCtx() // has pointers to procs

	function startCancel() {
		go(function* _startCancel() {
			yield cancelCh.put()
		})
		return cancelDone
	}

	[startCancel, cancelCh]
}