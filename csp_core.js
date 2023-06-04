class _ArrayQueue {

	#capacity
	#array

	constructor(capacity = Number.MAX_SAFE_INTEGER) {
		this.#capacity = capacity
		this.#array = []
	}

	get isFull() {
		return this.#array.length === this.#capacity
	}
	pull() {
		return this.buffer.pop()
	}
	push(x) {
		return this.#array.unshift(x)
	}
}

// this is an optimization instead of ch.send()|rec() returning objects with the necessary info
let currentCh

class Channel {

	static SEND_OVER_CAPACITY = 1
	static SEND_OK = 2
	static OP_REC = 1
	#queue

	constructor(capacity) {
		this.#queue = new _ArrayQueue(capacity)
		this.currentSendingMsg = undefined

		this.waitingReceivers = new _ArrayQueue()//<Process>
		this.waitingSenders = new _ArrayQueue()//<Process>
	}

	send(msg) {
		const queue = this.#queue
		if (queue.isFull) {
			queue.push(this.currentSendingMsg)
			return Channel.SEND_OVER_CAPACITY
		}
		queue.push(this.currentSendingMsg)
		return Channel.SEND_OK
	}
	rec() {
		currentCh = this
		return Channel.OP_REC
	}
	_push() {

	}
	_pull() {

	}
}

export function Ch(capacity = 100) {
	return new Channel(capacity)
}


class Scheduler {

	constructor() {
		this.scheduledProcs = new Set()
	}

	runScheduledProcs() {
		for (const proc of runnableProcs) {
			proc.run()
		}
	}
}


class Process {

	constructor(genObj, scheduler) {
		this.genObj = genObj
		this.scheduler = scheduler
		this.receivingMsg = undefined
	}

	run() {

		const receivingMsg = this.receivingMsg  // set by proc sending on a channel, promise, cb...

		// not really necessary but just in case someone does something unsound like
			// const x = sleep(10)
			// const x = ch.send(y)
			// they would be receiving a value from a previous operation
		this.receivingMsg = undefined


		let {done, value} = this.genObj.next(receivingMsg)   // first gen.next() is ignored so is ok if passing undefined
		while (!done) {

			// value can be:
				// a command to ch send
				// a command to ch rec
				// a sleep
				// a promise

			// when send I need: {procSending (this), ch, msg}
			// CONTINUE HERE: ch.send() returns "OK" or "OVER CAP"
			if (value === Channel.SEND_OVER_CAPACITY) {

				waitingSenders.push(this)
				this.#parkProcess()
				if (currentCh._push() === Channel.SEND_OVER_CAPACITY) {
					return
				}

				this.#resume()
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
			if (this.#handleYield(value) === Process.PARK_PROC) {
				break
			}
			({done, value} = genObj.next())
		}
		if (!done) {
			this.#parkProcess(this)
			return
		}

		// ??? throw if a yielded value is something weird like a number

	}
	schedule() {
		this.scheduler.scheduledProcs.add(this)
	}
}

let scheduler;
export function go(gen_or_genFn) {

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

	if (scheduler === undefined) {
		scheduler = new Scheduler()
	}

	// TODO: maybe no need to schedule the proc, just run it.
	new Process(genObj, scheduler).schedule()
	scheduler.runScheduledProcs()
}



function* first(ch) {
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

const ch = Ch(3)
go(first(ch))
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
