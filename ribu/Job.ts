import { myJobs, pool, go, me, onEnd, use, Job, type Pool, err, runningJob } from "ribu"
import { ECancOK } from "./ribu-errors.js"
import { ArrSet } from "./data-structures.mjs"


/* --- End protocols (using internal jobs) ---

- $finish:
	1) wait for children (if any) - Async
		- cancel childs if one fails.
	2) disposeResources(): see below (childs are done at this point)
	3) resumeObservers - Sync

- job.cancel():
	0) if (state === cancelling | done ) add new observer; return
	1) disposeResources():
		- async .*cancel() (eg: childs, a db connection with Ack, async file close...)
			+ onEnd*
		- sync .dispose() (eg: a memory chunk, sleep, serverConnection without Syn+Ack...)
			+ onEnd()
	2) notify observers - Sync
		- ie, all callers of yield* job.cont|.$ or yield* job.cancel().cont|.$
			- job.cancel() -> returns same job

- .cancel() can't be cancelled from outside

- $disposeResources can't be cancelled by .cancel() if $finish started it.
	- (bc eg: onEnd, .dispose(), asyncDispose() can't be called twice)
	but $finish itself needs to be cancelled
	Solution: put it in some scope so that $onCancel awaits/subs it.

- CBs to resources (Ch, yield* job, yield* job.cancel()) are not removed from Rsc
	when calling job is cancelled. When CBs are called "(job) => resume(me)",
	resume checks if (this.done) -> noop.
	- Since parents always wait on children (directly or indirectly), ie, child
	has ._onDone = [(job) => parent.resume(job)], then, parent.cancel(),
	child will be cancelled and onDoneCB will be fired.

*/

function go(genFn, ...args) {
	return new Job()
}

type State = "RUN" | "PARK" | "WAIT_CHILDS" | "DISP_RSCS" | "CANCELLING" | "DONE_ERR" | "DONE_OK"
type onDoneCB<Ret> = (j: Job<Ret>) => void
type onEndFn = () => void
type onEndGenFn = () => Generator
type SyncRsc = Disposable | onEndFn
type AsyncRsc = onEndGenFn | AsyncDisposable | Job
type JobRet<GenFnRet> = GenFnRet | ECancOK | AggregateError

class Job<Ret = unknown> {

	// todo: is observed is done with ECancOK and this._next = "$", continue
		// all other errors, fail this job

	// onEnd() must be wrapped in Resource.

	val: JobRet<Ret> | "$dummy" = "$dummy"
	_state: State = "RUN"
	_next: undefined | "cont" | "$"
	_childs: ArrSet<Job<Ret>> = new ArrSet()
	_doneCBs: onDoneCB<Ret>[] = []
	_syncRscs: undefined | SyncRsc[] = []
	_asyncRscs: undefined | AsyncRsc[] = []
	_cancelAsyncRscsCB: undefined | ((res: 1 | Error[]) => void)

	constructor() {
		const parent = sys._runningJob
		this._addChild(parent, this)
	}

	_addChild(parent: Job) {
		const self = this
		this._childs.add(this)
		this._doneCBs.push(thisChild => parent._childs.delete(self))
	}

