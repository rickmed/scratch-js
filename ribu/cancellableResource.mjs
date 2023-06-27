import { go, Ch } from "ribu"

// the pattern below can probably be abstracted
	// idea: use genFn.this to abstract (ie, put controller on this)
function ribuFetch(url, opts) {

	const controller = new AbortController()
	opts.signal = controller.signal

	const response_Ch = Ch()

	const proc = go(function* () {
		try {
			// ribu can interpret promises natively
			// @todo: if ribu can interpret promises natively, just return it to caller?
			const res = yield fetch(url, opts)
			yield response_Ch.put(res)
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
			// need to handle here instead of directly in handleCancel bc
			// the proc needs to be removed as parent's child
			controller.abort()
		}
	})

	go(function* handleCancel() {
		const cancelCh = opts._cancel
		yield cancelCh.rec
		yield proc.cancel()
		yield cancelCh.put()
	})

	return response_Ch
}


// to use it
go(function* main() {
	// const resp = yield ribuFetch("http://example.com/movies.json").rec

	/*  or if i want to cancel manually: */
	const [cancelProm, _cancel] = CancelCtx()
	const res = ribuFetch("http://example.com/movies.json", {_cancel}).rec
	yield cancelProm().rec  // cancelProm returns a channel fulfilled when cancelling is done

	// another process can do $main.cancel() and the fetch will be auto-cancelled
})


function CancelCtx() {
	const cancelCh = Ch()

	function startCancel() {
		go(function* _startCancel() {
			yield cancelCh.put()
		})
		return cancelDone
	}

	[startCancel, cancelCh]
}