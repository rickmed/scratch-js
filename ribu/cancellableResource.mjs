import { go, Ch } from "ribu"

function ribuFetch(url, opts) {

	const { _cancel: {cancelRequest, cancelDone}} = opts
	const controller = new AbortController()
	opts.signal = controller.signal

	const response_Ch = Ch()

	const proc = go(function* () {
		try {
			// ribu can interpret promises natively
			// todo: if ribu can interpret promises natively, just return it to caller?
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
		yield cancelRequest.rec
		yield proc.cancel()
		yield cancelDone.put()
	})

	return response_Ch
}


// to use it
go(function* main() {
	// const resp = yield ribuFetch("http://example.com/movies.json").rec

	/*  or if i want to cancel manually: */
	const [cancelProm, _cancel] = CancelCtx()
	const res = ribuFetch("http://example.com/movies.json", {_cancel})
	yield cancelProm().rec  // cancelProm returns a channel fulfilled when cancelling is done

	// another process can do $main.cancel() and the fetch will be auto-cancelled
})


function CancelCtx() {
	const cancelRequest = Ch()
	const cancelDone = Ch()

	function startCancel() {

		go(function* _startCancel() {
			yield cancelRequest.put()
		})

		return cancelDone
	}

	[startCancel, {cancelRequest, cancelDone}]
}