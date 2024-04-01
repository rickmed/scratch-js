import { Job } from "./Job.mjs"
import { runningJob } from "./system.mjs"

export function sleep(ms: number) {
	let caller = runningJob()

	caller._sleepTO = setTimeout(function to() {
		caller._resume()
	}, ms)

	return theIterable as TheIterable<void>
}
