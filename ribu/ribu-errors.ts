import { myJobs, pool, go, me, onEnd, use, Job, type Pool, err, runningJob } from "ribu"
import { readFile as readFileProm } from "node:fs/promises"

type E<Name extends string = string> = Error & {
	name: Name
}

export function E<Name extends string = string>(name: Name, msg?: string): E<Name> {
	const err = Error(msg) as E<Name>
	err.name = name
	return err
}

// msg: "cancelled by genFn.name"
export const ECancOK = (msg: string) => E("CancelledOK", msg)
export type ECancOK = ReturnType<typeof ECancOK>

// export function ExtError<Name extends string = string>(name: Name, ogErr: Error): E<Name> {
// 	ogErr.name = name
// 	return ogErr as E<Name>
// }


/*
- js Error is { name, message, cause?, stack? }

- Ribu uses .name and extends it (inspects every genFn return if instanceof Error) with:
	- genFn, args

- Error aggregations:
	- All jobsRet :: BodyReturnType | ECancOk | AggregateError
	- Errors can occur:
		- Throw in genFnBody
		- child genFn fails while waiting for them
		- child failed cancelling them:

- CancelErrorObj
{
	children: Errors[]
	rscs:                   // can be async or sync doesn't matter
}

- PROBLEM: .dispose()/[Symbol.asyncDispose]/.*cancel() don't have names/args for
	stack trace.
*/


type InOnCancel = {
	inBody?: Error,
	children?: Array<InOnCancel>
}

export type EUncaught = E<"Threw"> & {
	data: {
		inBody?: Error,
		inOnCancel?: InOnCancel
	}
}



/****  Helpers check if error  ***********************/

export function e(x: unknown): x is Error {
	return x instanceof Error
}

export function errIsNot<X, T extends Extract<X, E>["name"]>(x: X, name: T): x is Extract<X, E> & Exclude<X, E<T>> {
	return e(x) && x.name !== name
}

export function errIs<X, T extends Extract<X, E>['name']>(x: X, name: T): x is Extract<X, E<T>> {
	return e(x) && x.name === name
}


/****  Extend Ribu Error with Application Domain Error  ***********************/

type AppErr<Name extends string> = {level: number} & E<Name>
function AppErr<Name extends string>(level: number, ogErr: E<Name>): AppErr<Name> {
	const err = ogErr as AppErr<Name>
	err.level = level
	return err
}

// create one:
const appErr1 = AppErr(4, E("CANCOK"))



/***  Errors usage  ***********************************************************/

function op(x: string) {
	if (x === "one") {
		return E("Timeout")
	}
	if (x === "two") {
		return E("No File")
	}
	if (x === "three") {
		return AggregateError([Error(), Error()])
	}
	if (x === "happyPath") {
		return "hi" as const
	}
	return {file: 32}
}

function x() {
	let res = op("dsad")

	if (e(res)) {   // "if (res instanceof Error)"
		return res
		// recover,
		// extend/map Error to App Domain (see above) or procotol (404, grpc...)...
		// log
	}

	const x = res  // x is "hi" | {file: number}
}

function y() {
	let res = op("dsad")

	if (errIs(res, "No File")) {
		return res
	}

	const x = res  // x1 is E<Timeout> | AggregateError | "hi" | {file: number}
}
