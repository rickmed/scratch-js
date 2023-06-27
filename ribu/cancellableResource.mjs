import { go, Ch } from "ribu"

/*
	- ribu pulls out the return[1] val and passes [0] to user
	- if you pass an async function for cancellation, ribu will
		manage the promise but won't await it if cancellation comes first.
	- automatic args passing can be abstracted later.
*/
function cancellableFetch(url, opts) {
	const {_cancelCtx} = opts
	delete opts._cancelCtx

	return Resource((url, opts) => {
		const controller = new AbortController()
		opts.signal = controller.signal

		async function dispose() {
			// controller.abort()  // imagine is not this but:
			await server.close()
		}

		return [fetch(url, opts), dispose]
	}, _cancelCtx)
}


// to use it
go(function* main() {
	// const resp = yield ribuFetch("http://example.com/movies.json")  // ribu can yield proms natively

	/*  or if i want to cancel manually: */
	const [cancelProm, _cancelCtx] = CancelCtx()
	const res = cancellableFetch("http://example.com/movies.json", {_cancelCtx})
	yield cancelProm().rec  // cancelProm returns a channel fulfilled when cancelling is done

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