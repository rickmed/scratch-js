import { sleep } from "effect/Effect"
import dns from "node:dns/promises"
import net from "node:net"
import {Timeout, any} from "ribu"
import { err } from "./error-modeling.js"
import { getOption } from "effect/Context"


/* Happy EyeBalls in pseudo-english:
	launch attempt
	if any of the previous in-flight attempts failed or a timeout fires:
		launch another one
	cancel all in-flight when one attempt is succesful.
*/


// Notes:
	// If we were in mutithreaded environment, +1 socket could be done succesfully
		// at the same time. So need to keep track and cancel the rest.
	// any ignores prcS that resolve with "Cancelled"

function* happyEB(hostName: string, port: number, waitTime: number) {
	const addrsS: string[] = yield dns.resolve4(hostName)
	const inFlight = any<Timeout | typeof connect>()

	let timeout = Timeout(waitTime)
	inFlight.go(timeout)

	while (inFlight.count) {
		if (addrsS.length > 0) {
			inFlight.go(connect(addrsS.shift()!))
		}
		const val = yield* inFlight.rec
		if (err(val) || Timeout) {
			yield* inFlight.go(timeout.restart())
			continue
		}
		// a connection succeeded
		yield* inFlight.cancel()
		return val
	}

	return Error("all connections failed")
}



function connect(addrs: string) {
	const socket = new net.Socket()
	const prc = go_()

	onCancel(socket.destroy)

	socket.on("error", (e) => {
		prc.resolve(e)
	})
	socket.on("ready", () => {
		prc.resolve(socket)
	})
	socket.connect(443, addrs)
	return prc
}


function anyVal<P>() {
	return {
		get rec() {
			return (function* () {return true})()
		},
		get notDone() {
			return true
		},
		go(...x: unknown[]) {}
	}
}
