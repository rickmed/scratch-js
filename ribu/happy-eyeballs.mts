import { sleep } from "effect/Effect"
import dns from "node:dns/promises"
import net from "node:net"
import {go, type Job, cancel, childs as myJobs, pool as Pool, Ch} from "ribu"
import { err, E_, wait, errIs } from "./ribu-errors.mjs"
import { Socket } from "node:net"
import { fail } from "node:assert"
import { count } from "node:console"

/* Happy EyeBalls algorithm:
	- launch attempt
	- if any inFlight attempt fails or timeout expires, launch another concurrent attempt
	- cancel everything when first attempt is succesful
		- and return the socket
		- if all attempts fail, return an Error.
*/
function* happyEB_og(hostName: string, port: number, delay: number = 300) {

	const addrs: string[] = yield* dns.resolve4(hostName)
	if (addrs.length === 0) {
		return Error('DNS: no addresses to connect')
	}

	const fails = new Ev()
	const connectJobs = Pool(go(connect, addrs.shift()!))

	go(function* () {
		for (;;) {
			yield fails.timeout(delay)
			if (addrs.length > 0) connectJobs.go(connect, addrs.shift()!)
			else return
		}
	})

	while (connectJobs.count) {
		const {val} = yield* connectJobs.rec
		if (val instanceof Socket) {
			yield* myJobs().cancel().$
			return val
		}
		fails.emit()
	}

	return Error("All attempted connections failed")
}


class Ev<CB_Aarg = unknown> {

	static Timeout = Symbol("to")

	waitingJob!: Job
	_timeout?: NodeJS.Timeout

	emit(val?: CB_Aarg) {
		if (this._timeout) {
			clearTimeout(this._timeout)
		}
		this.waitingJob._resume(val)
	}

	timeout(ms: number) {
		const job = runningJob()
		this._timeout = setTimeout(() => {
			job._resume(Ev.Timeout)
		}, ms)
	}

	get wait(): typeof PARKED {
		this.waitingJob = runningJob()
		return PARKED
	}
}


// DONE
	// need a pool to:
		// cancel() rest on success
		// receive any of them
	// difference from allOneFail() usage is that jobs are added dynamically

	// Pool
		// subscribe to passed jobs in constructor immediately
function* happyEB(hostName: string, port: number, delay = 300) {

	const addrs: string[] = yield* dns.resolve4(hostName)
	if (addrs.length === 0) {
		return Error('DNS: no addresses to connect')
	}

	const fail = Ch()
	const connectJobs = new Pool(go(connect, addrs.shift()!))

	go(function* launchOnFailOrDelay() {
		for (;;) {
			yield* Timeout.race(delay, fail)  // can race Ch or other prcS
			if (addrs.length > 0) {
				connectJobs.go(connect, addrs.shift()!)
			}
			else return
		}
	})

	while (connectJobs.count) {
		const job: Job = yield connectJobs.rec
		if (job.val instanceof Socket) {
			yield cancel(inFlight)
			return job.val
		}
		yield* fail.put()
	}

	return Error("All attempted connections failed")
}

class Pool<Jobs> {

	inFlight = 0
	waitingJob!: Job

	constructor(jobs: Job[]) {
		this.inFlight = jobs.length
		for (const job of jobs) {
			job.onDone(doneJob => {
				this.waitingJob._resume(doneJob.val)
			})
		}
	}

	get count() {
		return this.inFlight
	}

	get rec() {
		this.waitingJob = runningJob()
		return PARK
	}

	add(job: Job) {
		job.onDone(doneJob => {
			this.waitingJob._resume(doneJob.val)
		})
	}

	// if I want go(), I need a reference to an array of Jobs to add/delete
		// could also be useful for long running jobs who add/remove jobs dynamically
}



// who is this job child of??
function connect(addrs: string) {
	const socket = new net.Socket()
	const job = Job()

	job.onEnd(() => socket.destroy())

	socket.on("error", e => {
		job.resolve(e)
		// or
		job.reject(e)  // guarantees that prc resolves with Error (ie, wraps e if not instance of Error)
	})

	socket.on("connect", () => {
		job.resolve(socket)
	})

	socket.connect(443, addrs)
	return job
}









// INCOMPLETE: +1 child sets
	// what is the diff between:
		// childs<typeof connect>()
		// childs().cancel().orEnd
// CON:
	// hard to follow: "const {val} = yield* Timeout.race(delay, connectJobs.go(connect, addr))"
function* happyEB_2(hostName: string, port: number, delay: number = 300) {

	const addrs: string[] = yield* dns.resolve4(hostName)
	if (addrs.length === 0) return Error('DNS: no addresses to connect')

	const attempts = Pool(go(attempt, "args"))
	attempts.go(attempt, "args")  // typed

	// other pool
	const connectJobs = Pool<typeof connect>()
	// allPools() return a Pool<any>, ie, only useful to cancel everything.
	yield* myJobs().cancel().$

	while (attempts.count) {
		const {val} = yield* connectJobs.rec
		if (val instanceof Socket) {
			return val
		}
		// ignore failed connections
	}

	return Error("All attempted connections failed")

	function* attempt(addr: string): Socket | undefined {
		// if job wins,
			// internal timeout is cancelled (so no need to cancel) ans connect keeps running
		const {val} = yield* Timeout.race(delay, connectJobs.go(connect, addr))
		if ((val === Timeout || err(val)) && addrs.length > 0) {
			attempts.go(attempt, addrs.shift()!)
		}
	}
}
