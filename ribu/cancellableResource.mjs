import { go, Ch, onCancel } from "ribu"

// @todo abstract this:
function cancellableFetch(url, opts) {
	let prom

	const proc = goWait(function* _proc() {
		const controller = new AbortController()
		opts.signal = controller.signal

		prom = fetch(url, opts)

		onCancel(() => controller.abort())
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



/* could I reuse Prc.done like "yield this.done.put(file)"

	Prc.done right now is .rec by:
		proc.cancel()
		done(proc)/done()
		yield proc.done
	and .put() by:
		Prc when genReturn and cancelsDone
*/
function readFile(file, opts) {
	const controller = new AbortController()
	opts.signal = controller.signal
	const _ch = ch()

	goWait(function* () {
		fs.readFile(file, opts, (err, file) => {
			_ch.put(err ? err : file)
		})
		onCancel(() => controller.abort())
	})

	return _ch
}


// to use it
go(function* main() {
	const res = readFile("./package.json").rec
})



















/** @type {(ms: number) => SLEEP | never} */
export function sleep(ms) {

	const procBeingRan = /** @type {Prc} */ (csp.runningPrc)

	go(function* _sleep() {  // eslint-disable-line require-yield

		const timeoutID = setTimeout(() => {
			procBeingRan.setResume()
			procBeingRan.run()
		}, ms)

		onCancel(() => clearTimeout(timeoutID))
	})

	return SLEEP
}

// actor has a ch already created
class readFile extends Actor {

}