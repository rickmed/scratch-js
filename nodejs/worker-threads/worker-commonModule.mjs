import { obj1 } from './commonModule.mjs'

obj1.hi = 11
console.log("changed to: ", obj1.hi)

// console.log("from worker: ", process.env.obj)