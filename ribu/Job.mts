import { ArrSet, Events } from "./data-structures.mjs"
import { ECancOK, Errors, isE } from "./ribu-errors.mjs"
import { runningJob, sys } from "./system.mjs"

/* observe-resume model:
	- Things subscribe to job._on(EV.JOB_DONE, cb) event when want to be notified
	when it's done.
	- Jobs observing other jobs (yield*) insert (jobDone) => observer._resume()
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


- Maybe optimize sleep()
- Also, can only use one resource, if need +1, wrap them in one

*/

const errify = (x: unknown) => x instanceof Error ? x : Error(JSON.stringify(x))

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

type Fn = () => unknown
type OnEnd = Fn | AsyncRsc | Disposable | AsyncDisposable

type AsyncRsc = () => PromiseLike<unknown> | (() => Job)
type JobDoneCB<Ret> = (j: Job<Ret>) => void
type State = "RUN" | "PARK" | "GENFN_DONE" | "WAIT_CHILDS" | "CANCEL" | "DONE_OK" | "DONE_ERR"

/* Job class */
export class Job<Ret = unknown, Errs = unknown> extends Events {

	// todo: is observed is done with ECancOK and this._next = "$", continue
	// all other errors, fail this job

	val: Ret | Errs = "$dummy" as (Ret | Errs)
	_gen: Gen
	_name: string
	_state: State = "RUN"
	_next: undefined | "cont" | "$"  // implement with _state
	_childs: undefined | ArrSet<Job<Ret>>
	_parent: undefined | Job
	_sleepTO: undefined | NodeJS.Timeout
	_syncRscs: undefined | Fn | Fn[]
	_asyncRscs: undefined | AsyncRsc | AsyncRsc[]

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

	// yield* (Symbol.Iterator) can only be called if .rec|.$ is called first.
	// ie, job shouldn't have this method, but want to avoid create/return a different obj
	[Symbol.iterator](): TheIterator<Ret> {
		const { _state: _status, _next } = this
		if (!_next) {
			// todo: end caller job (bc user needs to call .$ or .if before yield*)
		}
		const runningJ = runningJob()

		// if this job is alredy resolved, resume caller with the settled value
		if (_status === "DONE") {
			runningJ._setResume(this.val)
		}
		else {
			runningJ._setPark()
			this._addObserver(runningJ)
		}
		return theIterator
	}

	// Need to configure somehow how the caller/observer needs to be resumed;
	// if called .cont (resume with callee.val) or .$ (settle with callee.val).
	// Since a job can only be parked in one place at a time, the configuration
	// can be placed at the caller's obj so caller.resume() checks its ._next
	// when it is called by observed/this job
	get cont(): Job<Ret /* todo: minus Errors + [Symbol.Iterator]() */> {
		runningJob()._next = "cont"
		return this
	}

	get $() {
		runningJob()._next = "$"
		return this
	}

	get orEnd() {
		return this.$
	}

