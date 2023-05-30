import { parentPort } from "worker_threads";

let msgs = []

parentPort.on('message', msg => {

	msgs.push(performance.now() - msg)

	if (msgs.length === 40) {
		console.log("msgs from parent", msgs)
	}

    parentPort.postMessage(performance.now());
})