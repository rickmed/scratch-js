import { ArrSet, Events } from "./data-structures.mjs"
import { E, ECancOK, Errors, isE } from "./ribu-errors.mjs"
import { runningJob, sys, theIterator } from "./system.mjs"

export const GenFn = (function* () { }).constructor

function isGenFn(x: unknown): x is GenFn {
	return x instanceof GenFn
}

const errify = (x: unknown) => x instanceof Error ? x : E("RibuErr", JSON.stringify(x))


/* observe-resume model:

	- Things subscribe to job._on(EV.JOB_DONE, cb) event when want to be notified
	when observingJob is done.

	- Jobs observing other jobs (yield*) insert cb :: (jobDone) => observer._resume()
		- There's no way for user to stop observing a job.
			- When yield* job.cancel() is called and additional observer is added,
			and the other observers (yield* job.$) are resumed when job settles
			(with CancOK|Errors in this case)

	- Cancellation (and removal of things I'm observing)
		- Set callbacks (eg: setTimeout) need to be removed on cancellation
			(as opposed of cb being "() => if job === DONE; return")
		bc, eg, nodejs won't end process if timeout cb isn't cleared.

	- Channels:
		- Removing a job from within a queue is expensive, so channel checks
		if job === DONE and skips it (removed from queue and not resumed)
*/

/* Internals:
	- [genFnReturned, genThrew, cancel...] -> endProtocol() -> _#Settle()
	- endProtocol() is always called bc there may be activeChilds, timeout, onEnd...
*/


export function go<Args extends unknown[], T>(genFn: GenFn<T, Args>, ...args: Args) {
	return new Job<GenFnRet<typeof genFn>, Errors | ECancOK>(true, genFn as GenFn, args)
}


/* Events names */
const EV = {
	JOB_DONE: "job.done",
	JOB_DONE_WAITCHILDS: "job.done.waitChilds"
} as const


/* Types */
export type Yieldable = PARK | RESUME | Promise<unknown>  // todo

export type Gen<Ret = unknown, Rec = unknown> =
	Generator<Yieldable, Ret, Rec>

type GenFn<T = unknown, Args extends unknown[] = unknown[]> =
	(...args: Args) => Generator<Yieldable, T>

type GenRet<Gen_> =
	Gen_ extends
	Gen<unknown, infer Ret> ? Ret
	: never

type GenFnRet<GenFn> =
	GenFn extends
	(...args: any[]) => Generator<unknown, infer Ret> ? Ret
	: never

type FnOf<T = unknown> = () => T
type OnEnd =
	FnOf | Disposable |
	FnOf<PromiseLike<unknown>> | AsyncDisposable | GenFn

type JobDoneCB<Ret> = (j: Job<Ret>) => void
type State = "RUN" | "PARK" | "GENFN_DONE" | "WAIT_CHILDS" | "CANCEL" | "DONE_OK" | "DONE_ERR"

const tryFnFailed = Symbol("f")

/* Job class */
export class Job<Ret = unknown, Errs = unknown> extends Events {

	val: Ret | Errs = "$dummy" as (Ret | Errs)
	_gen: Gen
	_name: string
	_state: State = "RUN"
	_next: undefined | "cont" | "$"  // implement with ._state
	_childs: undefined | ArrSet<Job<Ret>>
	_parent: undefined | Job
	_sleepTO: undefined | NodeJS.Timeout
	_onEnd: undefined | OnEnd | OnEnd[]

	constructor(withParent: boolean, genFn: GenFn, ...args: unknown[]) {
		super()
		this._gen = genFn(...args)
		this._name = genFn.name
		if (withParent) {
			this.#addAsChild()
		}
		this._resume()
	}

	#addAsChild() {
		const parent = sys.running
		if (!parent) return
		let parentCs = parent._childs
		if (!parentCs) parent._childs = parentCs = new ArrSet()
		parentCs.add(this)
		this._parent = parent
	}


