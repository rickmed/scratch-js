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


class Channel {

	static currentOp = undefined
	static SEND_OK = 1
	static SEND_OVER_CAPACITY = 2
	static REC = 3

	constructor(capacity) {
		this._buffer = new _ArrayQueue(capacity)
		this._waitingReceivers = new _ArrayQueue()//<Process>
		this._waitingSenders = new _ArrayQueue()//<Process>
	}

	send(msg) {
		const {_buffer, _waitingReceivers} = this

		if (!_waitingReceivers.isEmpty) {
			_waitingReceivers.pull().schedule()
		}

		if (_buffer.isFull) {
			_buffer.push(msg)
			this._waitingSenders.push(Process.currentProc)
			Channel.currentOp = Channel.SEND_OVER_CAPACITY
			return
		}

		_buffer.push(msg)
		Channel.currentOp = Channel.SEND_OK
	}
	rec() {
		Channel.currentOp = Channel.REC
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

	static currentProc = undefined

	constructor(genObj, scheduler) {
		this.genObj = genObj
		this.scheduler = scheduler
		this.receivingMsg = undefined
	}

	run(val) {

		Process.currentProc = this

		let {done, value} = this.genObj.next(val)
		while (!done) {

			if (Channel.currentOp === Channel.SEND_OK) {
				Channel.currentOp = undefined
				continue
			}

			if (Channel.currentOp === Channel.SEND_OVER_CAPACITY) {
				Channel.currentOp = undefined
				return
			}

			if (Channel.currentOp === Channel.REC) {
				/* 2 cases:
					- when proc is being ran:
						- Need to look into some channel.
					- when proc is ran from being scheduled
				 */

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

		// when proc is "parked" (while continue) or done, need to run scheduled procs

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

function sleep(ms) {
	setTimeout(() => {
		// process.schedule() and runScheduledProcs()
		// or process.run(undefined) but need to know which proc is being ran
		Process.currentProc.run()
	}, ms);
	// this function returns undefined which will be yielded in while loop
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
