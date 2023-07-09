import { go, Ch, onCancel } from "ribu"

// @todo abstract this:
function cancellableFetch(url, opts) {
	let prom

	const proc = goWait(function* () {
		const controller = new AbortController()
		opts.signal = controller.signal

		prom = fetch(url, opts)

		this.onCancel = () => controller.abort()
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



/*

*/

function readFile(file, opts) {

	const controller = new AbortController()
	opts.signal = controller.signal

	// Passing a normal fn so that ribu can dissambiguate to not cancel immedately des not work
		// bc I may want to have the full power of a genFn
	return go(function () {
		const {done} = this
		fs.readFile(file, opts, (err, file) => {
			done.put(err ? err : file)
		})
		this.onCancel = () => controller.abort()
	}).done
}


// to use it
go(function* main() {
	const res = readFile("./package.json").rec
})



















/** @type {(ms: number) => Ch} */
export function sleep(ms) {
	return go(function* () {
		const {done} = this
		const timeoutID = setTimeout(done.put, ms)
		this.onCancel = () => clearTimeout(timeoutID)
	}).done.rec
}
