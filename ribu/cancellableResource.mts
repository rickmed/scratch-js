import { go, Ch, onEnd, Cancellable, BroadcastCh } from "ribu"
import fs from "node:fs/promises"
import { readFile } from "node:fs"

/* Why wrap io leaves in go() vs just yield* a promise:
	1) can't cancel delegated gen
		- onCancel(() => {}) doesn't work bc if the process already has it set up (would overwrite)
	2) Loses nice stack trace with genName and args on delegated gen
	3) Can't compose, eg, if want to launch two in parallel.

*/

/*
	- main thing: cancel promise
		ie, need to associate cancel with the prc returned from the wrapper.
*/
function myReadFile<Args extends Parameters<typeof readFileProm>>(...args: Args)  {
	return go(_myReadFile(...args))

	function* _myReadFile<Args extends Parameters<typeof readFileProm>>(...args: Args) {

		const controller = new AbortController()
		opts.signal = controller.signal

		onEnd(() => controller.abort())  // throws if main calls onCancel()

		try {
			const prom = fs.readFile(...args)
			const file: Awaited<typeof prom> = yield prom

			// need to implement return vals to use Prc.done and not create another Ch here internally
			return file
		}
		catch (err) {
			let e = err as NodeJS.ErrnoException
			if (e.code === "ENOENT") {
				// all nodejs Error.name === "Error"
				// so I can reuse the object
				e.name = "NotFound"
				return e
			} else {
				e.name = "PermissionDenied"
				return e
			}
		}
	}
}


/* Avoid .val */
go(function* main() {
	const result = yield* myReadFile("foo.txt", { encoding: "utf8" })
	const prc = myReadFile("foo.txt", { encoding: "utf8" })
	const prc2 = myReadFile("foo.txt", { encoding: "utf8" })
	let procs = [prc, prc2]
})






// https://stackoverflow.com/questions/51650979/type-inference-with-overloaded-functions?rq=3

type Gen<Ret> = Generator<"PARK", Ret, Ret>

// gets the parameters of Fn overloads. One tuple per overload.
// -> [overloadParams]
export type OverloadArgs<Fn> =
	Fn extends { (...o: infer U): void, (...o: infer U2): void, (...o: infer U3): void } ? U | U2 | U3 :
	Fn extends { (...o: infer U): void, (...o: infer U2): void } ? U | U2 :
	Fn extends { (...o: infer U): void } ? U : never


export type Callback<R> = (err: Error | null, result: R) => void;

export type ToGenFn<T extends any[]> =
	T extends [Callback<infer R>?] ? () => Gen<R> :
	T extends [infer T1, Callback<infer R>?] ? (arg1: T1) => Gen<R> :
	T extends [infer T1, infer T2, Callback<infer R>?] ? (arg1: T1, arg2: T2) => Gen<R> :
	T extends [infer T1, infer T2, infer T3, Callback<infer R>?] ? (arg1: T1, arg2: T3) => Gen<R> :
	T extends [infer T1, infer T2, infer T3, infer T4, Callback<infer R>?] ? (arg1: T1, arg2: T2, arg3: T3, arg4: T4) => Gen<R> :
	T;

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

export type ToGen<T> = UnionToIntersection<ToGenFn<OverloadArgs<T>>>

// Sample
declare const readFileGen: ToGen<typeof readFile>
let y = readFileGen("foo.txt", "utf8")


export type Res<Args extends any[]> =
	Args extends [Callback<infer R>?] ? Gen<R> :
	Args extends [infer T1, Callback<infer R>?] ? Gen<R> :
	Args extends [infer T1, infer T2, Callback<infer R>?] ? Gen<R> :
	Args extends [infer T1, infer T2, infer T3, Callback<infer R>?] ? Gen<R> :
	Args extends [infer T1, infer T2, infer T3, infer T4, Callback<infer R>?] ? Gen<R> :
	Args;

type MyGen<Fn> = Res<OverloadArgs<Fn>>


