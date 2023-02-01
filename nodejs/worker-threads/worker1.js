import { parentPort } from "worker_threads";

parentPort.on('message', msg => {
    parentPort.postMessage(msg);
	console.log("worker", process.stdout.isTTY)
})