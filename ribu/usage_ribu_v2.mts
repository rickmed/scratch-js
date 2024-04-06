function* sequential() {
	/*
	go():
		- Eager (job already launched). But:
		- you can't call yield* (ie, observe the result) if haven't call .if|.$
	 */
	const job = go(genFn)

	// OPTION 1: res :: GenFnReturns | E<CancOK> | E<RibuErrors> (contains Error[])
		// if you want to get the res, you HAVE to handle if (err(res)),
	const val = yield* job.cont   // 
	if (err(val)) {
		// return other Error, map, whatever.
	}
	// now val is happyPath

	// OPTION 2: res :: HappyPath   (always)
		// - If job fails in genFn, cancelledOK or cancelledErr; caller fails. Why?
		// - Bc if I'm calling job.$, it means I'm not expecting for job to be
		// cancelled (otherwise, I'd call job.cont), so I'd want to know if job
		// was unexpectedly cancelled.
	const res = yield* job.$


	// CANCELLATION
		// .cancel() should return an uncancellable job

	// - If CancOK, caller continues
	// - If cancelErr, caller fails.
	yield* job.cancel().$

	// or (not common):
	// always continues with :: E<CancOK> | E<RibuErrors> (contains Error[])
		//	so, discern with "!('err!' in res)"  or  "(Array.isArray)"
	const res = yield* job.cancel().cont
}

// Todo: add types to childs like "const inFlight = childS<Timeout | typeof connect>()"
function* concurrentChilds() {

	// go() is like an alias for myJobs().go()
	// not having a bundle to launch is efficient/convenient if I don't need the types back
	go(job1)
	go(job2)

	// Here, $concurrentChilds have 2 active children without any observers.
	// If no observers come before this genFn completes, ribu will auto-wait
	// $concurrentChilds childs, and, if an auto-waited child fails, the
	// siblings are cancelled and the parent will resolve with Exc.
	// So we start observing here for the results.

	// if a child fails, parent fails with ExcGeneric (siblings cancelled)
	// to do any kind collection for results, use .rec
	yield* myJobs().$

	// if child fails, error is reported here (siblings cancelled)
	// err :: Error
	const err = yield* myJobs().err

	// reports when a child ends (res is not typed bc myJobs() is not typed)
	// can be used with "while (pool1.count) {}" or check err(job.val) and cancel the others, etc...
	const job = yield* myJobs().cont


	// Can have +1 job pools

	// auto-typed, ie, can only launch fn or fn2 genFn
	const pool1 = pool(go(fn, "args"), go(fn2, "args2"))
	const job_ = pool1.go(fn, "args")

	// same as myJobs():
	yield* pool1.$
	const job = yield* pool1.rec
	const err = yield* pool1.err

	// another pool
	const pool2 = pool<typeof fn1>()  // typed manually

	// -- Cancellation --
	yield* myJobs().cancel().$
	const res = yield* myJobs().cancel().cont

	yield* pool.cancel().$
	const res = yield* pool.cancel().cont
}
