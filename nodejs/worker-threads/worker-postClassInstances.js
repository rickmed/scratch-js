import { Worker, isMainThread, parentPort } from "node:worker_threads"
import { fileURLToPath } from 'url';

// class VerifyError extends Error {
//     constructor(opts) {
//         super(opts.message)
//         Object.assign(this, opts)
//     }
// }
// const verErr = new VerifyError({hey: 'yo'})

class MyClass {
    hi = "hi "
    greet(str) {
        console.log(this.hi + str)
    }
}

if (isMainThread) {
	const worker = new Worker(fileURLToPath(import.meta.url))
	const obj = new MyClass('hello')

	worker.on("message", obj => {
		// reconstruct methods
		Object.setPrototypeOf(obj, MyClass.prototype);
		obj.greet("from main")
	})

	worker.postMessage(obj)
}
else {
	parentPort.on('message', obj => {
		Object.setPrototypeOf(obj, MyClass.prototype);
		obj.greet("from worker")
		parentPort.postMessage(obj)
	})
}
