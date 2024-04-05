console.log(Object.getOwnPropertyNames(Error.prototype.__proto__))

const obj = {yes: "d"}

// true (is the main POJO proto)
console.log(obj.__proto__ == Error.prototype.__proto__)

// console.log(Object.getOwnPropertyNames(obj.__proto__))
console.log(obj instanceof Object)  // true
console.log(obj instanceof Error)  // false

obj.__proto__ = Error.prototype

console.log(obj instanceof Error)  // true
console.log(obj instanceof Object)  // true

// const e1 = { ["err!!"]: 1, name: "Hi"} as const
// const e2 = { ["err!!"]: 1, name: "hello"} as const

// const x: typeof e1 | typeof e2 | string = Math.random() > 0.5 ? e1 : e2

// // PRO: auto-completes
// // PRO: no import symbol
// // PRO: would appear .jobName
// // CON: need to add more narrowing besides "'err!!' in x>"  if genFn returns
// // 	other things that aren't objecs (this is likely)

// if (typeof x !== "string" && "err!!" in x) {
// 	if (x.name === "Hi") {}
// }

const e1 = { name: "HI"} as const
const e2 = { name: "HI2"} as const

const x: typeof e1 | typeof e2 | string | null = Math.random() > 0.5 ? null : "dsad"

// idem PROs/CONs
// CON: wouldn't appear .jobName
if (x instanceof Error) {
	if (x.name === "Hi") {}
}


console.log("x" in undefined)


/* CONCLUSIONS:
	put [RIBU_ERR_SYMB] and ["e!!"]

*/
