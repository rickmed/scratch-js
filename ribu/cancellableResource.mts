import { go, Ch, onCancel, Cancellable, BroadcastCh } from "ribu"
import { readdir, readFile as readFileProm } from "node:fs/promises"
import {readFile} from "node:fs"
import { provideContext } from "effect/Schedule"
import { type } from "effect/Match"

/* Do I need to wrap the io leaves in go() or just yield* ?

	1) can't cancel delegated gen

	2) Don't have stack trace with genName and args on delegated gen


I think delegating directly to a generator is a sequential thing
	ie, If I want to

*/


// use function* directly and construct channels and return prc style api manually.
/**
 * Do I need to wrap this in a prc? What it provides:
 *	I could implement onCancel = [], so onCancel() could work here. Is it worth it?

 */

/*

I could could myReadFile as is, but if a want to launch 2 in parallel, I would
need to wrap them in additional prcS. TBD
*/

function* myReadFile<Args extends Parameters<typeof readFileProm>>(...args: Args) {

	const controller = new AbortController()
	opts.signal = controller.signal

	onCancel(() => controller.abort())  // throws if main calls onCancel()

	try {
		const prom = readFileProm(...args)
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

go(function* main() {
	const result = yield* myReadFile("foo.txt", { encoding: "utf8" })
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
	T extends [infer T1, infer T2, infer T3, Callback<infer R>?] ? (arg1: T1, arg2: T2, arg3: T3) => Gen<R> :
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


function* cbToProcess<T extends Function>(cbBasedFn: T, ...args: OverloadArgs<T>): MyGen<T> {

	// this whole thing needs to be wrapped in a prc.
		// for onCancel() to work;
		// and to return a channel to be composable (be ran concurrently etc)

	function cb(err, data) {
		if (err) {
			if (err.code === "ENOENT") {
		// not sure if type-inferrence this will be possible
				prc.resolve(E("NotFound", err))
			}
			if (err.code === "ENOENT") {
				prc.resolve(E("NotFound", err))
			}
		}
		prc.resolve(data)
	}

	args.push(cb)
	cbBasedFn(...args)

	const x = yield "PARK"
	return x
}

function* main() {
	const res = yield* cbToProcess(readFile, "foo.txt", { encoding: "utf8" })
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

In reality, since ws.send() doesn't acknowledge reception from server,
you can expose a sync .send() of the api returned by MyWebSocket
*/
function CancellableWebSocket(url) {
	const ws = new WebSocket(url)

	const wsClosed = Ch()
	const fromServerCh = BroadcastCh()
	const toServer = Ch()

	const prc = go(function* _cancel() {
		onCancel(ws.close)
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