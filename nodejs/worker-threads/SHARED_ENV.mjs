import { Worker, SHARE_ENV } from 'node:worker_threads'

const worker1 = `
	
`

process.env.obj = obj

const worker = new Worker(worker1, {eval: true, env: SHARE_ENV })

worker.on("exit", _ => {
	console.log("main: ", obj1.hi)
})