/*

Need to configure somehow how the caller/observer needs to be resumed;
	- if called .cont (resume with observing.val) or .$ (settle with callee.val).
	Since a job can only be parked in one place at a time, the configuration
	can be placed at the caller's obj so caller.resume() checks its ._next
	when it is called by observed/this job
*/

	// cont
	get cont() {
		runningJob()._next = "cont"
		return JobIterable as JobIterable<Ret>
	}

	get $() {
		runningJob()._next = "$"
		return JobIterable as JobIterable<Ret>
	}

	get orEnd() {
		return this.$
	}

	// todo: ._next = undefined when done resuming
	// if the job I'm observing finishes with DONE_ERR:
		// need to check if this.const or .$
/*
Need to receive the doneJob I'm observing to see if it ended at "DONE_ERR" or "DONE_OK"
	to see if I need to resume or settle.

	
*/


	_resume(IOmsg?: unknown): void {

		// todo: is this necessary? what IO is _resuming when job is done?
		if (this._state === "DONE") {
			return
		}

		// CONTINUE undersanding how this works below to finish it

		sys.stack.push(this)

		for (; ;) {
			this._setResume(IOmsg)

			try {
				var yielded = this._gen.next()  // eslint-disable-line no-var
			}
			catch (e) {
				this.#endProtocol([errify(e)])
				return
			}

			sys.stack.pop()

			if (yielded.done) {
				this.#genFnReturned(yielded.value as Ret)
			}

			// ?? done === false, ie, park
			return
		}
	}

	#genFnReturned(yieldVal: Ret) {
		this.val = yieldVal
		this._state = "GENFN_DONE"
		if (this._childs?.size) this._waitChilds()
		else this.#endProtocol()
	}

	_waitChilds() {

		this._state = "WAIT_CHILDS"
		const childs = this._childs!
		const thisJ = this

		let nCs = childs.size
		let nCsDone = 0

		for (let i = 0; i < nCs; i++) {
			const c = childs.arr_m[i]
			if (c) c._on(EV.JOB_DONE_WAITCHILDS, cb)
		}

		function cb(childDone: Job) {
			++nCsDone
			if (childDone._state === "DONE_ERR") {
				thisJ.#offWaitChildsCBs()
				thisJ.#endProtocol([childDone.val] as Error[])
				return
			}
			if (nCsDone === nCs) {
				thisJ.#endProtocol()
			}
		}

	}

	#offWaitChildsCBs() {
		const cs = this._childs!
		const csL = cs.size
		for (let i = 0; i < csL; i++) {
			const c = cs.arr_m[i]
			if (c) c._offAll(EV.JOB_DONE_WAITCHILDS)
		}
	}

	cancel() {
		// if (state === CANCEL | done ) add new observer; return
		// if DONE, resolve caller immediately

		// todo: check these lines
		const caller = runningJob()
		this._on(EV.JOB_DONE, (j: Job) => {
			caller._resume()
		})


		// reuse this.val since it won't be anything returned by genFn
		this.val = caller._name as Ret

		const { _state, _childs } = this

		// todo: need to change state in ridRscs so && _childs is superfluous
		if (_state === "WAIT_CHILDS" && _childs) {
			this.#offWaitChildsCBs()
		}

		this._state = "CANCEL"
		this.#endProtocol()
		return this
	}

	#endProtocol(errs?: Error[]) {
		const { _childs: cs, _sleepTO, _onEnd: ends } = this

		if (_sleepTO) clearTimeout(_sleepTO)

		if (!(ends || (cs && cs.size > 0))) {
			this.#_settle(errs)
			return
		}

		const self = this
		let nAsyncWaiting = 0
		let nAsyncDone = 0
		let errors: undefined | Error[]

		if (cs) {
			nAsyncWaiting += cs.size
			const { arr_m } = cs
			const chsL = arr_m.length
			for (let i = 0; i < chsL; i++) {
				const c = arr_m[i]
				if (c) {
					c.cancel()
					c._on(EV.JOB_DONE, jDone)
				}
			}
		}

		if (ends) {
			if (Array.isArray(ends)) {
				const l = ends.length
				for (let i = l; i >= 0; --i) {  // called LIFO
					execEnd(ends[i]!)
				}
			}
			else execEnd(ends)
		}

		function execEnd(x: OnEnd): void {
			if (isGenFn(x)) {
				++nAsyncWaiting
				new Job(false, x)._on(EV.JOB_DONE, jDone)
			}
			else if (x instanceof Function) {
				const endRet = tryFn(x)
				if (endRet === tryFnFailed) return
				if (isProm(endRet)) {
					++nAsyncWaiting
					endRet.then(_ => asyncDone(), x => asyncDone(errify(x)))
				}
				// else: is () => !Promise, so it's already ran
			}
			else if (Symbol.dispose in x) {
				tryFn(x[Symbol.dispose].bind(x))
			}
			else {
				++nAsyncWaiting
				x[Symbol.asyncDispose]().then(_ => asyncDone(), x => asyncDone(errify(x)))
			}
		}

		function tryFn(fn: FnOf) {
			try {
				var res = fn()
			}
			catch (e) {
				if (!errs) errs = []
				errs.push(errify(e))
				return tryFnFailed
			}
			return res
		}

		function asyncDone(x?: Error) {
			++nAsyncDone
			if (x) {
				if (!errs) errs = []
				errs.push(x)
			}
			if (nAsyncDone === nAsyncWaiting) {
				self.#_settle(errs)
			}
		}

		function jDone(j: Job) {
			asyncDone(j._state === "DONE_ERR" ? j.val as Error : undefined)
		}
	}

	#_settle(errs?: Error[]) {
		const { _state } = this
		const jName = this._name
		// this.val as job.name is reused/hack since this.val won't be used
			// by genFn's return val
		const msg = _state === "CANCEL" ? `Cancelled by ${this.val}` : ""

		if (errs) {
			this.val = new Errors(errs, jName, msg) as Ret
			this._state = "DONE_ERR"
		}
		else {
			if (_state === "CANCEL") {
				this.val = ECancOK(jName, msg) as Ret
			}
			if (isE(this.val) && this.val._op$ !== "") {
				// @ts-ignore ._op$ being readonly
				this.val._op$ = jName
			}

			this._state = "DONE_OK"
		}

		this._emit(EV.JOB_DONE_WAITCHILDS, this)
		this._emit(EV.JOB_DONE, this)
		this._parent?._childs!.delete(this)
		this._parent = undefined
	}

	settle(val: Ret) {
		// todo: maybe job is cancelling itself (or waiting for childs?)
		// maybe a special Job class??
	}

	onEnd(newV: OnEnd) {
		const currV = this._onEnd
		if (!currV) this._onEnd = newV
		else if (Array.isArray(currV)) currV.push(newV)
		else this._onEnd = [currV, newV]
	}
}

