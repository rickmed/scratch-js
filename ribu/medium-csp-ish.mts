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
		then(x, y) {
			take(ch).then(x, y)
		}
	}

	return ch
}


function take(ch) {

	var take = createAction()
	var put = !ch.buffer.alwaysUse && ch.buffer.shift()

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


/* Use it */

// const ch1 = ch<string>()

// async function child() {
// 	const res = await put(ch1, "yo")
// }

// async function main() {
// 	child()
// 	const x = await ch1
// 	console.log(x)
// }


// main()



const player = async (name, table) => {
  while (true) {

    const ball = await take(table)
    if (ball === CLOSED) break

    ball.hits++
    console.log(`${name} ${ball.hits}`)
    await sleep(100)
    put(table, ball)
  }
}

const start = async () => {

  const table = chan()

  player('ping', table)
  player('pong', table)

  put(table, { hits: 0 })
  await sleep(1000)

  close(table)
}

start()



const player = async (name, table) => {
	while (true) {
	  const ball = await take(table)
	  
	  ball.hits++
	  console.log(`${name} ${ball.hits}`)
	  await sleep(100)
	  put(table, ball)
	}
 }

 const start = async () => {

	const table = chan()

	const p1 = player('ping', table)
	const p2 = player('pong', table)

	put(table, { hits: 0 })
	await sleep(1000)

	await cancel(p1, p2)
 }

 start()