import assert from "node:assert/strict";

try {
	assert.deepStrictEqual(1, 2)
}
catch(e) {
	// console.log(Object.getOwnPropertyNames(e))
	// [
	// 	'stack',
	// 	'message',
	// 	'generatedMessage',
	// 	'name',
	// 	'code',
	// 	'actual',
	// 	'expected',
	// 	'operator'
	//  ]

	console.log(e)

	// console.log(e.name)
}