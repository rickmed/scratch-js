import { go, ch, onCancel, Cancellable } from "ribu"
import { readdir, readFile as readFileProm } from "node:fs/promises"
import {readFile} from "node:fs"
import { provideContext } from "effect/Schedule"
import { type } from "effect/Match"

/* Maybe I don't need to wrap in go() the io leaves, ie, do it manually with channels.
what go() gives me()
	1) if parent is cancelled, child is auto-cancelled.


	2) Maybe nice stack traces (with genFn args) when fatal error


	cancel() routes to .done (ie, ErrCancelled or some error inside cancellation)
*/


class Enoent extends Error { }
class Ent extends Error { }

// use function* directly and construct channels and return prc style api manually.
function* myReadFile<Args extends Parameters<typeof readFileProm>>(...args: Args) {

	const controller = new AbortController()
	opts.signal = controller.signal

	onCancel(() => controller.abort())  // throws if main calls onCancel()

	try {
		const prom = readFileProm(...args)
		const file: Awaited<typeof prom> = yield prom

		// need to implement return vals to use Prc.done and not create another ch here internally
		return file
	}
	catch (e) {
		if (e.code === "ENOENT") {
			return new Enoent()
		} else {
			return new Ent()
		}
	}
}

go(function* main() {
	const result = yield* myReadFile("foo.txt", { encoding: "utf8" })
})








export type GetOverloadArgs<T> =
	T extends { (...o: infer U): void, (...o: infer U2): void, (...o: infer U3): void } ? U | U2 | U3 :
	T extends { (...o: infer U): void, (...o: infer U2): void } ? U | U2 :
	T extends { (...o: infer U): void } ? U : never

type Gen<Ret> = Generator<"PARK", Ret, Ret>

export type Callback<R> = (err: Error | null, result: R) => void;

export type CBResult<T extends any[]> =
	T extends [Callback<infer R>?] ? () => Gen<R> :
	T extends [infer T1, Callback<infer R>?] ? (arg1: T1) => Gen<R> :
	T extends [infer T1, infer T2, Callback<infer R>?] ? (arg1: T1, arg2: T2) => Gen<R> :
	T extends [infer T1, infer T2, infer T3, Callback<infer R>?] ? (arg1: T1, arg2: T2, arg3: T3) => Gen<R> :
	T extends [infer T1, infer T2, infer T3, infer T4, Callback<infer R>?] ? (arg1: T1, arg2: T2, arg3: T3, arg4: T4) => Gen<R> :
	T;

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

export type ToGen<T> = UnionToIntersection<CBResult<GetOverloadArgs<T>>>

// Sample
declare const readFileGen: ToGen<typeof readFile>
let y = readFileGen("foo.txt", "utf8")


function toGen<T extends Function>(cbBasedFn: T): ToGen<T> {

	return function* subGen(...args: GetOverloadArgs<T>) {

		function cb(err, result) { // our custom callback for f (**)
			// resume myself
		}

		args.push(cb)
		cbBasedFn(...args)

		const x = yield "PARK"
		return x
	}
}

function* main() {
	const res = yield* toGen(readFile)("foo.txt", { encoding: "utf8" })
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








/* WebSockets. What ribu adds:
	1) the ws service is cancelled greacefully/automatically when parent finishes (or manually if desired)
		so the server/client can get a chance do to things on cancellation
	2) Ribu style Error modeling

In reality, since ws.send() doesn't acknowledge reception from server,
you can expose a sync .send() of the api returned by MyWebSocket
*/
function CancellableWebSocket(url) {
	const ws = new WebSocket(url)

	const wsClosed = ch()
	const fromServer = ch()
	const toServer = ch()

	go(function* _cancel() {
		while (true) {
			const msg = yield* toServer.rec
			ws.send(msg)
		}
	})

	const prc = go(function* _cancel() {
		onCancel(ws.close)
		// at this point, no more "message" events are fired.
		const reason = yield* wsClosed.rec
		yield* prc.done.put(reason)  // the parent handles if errors.
	})

	ws.addEventListener("close", wsClosed.enQueue)
	ws.addEventListener("message", fromServer.enQueue);

	ws.addEventListener("open", (event) => {
		// ??
	});

	return {}
}