function onEnd(x: OnEnd) {
	runningJob().onEnd(x)
}


/* Job Iterables */

type JobIterable<V> = {
	[Symbol.iterator](): Iterator<unknown, V>
}

type TheIterator<V> = Iterator<unknown, V>

const JobIterable = {
	[Symbol.iterator]() {
		return theIterator
	}
}


	// yield* (Symbol.Iterator) can only be called if .rec|.$ is called first.
	// ie, job shouldn't have this method beforehand,
		// but want to avoid create/return a different obj
		[Symbol.iterator](): TheIterator<Ret> {
			const { _state, _next } = this
			if (!_next) {
				// todo: end caller job (bc user needs to call .$ or .if before yield*)
			}
			const runningJ = runningJob()

			// somewhere here:
			// job._on(EV.JOB_DONE, doneJob => {

			// })

			// if this job is alredy resolved, resume caller with the settled value
			if (_state === "DONE") {
				runningJ._setResume(this.val)
			}
			else {
				runningJ._setPark()
				this._addObserver(runningJ)
			}
			return theIterator
		}



/* ** HELPER FNs ***********************************/

/*** all(): waits for all to settle  *******************************************

Usage:
	const jobsArr = yield* all(MyJobs())).$
	then can filter the ones that errored|success|whatever

todo: improve types
*/
function all(pool: Pool<Job>) {
	let res = []
	return go(function* () {
		while (pool.count) {
			res.push(yield* pool.rec)
		}
		return res
	})
}


