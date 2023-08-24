import { readFile as readFileProm } from "node:fs/promises"
type E<Name extends string = string> = NodeJS.ErrnoException & {
	readonly name: Name
}

export function E<Name extends string = string>(name: Name, ogErr: Error | NodeJS.ErrnoException): E<Name> {
	ogErr.name = name
	return ogErr as E<typeof name>
}


const CANC_OK = "CancelledOK" as const

export function ECancOK() {
	let newErr = Error()
	newErr.name = CANC_OK
	return newErr as E<typeof CANC_OK>
}


type InOnCancel = {
	inBody?: Error,
	children?: Array<InOnCancel>
}

export type EUncaught = E<"UncaughtThrow"> & {
	data: {
		inBody?: Error,
		inOnCancel?: InOnCancel
	}
}


export function err(x: unknown): x is E {
	return x instanceof Error
}


export function errIsNot<X, T extends Extract<X, E>["name"]>(x: X, name: T): x is Extract<X, E> & Exclude<X, E<T>> {
	return err(x) && x.name !== name
}


/* Usage Example */

function* readFile(x: string) {
	try {
		const prom = readFileProm("dsad", "utf-8")
		const file: Awaited<typeof prom> = yield prom

		// need to implement return vals to use Prc.done and not create another Ch here internally
		return file
	}
	catch (err) {
		let e = err as NodeJS.ErrnoException
		if (e.code === "ENOENT") {
			return E("NotFound", e)
		}
		return E("Other", e)
		// else {
		// }

		// https://kentcdodds.com/blog/get-a-catch-block-error-message-with-typescript
	}
}

function recoverOp(x: string) {
	if (x === "one") {
		return E("SOME_ERR", Error())
	}
	return "file" + "2"
}

function uploadFile(x: string): number | E<"Timeout" | "Nope"> {
	if (x === "one") {
		return E("Timeout", Error())
	}
	if (x === "two") {
		return E("Nope", Error())
	}
	return 1 + 2
}

function* readFileWithErrHandling(filePath: string) {
	let res = yield* readFile(filePath)  // .done. | .unwrap() | etc
		// .ifExc("NotFound", recoverOp, filePath)

	// if (e(res)) {
	// 	res = res.on("NotFound", recoverOp, filePath)
	// 	if (e(res)) return res
	// }

	if (errIsNot(res, "NotFound")) return res;

	if (err(res)) {
		let x = res
		const res2 = recoverOp(filePath)
		if (err(res2)) return res2
		res = res2
	}

	const y = res

	return res
}
