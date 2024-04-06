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




/***  Errors usage  ***********************************************************/


const theErr = {
	name: "FileNotFound",
	message: "",
	_op$: "getIngredients",
	cause: {
		message: "ENOENT: no such file or directory, open './dumm.txt'",
		name: "Error",
		errno: -2,
		code: 'ENOENT',
		syscall: 'open',
		path: './dumm.txt',
		cause: undefined
	}
}




function fetchFactory(part: string) {
	let op = fetchFactory.name
	const cond = Math.random()
	const res =
		cond < 0.3 ? E("NetworkFailed", op, part) :
			cond < 0.8 ? E("NoPartsFound", op, part) :
				{ part }
	return res
}

function makeHelmet() {
	const res = fetchFactory("helmet")
	if (isE(res)) return res.E("BuildHelmet", makeHelmet.name)
	return { helmet: res.part }
}


function makeBody() {
	const res = fetchFactory("body")
	if (res instanceof Error) return res.E("BuildBody", makeBody.name)
	return { body: res.part }
}

function makeIronManSuit() {
	const helmet = makeHelmet()
	if (isE(helmet)) return helmet
	const body = makeBody()
	if (isE(body)) return body
	return [helmet, body]
}

function httpHandler(req, res) {
	const suit = makeIronManSuit()
	if (isE(suit)) {
		res.statusCode = 500
		return res.end()
	}
	const ok = suit
}


/* Async Usage */

function* asyncHelmet() {
	yield* sleep(4)
	return makeHelmet()
}

function* asyncBody() {
	yield* sleep(4)
	return makeBody()
}

// function* makeSuit() {
// 	const helmet = yield* asyncHelmet()
// 	const body = yield* asyncBody()
// 	return [helmet, body]
// }



function* makeSuit() {
	const helmet = yield* go(asyncHelmet).cont

	// if _op$ is not set in E, ribu will set it for you (no static type check though)
	if (isE(helmet)) return helmet.E("MakeSuit")

	const body = yield* asyncBody()

	if (isE(body)) return body.E("MakeSuit")

	return [helmet, body]
}
