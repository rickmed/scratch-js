import x from "./legacy-module.cjs"

console.log(x.x)  // 4


const mods = await import("./module2.js")

for (const k in mods) {
	console.log(mods[k])  // prints 1 and 2
}


console.log([].length === 0)


const legacyModule = await import("./legacy-module.cjs")

console.log(legacyModule.x)  // 4