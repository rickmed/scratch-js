import {expect} from "expect";

try {
	expect(1).toBe(2)
}
catch(e) {
	// console.log("\n")
	// console.log(e.matcherResult.message)
	// console.log("\n")
	// console.log(e.stack)
	// console.log("\n")
	// console.dir(e)

	console.log(e.name)
}
