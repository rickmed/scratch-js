import { Worker } from "node:worker_threads"

const worker = new Worker('./nodejs/worker-threads/worker1.js')

let msgs = []

worker.on("message", msg => {

	msgs.push(performance.now() - msg)

	console.log("msgs from worker", msgs)

	worker.postMessage(performance.now())

	if (msgs.length === 40) {
		worker.terminate()
	}
})

worker.postMessage(performance.now())
