import { ArrayQueue } from "./buffers.mjs"

class CSP_base {

	/** @type Set<Proc<any, any, any>> */
	#scheduledProcs = new Set()

	_currentProc = /** @type {Proc<any, any, any>} */ (/** @type {unknown} */ (undefined))

	/**
	 *  @protected
	 */
	_setTimeout = globalThis.setTimeout


	#runScheduledProcs() {
		for (const proc of this.#scheduledProcs) {
			this.#scheduledProcs.delete(proc)
			proc.run()
		}	
	}
}


export class CSP_api extends CSP_base {

	/** @param {number} ms */
	wait(ms) {
		const procBeingRan = this._currentProc

		this._setTimeout(() => {
			procBeingRan.resume()
			procBeingRan.run()
		}, ms)

		procBeingRan.park()

		return RIBU_YIELD_VAL
	}

	/** @type {(gen_or_genFn: _Ribu.GoGen) => Process_API} */
	go(gen_or_genFn) {

		const gen = typeof gen_or_genFn === "function" ?
			gen_or_genFn() :
			gen_or_genFn

		const process = new Proc(gen)
		process.run()
		return new Process_API(process)
	}

	Ch(capacity = 100) {
		return new Chan(capacity)
	}
}


class Process_API {

	#process

	/** @param {Proc<any, any, any>} process */
	constructor(process) {
		this.#process = process
	}

	/** @todo */
	cancel() {}
}


const RESUME = 1
const PARK = 2
const RIBU_YIELD_VAL = 4632


/** @template TYield, TReturn, TNext */
export class Proc extends CSP_base {

	#gen
	#execNext = RESUME
	#inOrOutMsg = undefined   // bc first gen.next(val) is ignored

	/** @param {Generator<TYield>} gen */
	constructor(gen) {
		super()
		this.#gen = gen
	}

	run() {
		currentProc = this

		let gen_is_done = false
		while (gen_is_done) {

			const execNext = this.#execNext

			if (execNext === PARK) {
				break
			}
			if (execNext === RESUME) {
				const {done, value} = this.#gen.next(this.#inOrOutMsg)

				// .done can absent. If so, means gen is not done
				if (done === undefined || done === true) {
					gen_is_done = true
					break
				}

				// a chan operation or wait
				if (value === RIBU_YIELD_VAL) {
					continue  // since both place necessary context in proc for next loop
				}

				// a go() call
				if (value?.RIBU_YIELD_VAL) {
					// TODO
					continue
				}

				// yielded a promise
				if (typeof value?.then === "function") {
					const procBeingRan = currentProc

					/** @type Awaited<typeof value> */
					const promise = value

					promise.then(val => {
						procBeingRan.resume(val)
						procBeingRan.run()
					}, err => {
						// TODO
					})
					procBeingRan.park()
					break
				}

				throw new Error(`can't yield something that is not a channel operation, wait, go() or a promise`)
			}
		}

		if (gen_is_done) {
			// TODO
		}

		runScheduledProcs()
	}

	// channel only calls park(), resume() or schedule()
	//
	pullTransitMsg() {
		const transitMsg = this.#inOrOutMsg
		this.#inOrOutMsg = undefined
		return transitMsg
	}
	resume(transitMsg) {
		this.#execNext = RESUME
		this.#inOrOutMsg = transitMsg
	}
	park(transitMsg) {
		this.#execNext = PARK
		this.#inOrOutMsg = transitMsg
	}
	schedule(transitMsg) {
		this.#execNext = RESUME
		this.#inOrOutMsg = transitMsg
		scheduledProcs.add(this)
	}
}



/** @template TVal */
export class Chan extends CSP_base {

	/** @type ArrayQueue<TVal> */
	#buffer

	/** @type ArrayQueue<Proc<any, any, any>> */
	#waitingSenders = new ArrayQueue()

	/** @type ArrayQueue<Proc<any, any, any>> */
	#waitingReceivers = new ArrayQueue()


	/** @param {number} capacity */
	constructor(capacity) {
		super()
		this.#buffer = new ArrayQueue(capacity)
	}

	/** @param {TVal} msg */
	put(msg) {

		const {_currentProc: currentProc} = this

		if (this.#buffer.isFull) {
			this.#waitingSenders.push(currentProc)
			currentProc.park(msg)
			return RIBU_YIELD_VAL
		}

		// buffer is not full so current process can continue
		currentProc.resume()

		// if waiting receivers, put msg directly, no need to buffer
		if (!#this.waitingReceivers.isEmpty) {
			const receivingProc = this.waitingReceivers.pull()
			receivingProc.schedule(msg)
			return RIBU_YIELD_VAL
		}

		this.#buffer.push(msg)
		return RIBU_YIELD_VAL
	}
	rec() {

		const buffer = this.#buffer
		const {_currentProc: currentProc} = this

		if (buffer.isEmpty) {
			#this.waitingReceivers.push(currentProc)
			currentProc.park()
			return RIBU_YIELD_VAL
		}

		const waitingSenders = this.#waitingSenders
		if (!waitingSenders.isEmpty) {
			const senderProc = waitingSenders.pull()
			buffer.push(senderProc.pullTransitMsg())
			senderProc.schedule()
		}

		currentProc.resume(buffer.pull())

		return RIBU_YIELD_VAL
	}
}