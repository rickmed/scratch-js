import { myJobs, pool, go, me, onEnd, use, Job, type Pool, err, runningJob } from "ribu"
import { E, CANC_OK_NAME, ECancOK } from "./ribu-errors.js"



/* --- End protocols (using internal jobs) ---

- $finish:
	1) wait for children (if any) - Async
		- cancel childs if one fails.
	2) cancelResources(): see below (childs are done at this point)
	3) resumeObservers - Sync

- job.cancel():
	0) if (state === cancelling | done ) add new observer; return
	1) cancelResources():
		- sync .dispose() (eg: a memory chunk, sleep, serverConnection without Syn+Ack...)
			+ onEnd()
		- async .cancel() (eg: childs, a db connection with Ack, file close...)
			+ onEnd*
	2) notify observers - Sync
		- ie, all callers of yield* job.cont|.$ or yield* job.cancel().cont.$
			- job.cancel() returns a job

- .cancel() can't be cancelled.

- Problem: $cancelResources can't be cancelled (by .cancel()) if $finish ran it.
		(eg, onEnd, .dispose(), asyncDispose() can't be cancelled or ran twice)
	but $finish itself needs to be cancelled
	Solution: put it in some scope so that $onCancel awaits/subs it.

.cancelJob() needs to return the result of the cancellation, ie,
	ECancelledOK | [Errors]

*/

function go(genFn, ...args) {
	return new Job()
}

function addChild(parent: Job, newChild: ArraySet<Job>) {
	let {_childs} = parent
	if (!_childs) parent._childs = newChild
	else if (_childs instanceof ArraySet) _childs.add(newChild)
	else parent._childs = new ArraySet().add(newChild)
}

function removeChild(parent: Job, newChild: ArraySet<Job>) {
	let {_childs} = parent
	if (_childs instanceof ArraySet) _childs.remove(newChild)
	else parent._childs = undefined
}

type Status = "RUNNING" | "PARKED" | "DONE"
type onDoneCB<Ret> = (j: Job<Ret>) => void
type AyncDisp = AsyncDisposable | { cancel(): Generator}

class Job<Ret = unknown> {

	// todo:  observers must check on cb the job's settled value
	// (ECancelledOK | ECancelledErrors), and resume themselved accordingly, ie:
		// - .cancel().$ continues normally if result is ECancelledOK
		// - yield* job.$ throws on both results

	// onEnd() must be wrapped in some resource.

	val: Ret = undefined as Ret
	_status: Status = "RUNNING"
	_next: undefined | "cont" | "end"
	_onDone: onDoneCB<Ret>[] = []
	_childs: undefined | Job[]
	_syncRscs: undefined | Disposable[]
	_asyncRscs: undefined | AyncDisp[]

	constructor() {
		const parent = sys._runningJob
		this.addChild(parent, this)
	}

	addChild(parent: Job, child: Job<any>) {
		addChild(parent, this)
		this._onDone.push(me => removeChild(parent, me))
	}

	// yield* (Symbol.Iterator) can only be called if .rec|.$ is called first.
	// ie, prc shouldn't have this method, but want to avoid create/return a different obj
	[Symbol.iterator](): TheIterator<Ret> {
		const { _status, _next } = this
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

	get End() {
		return this.$
	}

	// todo: ._next = undefined when done resuming
	_resume(IOmsg?: unknown): void {

		if (this._status === "DONE") {
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
				finish(this)
			}

			// ?? done === false, ie, park
			return
		}



	}

	*cancel() {
		// if (state === cancelling | done ) add new observer; return

		const { _childs: _childs } = this
		// _childs can include: user-ran childs, $finish or $cancelResources


		// Need to return this and not a new job. Otherwise, user could cancel
		// the returned job (no)
		return this
	}
}

function* cancelJob<Ret>(job: Job<Ret>) {
	let errors = []

	const {_syncRscs: sRsc, _asyncRscs: aRsc} = job

	if (sRsc) {
		for (const r of sRsc) {
			try {
				r[Symbol.dispose]()
			}
			catch (e) {
				if (!(e instanceof Error)) e = Error(JSON.stringify(e))
				errors.push(e)
			}
		}
	}

	if (aRsc) {
		for (const r of aRsc) {
				// need to launch several jobs in parallel

		}
	}


}

function pool(jobs: Job[]) {
	let count = jobs.length   // ._childs = jobs
	const jobDoneCh = Ch()
	for (const job of jobs) {
		job.onDone(j => {
			--count
			jobDoneCh.putAsync(j)
		})
	}

	function go(...args) {
		++count
		go(...args)
	}

	return {count, rec: jobDoneCh.rec, go}
}



