import { parentPort } from "worker_threads";

parentPort.on('message', msgObj => {
    parentPort.postMessage(msgObj);
})