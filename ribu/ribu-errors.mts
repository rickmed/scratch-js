import { Job } from "./Job.mjs"
import { sleep } from "./timers.mjs"

/*
_op$: the name of the job's generator function or the name of the function if
	the user wants to return E objects in sync functions.
- If something threw and it's not ::Error, then it's wapped in ::BaseE.

- User can extend E object with additional properties as Nodejs extends with
	{
		errno: -2,
		code: 'ENOENT',
		syscall: 'open',
		path: './dumm.txt',
	}
*/

class RibuE<Name extends string = string> implements Error {

	constructor(
		readonly name: Name,
		readonly _op$: string,
		readonly message: string,
		readonly cause?: RibuE,
	) {}

	E<Name extends string>(name: Name, op = "", msg = "") {
		return E(name, op, msg, this)
	}
}

Object.setPrototypeOf(RibuE.prototype, Error.prototype)


type E<Name extends string = string> = Error & RibuE<Name>

export function E<Name extends string>(name: Name, op = "", msg = "", cause?: RibuE): E<Name> {
	return new RibuE<Name>(name, op, msg, cause)
}


export type ECancOK = ReturnType<typeof ECancOK>

export function ECancOK(jName: string, msg: string) {
	return E("CancOK", jName, msg)
}


export class Errors extends RibuE<"Errors"> {
	constructor(readonly errs: Error[], jName: string, msg: string) {
		super("Errors", jName, msg)
	}
}


export function isE(x: unknown) {
	return x instanceof RibuE
}


type EE = RibuE<string>

export function errIsNot<X, T extends Extract<X, EE>["name"]>(x: X, name: T): x is Extract<X, EE> & Exclude<X, RibuE<T>> {
	return isE(x) && x.name !== name
}

export function errIs<X, T extends Extract<X, EE>['name']>(x: X, name: T): x is Extract<X, RibuE<T>> {
	return isE(x) && x.name === name
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
	yield sleep(4)
	return makeHelmet()
}

function* asyncBody() {
	yield sleep(4)
	return makeBody()
}

// function* makeSuit() {
// 	const helmet = yield* asyncHelmet().$
// 	const body = yield* asyncBody().$
// 	return [helmet, body]
// }

function* makeSuit() {
	const helmet = yield* asyncHelmet()
	// if op is not set in E, ribu will set it for you (no static type check though)
	if (isE(helmet)) return helmet.E("MakeSuit")
	const body = yield* asyncBody()
	if (isE(body)) return body.E("MakeSuit")
	return [helmet, body]
}
