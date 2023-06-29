import { go, Ch, onCancel } from "ribu"

// @todo abstract this:
function cancellableFetch(url, opts) {
	let prom

	/**
	 * @this {Ribu.Ports & {age: string}}
	 * @type {Ribu.GenFn}
	 */
	const proc = go(function* () {
		const controller = new AbortController()
		opts.signal = controller.signal

		prom = fetch(url, opts)

		onCancel(function* () {
			// controller.abort()  // imagine is not this but:
			yield server.close()   // a prom
		})

		// can also pass a normal function is no need for async
		// this.cancel = () => controller.abort()
	})

	return [prom, proc.cancel.bind(proc)]
}

// to use it
go(function* main() {
	const [prom, cancelProm] = cancellableFetch("http://example.com/movies.json")
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