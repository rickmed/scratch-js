import { go, ch, onCancel, Cancellable } from "ribu"
import {readdir} from "node:fs/promises"
import fs from "node:fs"


/** With this I loose manual cancellation */
function* simpleProm(dirPath, opts) {

	const controller = new AbortController()
	opts.signal = controller.signal

	onCancel(() => controller.abort())  // if onCancel() is called on main, this will throw

	try {
		const entries = yield readdir(dirPath, opts)  // ribu can manage promises natively.
		// need to implement return vals to use Prc.done and not create another ch here internally
		return entries as Awaited<ReturnType<typeof readdir>>
	}
	catch (e) {
		return e as Error
	}
}

/**** Cancellable Things */

function CancellableProm(dirPath, opts) {
	return go(function* () {
		const controller = new AbortController()
		opts.signal = controller.signal

		onCancel(() => controller.abort())

		const entries = yield readdir(dirPath, opts)  // ribu can manage promises natively.

		// need to implement return vals to use Prc.done and not create another ch here internally
		return entries as Awaited<ReturnType<typeof readdir>>
	}).done.rec
}


go(function* main() {

	// const result = yield* CancellableFetch("api.com/users", {method: "POST"})

	const result = yield* simpleProm("api.com/users", {method: "POST"})


	// const [done, cancelProm] = CancellableFetch("api.com/users", {method: "POST"})
	// const result = yield* done.rec  // or just "done" if implicit receiving is implemented
	// yield* cancelProm()  // somewhere else
})



//// Wrap Callback based

function readFile_(file, opts) {
	const prc = go(function* () {
		const controller = new AbortController()
		opts.signal = controller.signal

		onCancel(() => controller.abort())

		fs.readFile(file, opts, (err, file) => {
			if (prc._state !== "RUNNNING") return   // don't trust 100% abortController
			prc.done.enQueue(err ? err : file)
		})
	})

	return prc
}



/**** Cancellable websockets

what ribu adds
	1) the ws service is cancelled greacefully/automatically when parent finishes (of manually if desired)
		so the server/client can get a chance do to things on cancellation
	2) Ribu style Error modeling

In reality, since ws.send() doesn't acknowledge reception from server,
you can expose a sync .send() of the api returned by MyWebSocket
*/

function MyWebSocket(url) {
	const ws = new WebSocket(url)

	const wsClosed = ch()
	const fromServer = ch()
	const toServer = ch()

	go(function* _cancel() {
		while (true) {
			const msg = yield* toServer.rec
			ws.send(msg)
		}
	})

	const prc = go(function* _cancel() {
		onCancel(ws.close)
		// at this point, no more "message" events are fired.
		const reason = yield* wsClosed.rec
		yield* prc.done.put(reason)  // the parent handles if errors.
	})

	ws.addEventListener("close", wsClosed.enQueue)
	ws.addEventListener("message", fromServer.enQueue);

	ws.addEventListener("open", (event) => {
		// ??
	});

	return {}
}
