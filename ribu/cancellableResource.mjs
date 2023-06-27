import { go, Ch } from "ribu"

/*
	so ribu would need a function to run and a function to cancel?
	AsyncCancellable must return a ch to user when its done.
		and accept all the args for the internal resource and an optional cancelCtx
*/

function myFetch(url, opts) {
	return AsyncCancellable(function() {
		const controller = new AbortController()
		opts.signal = controller.signal
		fetchProm = fetch(url, opts)

		return () => controller.abort()
	})
}


// the pattern below can probably be abstracted (for apis: (arg1, opts) => prom)
	// idea: use genFn.this to abstract (ie, put controller on this)
function cancellableFetch(url, opts) {
	const {_cancelCtx} = opts
	delete opts.cancelCtx  // just in case fetch opts do something weird inside with opts
	let fetchProm

	// internally in ribu, if cancelProm() is called (see below in usage)
		// checks for all the procs that use the ctx() and it and gen.return(), ie, goto finally{}

	go(function* () {
		const controller = new AbortController()
		try {
			opts.signal = controller.signal
			fetchProm = fetch(url, opts)
		}
		catch (err) {
			// the canceller already knows that the resource is cancelled so it can proceed accordingly, no need to throw
			if (err.name === 'AbortError') {
				return
			}
			// the rest of error types will be thrown to the parent proc
			throw err
		}
		finally {
			controller.abort()
		}
	}, _cancelCtx)

	return fetchProm
}


// to use it
go(function* main() {
	// const resp = yield ribuFetch("http://example.com/movies.json")  // can yield chans directly as .rec

	/*  or if i want to cancel manually: */
	const [cancelProm, _cancelCtx] = RibuCancelCtx()
	const res = cancellableFetch("http://example.com/movies.json", {_cancelCtx})
	yield cancelProm().rec  // cancelProm returns a channel fulfilled when cancelling is done

	// another process can do $main.cancel() and the fetch will be auto-cancelled
})


function RibuCancelCtx() {
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