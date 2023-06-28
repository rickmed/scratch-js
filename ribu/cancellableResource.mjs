import { go, Ch } from "ribu"

function cancellableFetch(url, opts) {
	const cancelCtx = opts._cancelCtx
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

	}, {cancelCtx})

	return prom
}

// to use it
go(function* main() {
	// const resp = yield ribuFetch("http://example.com/movies.json")  // ribu can yield proms natively

	/*  or if i want to cancel manually: */
	const [cancelProm, _cancelCtx] = CancelCtx()
	const res = cancellableFetch("http://example.com/movies.json", {_cancelCtx})
	yield cancelProm()  // cancelProm returns a channel fulfilled when cancelling is done

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