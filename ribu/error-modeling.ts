import { readFile as readFileProm } from "node:fs/promises"


interface E<Name extends string = string> extends NodeJS.ErrnoException {
	readonly name: Name
}

const x: E<"One"> = {name: "One", message: ""}

export function E<Name extends string = string>(name: Name, ogErr: Error): E<Name> {
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

function errIs<X, T extends Extract<X, E>['name']>(x: X, name: T): x is Extract<X, E<T>> {
	return err(x) && x.name === name
}

export function Err<Name extends string = string>(name: Name, ogErr: Error | NodeJS.ErrnoException) {
	ogErr.name = name
	return ogErr
}


/* Usage Example */

function readFile(x: string) {
	try {
		// const file = await readFileProm("dsad", "utf-8")
		// const file: Awaited<typeof prom> = yield prom

		// need to implement return vals to use Prc.done and not create another Ch here internally
		return "dsd"
	}
	catch (e) {
		if (e.code === "ENOENT") {
			return E("NotFound", e as Error)
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

function uploadFile(x: string): string | E<"Timeout"> | E<"Nope"> {
	if (x === "one") {
		return E("Timeout", Error())
	}
	if (x === "two") {
		return E("Nope", Error())
	}
	return "1 + 2"
}

function readFileWithErrHandling(filePath: string) {
	let res = uploadFile(filePath)
		.iErr("NotFound").Go(recoverOp)  // passes in the result of readFile

	// if (e(res)) {
	// 	res = res.on("NotFound", recoverOp, filePath)
	// 	if (e(res)) return res
	// }

	if (errIsNot(res, "Nope")) {
		let x = res
		return res
	}
	// if (err(res)) {
	// 	err.name === ""
	// }

	if (err(res)) {
		let x = res
		const res2 = uploadFile(filePath)
		if (errIsNot(res2, "Nope")) return res2
		res = res2
	}

	const y = res

	return res
}



function* fn11(file: string) {
	// async things need to be wrapped in prc anyways:
		// fn111 will create/run prc.
		// .ifErr will run immediately when fn111() returns (ie, an running prc)
			// so needs to be implemented like a .then(),
			// ie, need to add the continuation as subscriber to upstream and so on...
		// same with .go()
		// ok let's say go(rescoverOp) fails, what should happen?
			// the runningPrc could be resolved by Err, but this won't be statically available
			// would be like a throw.


	return yield* readFile(file)  // returns prc (wraps prom/cb)
		.ifErrIs("NotFound").go(readFile, "./default.txt")
		// what happens if error is different from "NotFound"?
			// this pipeline should return
		// so the type of fn11 should be:
			// errorsFromReadFile - "NotFound" + errorsFrom2ndReadFile

		.pipe(str => str.concat(str))
		.pipe(uploadFile)  // pipe can also launch and wait for prcs to be returned


}



/*


*/