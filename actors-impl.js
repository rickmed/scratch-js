class _ArrayQueue {

	constructor(capacity) {
		this.capacity = capacity
		this._array = []
		this.EMPTY = 1
	}

	pull() {
		if (_array.length === 0) {
			return this.EMPTY
		}
		return this.buffer.pop()
	}
	push(x) {
		return this._array.unshift(x)
	}
	get overCapacity() {
		return this._array.length > this.capacity
	}
}

let currentCh
class _Channel {

	static SEND = 1
	static REC = 1
	static OVER_CAP = 3
	#queue

	constructor(capacity) {
		this.#queue = new _ArrayQueue(capacity)
		this.currentSendingMsg = undefined

		// both are Queue<Process>
		this.waitingReceivers = new _ArrayQueue(Number.MAX_SAFE_INTEGER)
		this.waitingSenders = new _ArrayQueue(Number.MAX_SAFE_INTEGER)
	}

	send(msg) {
		this.currentSendingMsg = msg
		currentCh = this
		return _Channel.SEND
	}
	rec() {
		currentOp.ch = ch_
		return _Channel.REC
	}
	_push() {
		const _queue = this.#queue
		_queue.push(this.currentSendingMsg)
		if (_queue.overCapacity) {
			return _Channel.OVER_CAP
		}
	}
	_pull() {

	}
}


function Ch(capacity = 1) {
	return new _Channel(capacity)
}

class _Process {
	constructor(genObj) {
		this._genObj = genObj
	}
	start() {
		const {done, value} = this._genObj.next()
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

		if (value === _Channel.SEND) {

			const res = currentCh._push()

			if (res === _Channel.OVER_CAP) {
				waitingSenders.push(this)
				return
			}

			this.resume()
		}
		if (value === _Channel.REC) {

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

	new _Process(genObj).start()
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