/*** race(): returns the first resolved (cancel in-flight)  ********************

### jobs OWNERSHIP:
	- race() needs to take ownership of passed jobs, otherwise it breaks composition.
	- Since both passed jobs and the job race() creates are equal childs of
	the caller, if you want to cancel race(), you'd need to cancel all 3 of them.
	For example, race(race(...jobs1), race(...jobs2))
	- So, race() needs to take ownership of the passed jobs so when you cancel
	race(), the passed jobs are cancelled automatically. Works well bc no jobs
	should be active after race() is done, regardless.

### todo: maybe put in Job class so: job1.race(job2)

### CONTINUE: I don't think I need additional cancelling logic:
- If raceJob is cancelled I'd need to prevent jobs to call the onDoneCB.
- If child is cancelled, genFn will be stopped, but then will run observers'
CB with ECancelled; below, it will cancelAll (noop since already cancelled)
and resolve race1Job
	- OPTIONS:
		1) Job have ._observing :: [observed, cb] (so you can call observed.unObserve(cb))
			PRO/CON: maybe a bit faster but + code/memory
		2) Let CBs run and have inside .resolve() "if (amDone) return"
		** Let's see if other resources need to be unobserved

### What if race1 is cancelled while cancelling losing jobs?
	childs will have 2 concurrent cancellation requests; in the one below, childs
	will notify when cancelling is done and raceJ.resolve(j.val) will run, but
	since raceJ is !parked, then nothing will happen after that.

*/
function race1(jobs: Job[]) {
	const raceJ = new Job()  // child of caller.
	steal(raceJ, jobs)  // take ownership (read above)
	for (const j of jobs) {
		j.onDone(j => {
			cancelAll(jobs, res => {  // cancelling a done job is noop
				raceJ.resolve(j.val)  // resolve needs to check if val is Error
			})
		})
	}
	return raceJ
}

function cancellAll(jobs: Job[], cb: (res: 'OK' | Error[]) => void) {
	let nJobs = jobs.length
	let errors: undefined | Error[];
	for (const j of jobs) {
		j.cancelCB(jb => {
			--nJobs
			if (err(jb.val)) {
				if (!errors) errors = []
				errors.push(jb.val)
			}
			if (nJobs === 0) {
				if (errors) cb(errors)
				else cb('OK')
			}
		})
	}
}


function race2(pool: Pool<Job>) {
	return pool().go(function* () {
		const winJob = yield* pool.rec
		yield* pool.cancel().$
		return winJob
	})
}

// CON: needs to instantiate jobDone(): +1 callback and classObj
function race3(jobs: Job[]) {
	return go(function* _race() {
		const done = jobDone(jobs)
		const winner = yield* done
		yield* cancel(jobs)  // cancelling a done job is noop
		// // todo: test if this is faster:
		// const inFlight = jobs.splice(jobs.indexOf(winner), 1)
		// yield* cancel(inFlight)
		return winner
	})
}


/* any(): returns the first succesful (cancel in-flight). If no succesfull,
	collect errors of failed ones.
*/
function any(pool: Pool<Job>) {
	return pool().go(function* () {
		if (!pool.count) return Error("Some error")
		let errors
		while (pool.count) {
			const winJob = yield* pool.rec
			if (!err(winJob.val)) {
				yield* pool.cancel().$
				return winJob
			}
			if (!errors) errors = []
			errors.push(winJob)
		}
		return errors
	})
}





function isProm(x: unknown): x is PromiseLike<unknown> {
	return (x !== null && typeof x === "object" &&
		"then" in x && typeof x.then === "function")
}