function* fn1(x: string) {
	return 5
}

function fn2() {
	return 5
}

function* hi() {
	const res = yield* fn1(5)
	console.log(res)
}

hi()

function int(gen) {

	for (;;) {
		const {done, value} = gen.next()
		if (done) return value
	}
}