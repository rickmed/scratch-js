import { Worker } from "node:worker_threads"

class VerifyError extends Error {
    constructor(opts) {
        super(opts.message)
        Object.assign(this, opts)
    }
}
const verErr = new VerifyError({hey: 'yo'})

class MyClass {
    constructor(hi) {
        this.hi = hi
    }
    hey() {
        console.log(this.hi + ' yo')
    }
}


const mine = new MyClass('hello')

console.log(JSON.stringify(mine));

const worker = new Worker('./worker1')

worker.on("message", obj => {
    console.log('parent: ');
    // reconstruct methods
    Object.setPrototypeOf(obj, MyClass.prototype);
    obj.hey()
})


worker.postMessage(mine)
