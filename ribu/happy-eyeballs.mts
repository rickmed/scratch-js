import { sleep } from "effect/Effect"
import dns from "node:dns/promises"
import net from "node:net"
import {go, Job, childs as myJobs, pool, Ch} from "ribu"
import { err, E, wait, errIs } from "./ribu-errors.mjs"
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

// DONE
function* happyEB(hostName: string, port: number, delay: number = 300) {

	const addrs: string[] = yield* dns.resolve4(hostName)
	if (addrs.length === 0) return Error('DNS: no addresses to connect')

	const fail = Ch()
	const connectJobs = pool(go(connect, addrs.shift()!))

	go(function* () {
		for (;;) {
			yield* Timeout.race(delay, fail)  // can race Ch or other prcS
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
		yield* fail.put()
	}

	return Error("All attempted connections failed")
}


function pool(jobs: Job[]) {
	let count = jobs.length   // ._childs = jobs
	const jobDoneCh = Ch()
	for (const job of jobs) {
		job.onDone(j => {
			--count
			jobDoneCh.putAsync(j)
		})
	}

	function go(...args) {
		++count
		go(...args)
	}

	return {count, rec: jobDoneCh.rec, go}
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

	const attempts = pool(go(attempt, "args"))
	attempts.go(attempt, "args")  // typed

	// other pool
	const connectJobs = pool<typeof connect>()
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