/*
PROBLEMS:
	1) I'd like to call 2 cbTo_Ch_ish and race/cancel them
		Right now, both onEnds would be added to parent.
	2) onEnd() needs to be called when ch.enQueue is called (ie, when "job is done")
		Here no resources are opened, but in other cases they would.
So,
	It would be a job that:
		Has no _gen, children
		Can only add one onEnd (optimization)

Also, jobish could potentially be recycled since have no gen

*/
function cbTo_Jobling<T extends Function>(cbBasedFn: T, ...args: OverloadArgs<T>): MyGen<T> {

	const job = Job<string, ENotFound | EPerm>()

	let cancelled = false
	job.onEnd(() => cancelled = true)
	job.name(cbBasedFn.name)

	function cb(err, data) {
		if (cancelled) return
		if (err) {
			if (err.code === "ENOENT") {
				job.settle(E("NotFound", err))
			}
			if (err.code === "ENOENT") {
				job.settle(E("Perm", err))
			}
		}
		job.settle(data)
	}

	args.push(cb)
	cbBasedFn(...args)

	return job
}

function* main() {
	const res = yield* cbTo_Jobling(readFile, "foo.txt", { encoding: "utf8" })
}






/* Auto wrapping all functions */
type Last<T extends any[]> = T extends [...infer I, infer L] ? L : never;

type LastParam<F extends (...args: any) => any> = Last<Parameters<F>>;

type CBData<Fn extends (...args: unknown[]) => void> =
	LastParam<Fn> extends (err: any, res: infer Res) => any ?
	Res : never


function* wrap<Args extends unknown[]>(fn: Fn<Args>, ...args: Args) {

	if (args.length === 2) {
		fn(args[0], args[1], (_err, file) => {

		})
	}

	const x: CBData<typeof fn> = yield "PARK"
	return x
}

function* _main() {
	const res = yield* wrap(fs.readFile, "foo.txt", { encoding: "utf8" } as const)
}

type Fn<Args extends unknown[]> =
	(a: Args[0], b: Args[1], Function) => void






/*** WebSockets ***
What ribu adds:
	1) the ws service is cancelled greacefully/automatically when parent finishes (or manually if desired)
		so the server/client can get a chance do to things on cancellation
	2) Ribu style Error modeling

In reality, since ws.send() doesn't ack from server,
you can expose a sync .send() of the api returned by MyWebSocket
*/

// Let's say I have
function CancellableWebSocket(url) {
	const ws = new WebSocket(url)

	const wsClosed = Ch()
	const fromServerCh = BroadcastCh()
	const toServer = Ch()

	const prc = go(function* _cancel() {
		onEnd(ws.close)
		// at this point, no more "message" events are fired.
		const reason = yield* wsClosed.rec
		yield* prc.done.put(reason)  // the parent handles if errors.
	})

	ws.addEventListener("close", () => {
		wsClosed.resumeReceivers()
	})
	ws.addEventListener("message", msg => {

		// Maybe need an internal data structure if server is faster
		// hot, cold, etc...
		fromServerCh.resumeReceivers(msg)  // all waitingPrcS are called with same msg

		// existing receivers go their way with msg,
		// then, presumably when new msg arrive from server, there will be new receivers
		// these should NOT be resumed with the last message.
		// Issue: what if there are no receivers when .resumeReceivers(msg) is called?
		// when a new receiver comes should it be resumed with the cached value
		// and then cached value be deleted so that the next resumers
		// or should throw to force user to make sure receivers are there?
		// this whole logic is cursed, neeed to rethink later

	});

	ws.addEventListener("open", (event) => {
		// ??
	});

	return {}
}

// Benchmark to compare accessing a property in an object vs using a WeakMap
function benchmark() {
	const iterations = 1000000;
	const obj = { key: "value" };
	const weakMap = new WeakMap();
	const key = {};
	weakMap.set(key, "value");

	console.time("Object Property Access");
	for (let i = 0; i < iterations; i++) {
		const value = obj.key;
	}
	console.timeEnd("Object Property Access");

	console.time("WeakMap Access");
	for (let i = 0; i < iterations; i++) {
		const value = weakMap.get(key);
	}
	console.timeEnd("WeakMap Access");
}

benchmark();