function theIteratorFn(this: Job) {
	const runningPrc = runningJob()
	const { _status } = this

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

// why $finish should be a child of the prc which genFn completed
function finish<Ret>(job: Job<Ret>) {
	const prcChilds = job._childs

	job.$normalFinish = go(function* normalFinish() {
		let res
		if (job._childs) {
			// BUG: $finish is child of prc so this waits for $finish itself to
			// complete, ie, infinite loop
			res = yield* go(waitOrErr, job._childs).rec  // todo: use "childs.wait.rec"
			if (err(res)) {
				// ?? need to check if err is child failed or siblings.cancel() failed
			}
			// here, all childs are resolved
		}
		if (job._onEnd) {
			res = yield* go(this._onEnd)
		}
	})
}

// Todo: this needs to return some collection of errors, bc:
// a child can Err and then childs.cancel() can Err.
// BUG: $waitOrErr is a child of callerPrc so it will be waiting on itself.
function* waitOrErr(childs: Childs<Job>) {
	while (childs.size) {
		let res = (yield* childs.rec).val  // this subscribe to all prcs in childs coll
		if (err(res)) {
			res = yield* childs.cancel().rec
			return res
		}
	}
	// return an object that lazily gets the results
}



function* cancelResources<Ret>(job: Job<Ret>) {
	let { _asyncResources: _syncResources, _AsyncResources, _childs } = job: Job<Ret>
	if (_syncResources) {
		cancelSyncResources(_syncResources)
	}
	if (_AsyncResources || _childs) {
		const res = cancelASyncResources(_AsyncResources, _childs)
	}
}

function cancelSyncResources(rscs) {
	if (!Array.isArray(rscs)) {
		rscs.dispose()
	}
	else {
		for (const r of rscs) {
			r.dispose()
		}
	}
}

function cancelASyncResources(resources, childs) {
	// At this point, there may be childPrcs running.
	// If there are, I need to call child.cancel() which returns a different prc.
	// But we can still use the childs object to add new prcs and wait for
	// their results concurrently.

	// if prc._childs still have runningPrcS (ie, $normalFinish was cancelled by prc.cancel())
	// and I add .cancel() to those.
	// ._childs will let me know when prc is done cancelling AND when it's finished (resolved with ECancelled)

	// what happens when prc.cancel()
	// need to remove subscription of all prcS I'm a observer (so I can't be .resume() by no one)
	// then, they notify any callers of yield* childPrc.rec/try"
	// in this case, it will notify $normalFinish (by proxy of $waitForChilds)

	// type of resources? orignally a genFn
	// go(genFn) -> notRanPrc -> prc.cancel()

	// ?? How does the childs object do that

	if (resources) addAsyncResourcesToChilds(resources, childs)

	// now need to call .cancel on all of them, which returns a prc that needs to be ran
	// ?? how does childs subscribe to all of them?

	const inFlight = childs
	while (inFlight.size) {
		const res = (yield * inFlight.rec).val
		if (err(res)) {
			yield* inFlight.cancel()  // cancel is idempotent so no need to pluck donePrcs
			return Error()
		}
	}
	return childs.map(prc => prc.val)
}

function addAsyncResourcesToChilds(resources, childs) {
	if (!Array.isArray(resources)) {
		childs.add(resources)
	}
	else {
		for (const r of resources) {
			childs.add(r)
		}
	}
}

function* _cancel() {
	yield* this.current
}

function* cancelChilds() {
	const inFlight = myJobs
	while (inFlight.size) {
		const res = (yield* inFlight.rec).val
		if (err(res)) {
			yield* inFlight.cancel()  // cancel is idempotent so no need to pluck donePrcs
			return Error()
		}
	}
	return myJobs.map(prc => prc.val)
}




/**** $Finish using Callbacks *************************************************

When waiting for child to be done (normal or doneCancelling),
childPrc a callback where to call.
So when interrupt comes, need to change the cbS they will call when done.

- Interrupt: a prc.cancel() while waiting for children to finish normally
	goTo(cancelProtocol)

normalFinish:
	state = "DONE"
	notify observers
		observers are reponsible to delete child from ._childs when notification receives

====
Let's say I'm talking to a resource (needs to be an Obj), it needs a callback to send the results back
	I call a object's methods and place a callback in obj._cb
		(the method knows where to look the cb to answer).
	If _cb === null, the request has been cancelled.
	Also, as caller I can change obj._cb to "cancel the previous request and get a new one"

This is like context.aborted, but adding .aborted to the callee obj .
	maybe more sophisticated bc the callee knows where to answer.
*/

function waitForChilds_() {
	this.state = "FINISHING"
	if (this._childs.size > 0) {
		for (const child of myJobs) {
			child.sub(child => {
				const res = child.val
				if (res instanceof Error) {
					cancelChildS()
				}

			})
		}
	}
}

// use an shared event emitter which broadcasts at all levels when thing is cancelled.
// maybe if I check

function cancelChildS(cb) {
	// need to check which state this prc is in


	let allResults = []
	const childS = this._childs()
	const childSCount = childS.size
	for (const child of childS) {
		child.cancelCB(doneChild => {
			allResults.push(doneChild.val)
			if (allResults.length === childSCount) {
				cb(allResults)
			}
		})
	}
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
	let runningJob_ = runningJob()
	runningJob_.syncResources.add(new Timeout(ms, runningJob_))
	runningJob_._setPark()
	return theIterable as TheIterable<void>
}


class Timeout {

	_timeout: NodeJS.Timeout

	constructor(ms: number, job: Job) {
		this._timeout = setTimeout(function to() {
			job._resume()
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

	fn2() {}

	// if dispose is Async
	*cancel() {}
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
