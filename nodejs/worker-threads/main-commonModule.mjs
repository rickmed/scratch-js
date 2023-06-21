import { Worker, SHARE_ENV } from 'node:worker_threads'
import { obj1 } from './commonModule.mjs'

const obj = {
	epale: 4
}

process.env.obj = obj

const worker = new Worker("./nodejs/worker-threads/worker-test-sharedModule.mjs", {env: SHARE_ENV })

worker.on("exit", _ => {
	console.log("main: ", obj1.hi)
})
