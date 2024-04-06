import { type Job } from "./Job.mjs"

class System {
	deadline = 5000
	stack: Array<Job> = []

	get running(): Job | undefined {
		return this.stack.at(-1)
	}
}

export const sys = new System()

export function runningJob() {
	return sys.running!
}


export let theIterResult = {
	done: false,
	value: 0 as unknown,
}


export const theIterator: TheIterator<any> = {
	next() {
		const job = runningJob()
		const {_state} = job
		if (_state === "PARK") {
			theIterResult.done = false
			return theIterResult
		}
		theIterResult.done = true
		theIterResult.value = job.val
		return theIterResult
	}
}

export const theIterable = {
	[Symbol.iterator]() {
		return theIterator
	}
}



/* Types */

export type TheIterable<V> = {
	[Symbol.iterator](): Iterator<unknown, V>
}

export type TheIterator<V> = Iterator<unknown, V>