import {go, Ch} from "ribu"

function ribuFetch(url, opts) {

	const controller = new AbortController()
	opts.signal = controller.signal

	const response_Ch = Ch()

	let proc

	try {
		proc = go(function* () {
			// ribu can interpret promises natively
			const res = yield fetch(url, opts)
			yield response_Ch.put(res)
		})
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
		controller.abort() // doesn't return confirmation so no more to do.
	}

	return response_Ch
}


// to use it
go(function* main() {
	// ribuFetch returns a channel so need to res.rec
		// can do a promise based version to avoid .rec but will be slower
	const res = yield ribuFetch("http://example.com/movies.json").rec

	// another process can do $main.cancel() and the fetch will be auto-cancelled
})