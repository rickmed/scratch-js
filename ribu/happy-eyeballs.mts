import { sleep } from "effect/Effect"
import dns from "node:dns/promises"
import net from "node:net"
import { NotFoundError } from "rxjs"
import { err } from "./error-modeling.js"
import { getOption } from "effect/Context"

// launches a tryConnection
// if the previous launched takes +250ms or fails, it launches another one
// and so on...until one of the in-flight ReqS succedes
// which cancels the rest and returns that result.


// need to use any.  But you can add prc to any dynamically

function* happyEB(hostName: string, port: number, waitTime: number) {
	const addrsS: string[] = yield dns.resolve4(hostName)
	const inFlight = anyVal(go(connect, addrsS.shift()))

	const launchAttempts = go(function* () {
		while (addrsS.length) {
			const attempt = go(connect, addrsS.shift())
			const won = yield* anyPrc(timeout, attemptPrc).rec
			if (won !== attempt || won.doneVal === Error) {
				inFlight.add(attempt)
			}
			// here, this attempt is succesfull, but in the meantime, an inFlight
			// attempt might be already be succesfull
			// I think the best thing would be to somehow put this success into
				// inFlight so that the for loop below can catch it.
			inFlight.put(won.doneVal)  // doneVal is a socket
			return
		}
	})

	for (const ch of inFlight) {
		const socket = yield* ch.rec
		if (notErr(socket)) {
			yield cancel(inFlight, launchAttempts)
			return socket
		}
	}

	return Error()  // all sockets failed
}


function timeout(ms: number): Prc<void> {
	return go(function* () {
		yield sleep(ms)
	})
}


function* connect(socket: net.Socket) {
	return socket instanceof Error ? Error() : true
}




function openTCPSocket()


function timeout(ms: number): Prc<void> {
	return go(function* () {
		yield sleep(ms)
	})
}









const addrsS = await dns.resolve4("google.com")

// const socket = new net.Socket()

// socket.on("error", (e) => {
// 	console.log("ERRRORR:", e)
// })

// socket.on("connect", () => {
// 	console.log("SUCCESS!")
// })

// const addrs = addrsS[0]!
// socket.connect(443, addrs)