	// todo: ._next = undefined when done resuming
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
				this._ridRscs([errify(e)])
				return
			}

			sys.stack.pop()

			if (yielded.done) {
				this._genFnRet(yielded.value as Ret)
			}

			// ?? done === false, ie, park
			return
		}
	}

	_genFnRet(yieldVal: Ret) {
		this.val = yieldVal
		this._state = "GENFN_DONE"
		if (this._childs?.size) this._waitChilds()
		else this._ridRscs()
	}

	_waitChilds() {

		this._state = "WAIT_CHILDS"
		const cs = this._childs!
		const self = this

		let nCs = cs.size
		let nCsDone = 0

		for (let i = 0; i < nCs; i++) {
			const c = cs.arr_m[i]
			if (c) c._on(EV.JOB_DONE_WAITCHILDS, cb)
		}

		function cb(cDone: Job) {

			++nCsDone

			if (cDone._state === "DONE_ERR") {
				self.#offWaitChildsCBs(cs)
				self._ridRscs([cDone.val] as Error[])
			}

			if (nCsDone === nCs) {
				self._ridRscs()
			}
		}
	}

	#offWaitChildsCBs(cs: ArrSet<Job>) {
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

		const { _state, _childs: cs } = this

		if (_state === "WAIT_CHILDS" && cs) {
			this.#offWaitChildsCBs(cs)
		}

		this._state = "CANCEL"
		this._ridRscs()
		return this
	}

	_ridRscs(errs?: Error[]) {
		const { _syncRscs, _childs, _asyncRscs, _sleepTO } = this

		if (_sleepTO) clearTimeout(_sleepTO)

		if (_syncRscs) {
			errs = this._ridSyncRscs(errs)
		}

		if (!(_asyncRscs || (_childs && _childs.size > 0))) {
			this._settle(errs)
			return
		}

		this._ridAsyncRscs(errs)
	}

	_ridSyncRscs(errs?: Error[]) {
		const rscs = this._syncRscs!
		if (typeof rscs === "function") {
			return this.#execFn(rscs)
		}
		const rL = rscs.length
		for (let i = rL; i >= 0; --i) {  // call LIFO
			errs = this.#execFn(rscs[i]!)
		}
		return errs
	}

	#execFn(fn: Fn, errs?: Error[]): Error[] | undefined {
		let err
		try {
			fn()
		}
		catch (e) {
			if (!errs) errs = []
			errs.push(errify(e))
			err = errs
		}
		return err
	}

	_ridAsyncRscs(errs?: Error[]) {

		const { _childs, _asyncRscs: rscs } = this
		const self = this

		let nWaiting = 0
		let nDone = 0

		if (_childs) {
			nWaiting += _childs.size
			for (const c of _childs.arr_m) {
				c.cancel()
				c._on(EV.JOB_DONE, jDone)
			}
		}

		if (rscs) {
			if (Array.isArray(rscs)) {
				for (const r of rscs) {
					execR(r)
				}
			}
			else {
				execR(rscs)
			}
		}

		function asyncRscDone(x?: Error) {
			++nDone
			if (x) {
				if (!errs) errs = []
				errs.push(x)
			}
			if (nDone === nWaiting) {
				self._settle(errs)
			}
		}

		function jDone(j: Job) {
			asyncRscDone(j._state === "DONE_ERR" ? j.val as Error : undefined)
		}

		function execR(r: AsyncRsc) {
			++nWaiting
			if (Symbol.asyncDispose in r) {
				r[Symbol.asyncDispose]().then(_ => asyncRscDone(), x => asyncRscDone(errify(x)))
			}
			else {
				new Job(false, r)._on(EV.JOB_DONE, jDone)
			}
		}
	}

	// all paths, end up going _ridRscs() -> _settle()
	// genFnRet()  ->  this.val = yielded.val   (unless _ridRscs fails after)
	// _cancel()  ->  ECancOK   (unless _ridRscs fails after)
	// genFnThrew()  ->  first err in Errors
	// after "using"/finally {}  ->   ECancOK|Errors
	// bc finally is only ran after job.cancel()
	// Sooo, within _genFnRet() need to check if it was called after cancellation ??
	// or does _settle() overwrites?

	// _ridRscs() is a middleware before _settle()

	// OPTION 1) pass this.val to all middleware functions as (err, val)
	// so if err !== undefined, settle with err.
	// OPTION 2)) check in _settle ifECancOKOrErrors()


	// _settle() is only called by _ridSyncRscs() or _ridAsyncRscs()
	// this.val set by _genFnRet and _cancel() (as hack to put caller.name)
	// this guy this.val usage is a mess
	//
	_settle(errs?: Error[]) {
		const { _state } = this
		let msg = ""

		if (_state === "CANCEL") {
			msg = "cancelled by" + this.val as string
		}

		const jName = this._name

		if (errs) {
			this.val = Errors(errs, jName, msg) as Ret
			this._state = "DONE_ERR"
		}
		else {
			if (_state === "CANCEL") {
				this.val = ECancOK(jName, msg) as Ret
			}

			// if genFn returns ribu error, add .jobName
			// BUG: _state may be mutated by other stage
			if (_state === "GENFN_DONE" && isE(this.val)) {
				this.val.jobName = jName
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

	onEnd(x: OnEnd) {
		if (Symbol.dispose in x) {
			this.#addRsc("_syncRscs", x[Symbol.dispose].bind(x))
		}
		else if (Symbol.asyncDispose in x) {
			this.#addRsc("_asyncRscs", x[Symbol.asyncDispose].bind(x))
		}
		else if (isGenFn(x)) {
			this.#addRsc("_asyncRscs", x)  // todo
		}
		// () => unknown
		// () => PromiseLike<unknown>
		// () => job
		this.#addRsc("_syncRscs", x)
	}

	#addRsc<T, K extends keyof this>(k: K, newV: T) {
		const currV = this[k]
		if (!currV) (this[k] as T) = newV
		else if (Array.isArray(currV)) currV.push(newV)
		else (this[k] as T[]) = [currV as T, newV]
	}
}

function onEnd(x: OnEnd) {
	runningJob().onEnd(x)
}

function theIteratorFn(this: Job) {
	const runningJ = runningJob()
	const { _state: _status } = this

	// if the job is alredy resolved, resume calling job with the resolved value
	if (_status === "DONE") {
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



export const genCtor = (function* () { }).constructor
function isGenFn(x: unknown): x is GenFn {
	return x instanceof genCtor
}