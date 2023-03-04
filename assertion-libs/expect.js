import {expect} from "expect";

try {
	expect(1).toBe(2)
}
catch(e) {
	// console.dir(e)
	// [ 'stack', 'message', 'matcherResult' ]

	console.log(e.matcherResult)
	// [ 'actual', 'expected', 'message', 'name', 'pass' ]
	// name is operatorName
	// pass: true | false
	// console.log("\n")
	// console.log(e.matcherResult.message)
	// console.log("\n")
	// console.log(e.stack)
	// console.log("\n")

	// console.log(e)
}
