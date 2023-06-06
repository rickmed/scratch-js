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
		return this.#array.pop()
	}
	push(x) {
		return this.#array.unshift(x)
	}
}


let scheduledProcs = new Set()
function runScheduledProcs() {
	for (const proc of scheduledProcs) {
		scheduledProcs.delete(proc)
		proc.run()
	}
}

let currentProc = undefined

const RESUME = 1
const PARK = 2
const RIBU_YIELD_VAL = 4632

class Process {

	#gen
	#execNext
	#transitMsg

	constructor(gen) {
		this.#gen = gen
		this.#execNext = RESUME
		this.#transitMsg = undefined   // bc first gen.next(val) is ignored
	}

	run() {
		currentProc = this

		let done = false
		while (true) {

			const execNext = this.#execNext

			if (execNext === PARK) {
				break
			}
			if (execNext === RESUME) {
				const yielded = this.#gen.next(this.#transitMsg)

				if (done = yielded.done) {
					break
				}

				const yieldedVal = yielded.value

				// a chan operation or sleep
				if (yieldedVal === RIBU_YIELD_VAL) {
					continue  // since both place necessary context in proc for next loop
				}

				// a go() call
				if (yieldedVal?.RIBU_YIELD_VAL) {
					// TODO
					continue
				}

				// yielded a promise
				if (typeof yieldedVal?.then === "function") {
					const procBeingRan = currentProc
					yieldedVal.then(val => {
						procBeingRan.setResume(val)
						procBeingRan.run()
					}, err => {
						// TODO
					})
					procBeingRan.setPark()
					break
				}

				throw new Error(`can't yield something that is not a channel operation, sleep, go() or a promise`)
			}
		}

		if (done) {
			// TODO
		}

		runScheduledProcs()
	}
	pullTransitMsg() {
		const transitMsg = this.#transitMsg
		this.#transitMsg = undefined
		return transitMsg
	}
	setResume(transitMsg) {
		this.#execNext = RESUME
		this.#transitMsg = transitMsg
	}
	setPark(transitMsg) {
		this.#execNext = PARK
		this.#transitMsg = transitMsg
	}
	setSchedule(transitMsg) {
		this.#execNext = RESUME
		this.#transitMsg = transitMsg
		scheduledProcs.add(this)
	}
}


class Channel {

	#buffer
	#waitingReceivers
	#waitingSenders

	constructor(capacity) {
		this.#buffer = new _ArrayQueue(capacity)
		this.#waitingReceivers = new _ArrayQueue()//<Process>
		this.#waitingSenders = new _ArrayQueue()//<Process>
	}

	put(msg) {

		if (this.#buffer.isFull) {
			this.#waitingSenders.push(currentProc)
			currentProc.setPark(msg)
			return RIBU_YIELD_VAL
		}

		// buffer is not full so current process can continue
		currentProc.setResume()

		// if waiting receivers, put msg directly, no need to buffer
		if (!this.#waitingReceivers.isEmpty) {
			const receivingProc = this.#waitingReceivers.pull()
			receivingProc.setSchedule(msg)
			return RIBU_YIELD_VAL
		}

		this.#buffer.push(msg)
		return RIBU_YIELD_VAL
	}
	rec() {

		const buffer = this.#buffer

		if (buffer.isEmpty) {
			this.#waitingReceivers.push(currentProc)
			currentProc.setPark()
			return RIBU_YIELD_VAL
		}

		const waitingSenders = this.#waitingSenders
		if (!waitingSenders.isEmpty) {
			const senderProc = waitingSenders.pull()
			buffer.push(senderProc.pullTransitMsg())
			senderProc.setSchedule()
		}

		currentProc.setResume(buffer.pull())
		return RIBU_YIELD_VAL
	}
}


export function go(gen_or_genFn) {

	let gen
	if (gen_or_genFn.constructor?.name === "GeneratorFunction") {
		gen = gen_or_genFn()
	}
	else if (Object.prototype.toString.call(gen_or_genFn) === "[object Generator]") {
		gen = gen_or_genFn
	}
	else {
		throw new Error("RIBU: You must pass in a generator or a generator function")
	}

	new Process(gen).run()
}

export function Ch(capacity = 100) {
	return new Channel(capacity)
}

export function sleep(ms) {
	const procBeingRan = currentProc
	setTimeout(() => {
		procBeingRan.setResume()
		procBeingRan.run()
	}, ms)
	procBeingRan.setPark()
	return RIBU_YIELD_VAL
}



function* player(name, table) {
	while (true) {
		let ball = yield table.rec()
		ball.hits += 1
		console.log(`${name} ${ball.hits}`)
		yield sleep(1300)
		yield table.put(ball)
	}
 }


 function* main() {
	const table = Ch(2)
	go(player("ping", table))
	go(player("pong", table))
	yield table.put({hits: 0})
}


go(main)




























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
