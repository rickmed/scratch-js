const fixed = limit => ({
	unreleased: [],
	released: [],
	release(put) {
		this.released.push(put)
		put.resolve(true)
	},
	push(put) {
		if (this.released.length === limit) {
			this.unreleased.push(put)
		} else {
			this.release(put)
		}
	},
	shift() {
		if (!this.released.length) return

		var next = this.released.shift()

		var waiting = this.unreleased.shift()
		if (waiting) this.release(waiting)

		return next
	},
	isEmpty() { return !this.released.length }
})







function ch<ChV>(n = 1) {

	const buffer = fixed(n)

	const ch = {
		buffer,
		isClosed: false,
		takes: [],
		// then: (x: (value: unknown) => void, y: (value: unknown) => void) => take(ch).then(x, y)   // this is bc a "await ch" is an implicit take
		then(x, y) {
			take(ch).then(x, y)
		}
	}

	return ch
}




function take(ch) {

	console.log("taking")

	var take = createAction()
	var put = !ch.buffer.alwaysUse && ch.buffer.shift()

	// implicit ch
	// if (put && put.then) {
	// 	return put.then(_put => {
	// 		run(ch, _put, take)
	// 		return take.promise
	// 	})
	// }

	if (put) {
		run(ch, put, take)
	} else {
		if (ch.isClosed) take.resolve(CLOSED)
		else ch.takes.push(take)
	}

	return take.promise
}


function run(ch, put, take) {
	take.resolve(put.payload)
	put.resolve && put.resolve(true)
}


function put(ch, v) {

	var put = createAction({ payload: v })


	var take = !ch.buffer.alwaysUse && ch.takes.shift()

	if (take) {
		run(ch, put, take)
	} else {
		ch.buffer.push(put)
	}

	return put.promise
}


function createAction(config = {}) {
	let _resolve;
	return {
		payload: config.payload,
		resolve: (payload) => _resolve(payload),
		promise: new Promise((res) => {
			_resolve = res
		})
	}
}











const ch1 = ch<string>()

async function child() {
	const res = await put(ch1, "yo")
	console.log("child done", res)
}

async function main() {
	child()
	console.log("child launched")
	console.log(ch1)
	const x = await ch1
	console.log(x)
}


main()