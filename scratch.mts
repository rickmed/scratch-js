const x: number = "f"

const  { promise, resolve, reject } = Promise.withResolvers<number>()

resolve(4)

promise.then(res => {})