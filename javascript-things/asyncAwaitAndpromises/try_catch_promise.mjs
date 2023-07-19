function test() {
	return Promise.resolve(1).then(data => {
		// console.log(data)
		throw new Error("not equal")
	})
}

try {
	await test()
}
catch(e) {
	console.log("catched! ", e)
}
