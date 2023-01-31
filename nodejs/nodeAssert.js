import assert from "node:assert/strict"

try {
	assert.deepEqual(new Set(["uno", "dos"]), new Set(["uno", "os", "tres"]))
} catch (e) {
	console.log(e)
	/*
[
  'stack',
  'message',
  'generatedMessage',
  'name',
  'code',
  'actual',
  'expected',
  'operator'
]
	*/
}





