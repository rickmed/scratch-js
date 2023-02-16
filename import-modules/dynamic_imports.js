const mods = await import("./module2.js")

for (const k in mods) {
	console.log(mods[k])  // prints 1 and 2
}


console.log([].length === 0)