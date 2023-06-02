class _ArrayQueue {
	#capacity
	#array

	constructor(capacity = Number.MAX_SAFE_INTEGER) {
		this.#capacity = capacity
		this.#array = []
	}

	get isEmpty() {
		return this.#array.length === 0
	}
	pull() {
		return this.buffer.pop()
	}
	get overCapacity() {
		return this.#array.length > this.#capacity
	}
	push(x) {
		return this.#array.unshift(x)
	}
}

let currentCh
class Channel {

	static OP_SEND = 1
	static OP_REC = 1
	static OVER_CAPACITY = 3
	#queue

	constructor(capacity) {
		this.#queue = new _ArrayQueue(capacity)
		this.currentSendingMsg = undefined

		// both are Queue<Process>
		this.waitingReceivers = new _ArrayQueue()
		this.waitingSenders = new _ArrayQueue()
	}

	send(msg) {
		this.currentSendingMsg = msg
		currentCh = this
		return Channel.OP_SEND
	}
	rec() {
		currentOp.ch = ch_
		return Channel.OP_REC
	}
	_push() {
		const queue = this.#queue
		queue.push(this.currentSendingMsg)
		if (queue.overCapacity) {
			return Channel.OVER_CAPACITY
		}
	}
	_pull() {

	}
}


function Ch(capacity = 1) {
	return new Channel(capacity)
}

class Process {

	#genObj

	constructor(genObj) {
		this.#genObj = genObj
		this.runnableProcesses = new _ArrayQueue()
	}

	start() {
		const {done, value} = this.#genObj.next()
		this.#handleYield(value)
	}
	resume() {
		let {done, value} = genObj.next(x)
		while (!done) {
			this.#handleYield(value)
			({done, value} = genObj.next())
		}
	}
	#handleYield(value) {
		// value can be:
			// a command to ch send
			// a command to ch rec
			// a sleep
			// a promise

		if (value === Channel.OP_SEND) {

			const res = currentCh._push()

			if (res === Channel.OVER_CAPACITY) {
				waitingSenders.push(this)
				return
			}

			this.resume()
		}

		if (value === Channel.OP_REC) {

			const {ch: {queue}} = currentOp
			const msg = queue.pull()

			if (msg === queue.EMPTY) {
				queue.waitingReceivers.unshift(this)
				return
			}

			if (queue.waitingSenders.length > 0) {

			}
			// need to check if there are waiting senders to run them

			this.resume(msg)
		}
	}
}

function go(gen_or_genFn) {

	let genObj
	if (gen_or_genFn.constructor?.name === "GeneratorFunction") {
		genObj = gen_or_genFn()
	}
	else if (Object.prototype.toString.call(gen_or_genFn) === "[object Generator]") {
		genObj = gen_or_genFn
	}
	else {
		throw new Error("You must pass in a generator function or generator object")
	}

	new Process(genObj).start()
}



function* first() {
	const ch = Ch()
	let num = 0
	while (true) {
		yield ch.send(num++)
	}
}

function* second(ch) {
	while (true) {
		yield sleep(100)
		const msg = yield ch.rec()
		console.log(msg)
	}
}

const ch = go(first)
go(second(ch))

























// async function* player(name) {
// 	while (true) {
// 		let msg = yield rec();
// 		// let {sender, msg} = yield take()

// 		msg.hits += 1;
// 		console.log(`${name} hits. Total hits: ${msg.hits}`);

// 		yield sleep(500)
// 		yield out(msg);
// 		// or yield out(msg, sender)
// 	}
// }


// const p1 = fork(player, "ping")
// const p2 = fork(player, "pong")
// p1.pipe(p2)
// p2.pipe(p1)
// send(p1, {hits: 0})

// // or
// // let p1 = fork(player, "ping")
// // p1.pipe(player, "pong").pipe(p1)
// //

// yield put(table, { hits: 0 });

/**** self() api options ***

// need to access selfPID() here somehow
spawn(function* coor({pid}) {
	coor.pid

})

*/