	// yield* (Symbol.Iterator) can only be called if .rec|.$ is called first.
	// ie, prc shouldn't have this method, but want to avoid create/return a different obj
	[Symbol.iterator](): TheIterator<Ret> {
		const { _state: _status, _next } = this
		if (!_next) {
			// todo: end caller job (bc user needs to call .$ or .if before yield*)
		}
		const runningPrc = runningJob()

		// if this job is alredy resolved, resume caller with the settled value
		if (_status === "DONE") {
			runningPrc._setResume(this.val)
		}
		else {
			runningPrc._setPark()
			this._addObserver(runningPrc)
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
		runningJob()._next = "end"
		return this
	}

	get orEnd() {
		return this.$
	}

	// todo: ._next = undefined when done resuming
	_resume(IOmsg?: unknown): void {

		if (this._state === "DONE") {
			return
		}

		sys.prcStack.push(this)

		for (; ;) {
			this._setResume(IOmsg)
			// try {
			var yielded = this._gen.next()  // eslint-disable-line no-var
			// }
			// catch (thrown) {
			// 	console.log({thrown})
			// 	_go(this.#handleThrownErr, thrown)
			// 	return
			// }

			sys.prcStack.pop()

			if (yielded.done === true) {
				this.val = yielded.value

				// _$finish's parent could be anyone, so need to make it child of finishing prc
				// anyway this is like user manually waiting for children and cleaning resources
				this._genFnDone()
			}

			// ?? done === false, ie, park
			return
		}
	}

	// if activeChilds and any failed, the rest are cancelled and job is settled
	_genFnDone() {

		const { _childs, _syncRscs, _asyncRscs } = this
		const self = this

		let nLiveChilds = _childs.size
		let nChildsDone = 0

		if (nLiveChilds > 0) {
			for (const c of _childs.arr_m) {
				c._doneCBs.push(childDoneCB)
			}
		}

		function childDoneCB(doneJob: Job<any>) {
			// this condition will only run when next child ends, ie, after
			// .cancel() already started). But is ok since it's a like a noop.
			if (self._state === "CANCELLING") {
				removeDoneCB()
				return
			}
			++nChildsDone
			if (doneJob._state === "DONE_ERR") {
				removeDoneCB()
				self.cancel()
				return
			}
			if (nChildsDone === nLiveChilds) {

				let errors: undefined | Error[]

				if (_syncRscs) {
					const res = self._disposeSyncRscs()
					if (res !== 1) errors = res
				}

				if (_asyncRscs) {

					self._cancelAsyncRscsCB = (res: 1 | Error[]) => {
						if (res !== 1) {
							if (errors) errors.push(...res)
							else errors = res
							self._state = "DONE_ERR"
							self.val = AggregateError(errors)
						}
						else {
							self._state = "DONE_OK"
						}
						self._runOnDoneCBs()
					}

					self._cancelAsyncRscs()
				}
			}
		}

		function removeDoneCB() {
			// remaining c in ._childs are the ones still running
			for (const c of _childs.arr_m) {
				c._doneCBs.splice(c._doneCBs.indexOf(childDoneCB), 1)
			}
		}
	}

	_disposeSyncRscs(): 1 | Error[]  {
		let errors: undefined | Error[]
		for (const r of this._syncRscs!) {
			try {
				if (typeof r === "function") r()
				else r[Symbol.dispose]()
			}
			catch (e) {
				if (!errors) errors = []
				errors.push(e instanceof Error ? e : Error(JSON.stringify(e)))
			}
		}
		this._syncRscs = undefined
		return errors ?? 1
	}

	cancel(): this {
		const { _childs, _syncRscs, _asyncRscs } = this
		const self = this
		// if (state === cancelling | done ) add new observer; return

		// CONTINUE HERE WITH SIMILARITIES BETWEEN genGenDone() and this
		if (_syncRscs) {
			const res = self._disposeSyncRscs()
			if (res !== 1) errors = res
		}

		if (this._cancelAsyncRscsCB) {  // _genFnDone() is cancelling async rscs
			// _cancelAsyncRscs continues running but now answer comes here.
			this._cancelAsyncRscsCB = (res: 1 | Error[]) => {

				self._runOnDoneCBs()
			}
		}

		if (_syncRscs) {

		}

		this._state = "CANCELLING"
		return this
	}

	_cancelAsyncRscs() {
		const self = this
		let errors: Error[] = []
		let nWaiting = 0
		let nDone = 0

		function asyncDoneCB(itemDone: Job<any> | Promise<any>) {
			if (self._state === "CANCELLING") {
				// problem: this condition is used when is called by .cancel()
			}
			++nDone
			if (itemDone instanceof Job && itemDone.val instanceof AggregateError) {
				errors.push(itemDone.val)
			}
			if (nDone === nWaiting) {
				self._cancelAsyncRscsCB!(errors.length > 0 ? errors : 1)
			}
		}

		const { _childs, _syncRscs } = this
		// _childs can include: user-ran childs, $finish or $cancelResources
			// ???
		if (_childs.size > 0) {
			for (const c of _childs.arr_m) {
				++nWaiting
				c._doneCBs.push(asyncDoneCB)
				c.cancel()
			}
		}
	}

	_runOnDoneCBs() {
		for (const cb of this._doneCBs) {
			cb(this)
		}
	}

	settle(val: Ret) {
		this.val = val
		this._state = "DONE"
		for (const cb of this._doneCBs) {
			cb(this)
		}
	}
}


function theIteratorFn(this: Job) {
	const runningPrc = runningJob()
	const { _state: _status } = this

	// if the prc is alredy resolved, resume calling prc with the resolved value
	if (_status === "DONE") {
		runningPrc._setResume(this.val)
	}
	else {
		runningPrc._setPark()
		this._addObserver(runningPrc)
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



/***  Timers  *****************************************************************/

export function sleep(ms: number) {
	let callerJob = runningJob()
	callerJob.syncResources.add(new Timeout(ms, callerJob))
	callerJob._setPark()
	return theIterable as TheIterable<void>
}


class Timeout {

	_timeout: NodeJS.Timeout

	constructor(ms: number, caller: Job) {
		this._timeout = setTimeout(function to() {
			caller._resume()
		}, ms)
	}

	[Symbol.dispose]() {
		clearTimeout(this._timeout)
	}
}



/* Auto-resource demo */

function* fnUsingSomeResource() {
	// use() is needed to add [Symbol.iterator] so yield* works
	const resource = yield* use(new DBconnection('address'))
}

class DBconnection implements AsyncDisposable {
	constructor(addrs: string) {
		// ... set up connections
	}

	fn2() { }

	// if dispose is Async
	*cancel() { }
	// or
	async [Symbol.asyncDispose]() {
		// do some work
		// return nothing
	}

	// // if dispose is Sync
	// [Symbol.dispose]() {

	// }

}

function use(obj) {
	runningJob().addResource(obj)
}
