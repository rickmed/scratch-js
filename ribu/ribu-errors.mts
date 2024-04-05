import { Job } from "./Job.mjs"

type BaseE<Name extends string = string> = Error & {
	readonly name: Name
}
export function BaseE<Name extends string = string>(name: Name, msg = ""): BaseE<Name> {
	return {
		name: name,
		message: msg
	}
}

type E<Name extends string = string> = Error & {
	readonly name: Name
	readonly _err$: true
	readonly _jobName$: string
}
export function E<Name extends string = string>(name: Name, msg = "", jName = ""): E<Name> {
	return {
		name: name,
		message: msg,
		_err$: true,
		_jobName$: jName
	}
}

export type ECancOK = ReturnType<typeof ECancOK>
export function ECancOK(msg: string, jName: string) {
	return E("CancOK", msg, jName)
}


export type Errors = E<"Errors"> & {
	readonly errors: Array<Error | E>
}
export function Errors(errs: Array<Error | E>, msg: string, jName: string): Errors {
	return {
		name: "Errors",
		message: msg,
		_err$: true,
		_jobName$: jName,
		errors: errs
	}
}







export function ExtendError<Name extends string = string>(name: Name, ogErr: Error): E<Name> {
	ogErr.name = name
	return ogErr as E<Name>
}


/****  Helpers check if error  ***********************/

export function isE(x: unknown): x is E {
	return x !== null && typeof x === "object" && IS_RIBU_E in x
}

export function jobFailed(job: Job): boolean {
	const {val} = job
	return isE(val) && val[IS_RIBU_E] === isErrors
}

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

function fn(x: string) {
	if (x === "one") {
		return E("Timeout")
	}
	if (x === "two") {
		return E("No File")
	}
	if (x === "three") {
		// return Errors([Error("buuu")])
		return Error("One")
	}
	if (x === "three") {
		// return Errors([Error("buuu")])
		return Error("Two")
	}
	if (x === "happyPath") {
		return "hi"
	}
	return 32
}

function x() {
	let res = fn("dsad")

	if (res instanceof Error) {   // "if (res instanceof Error)"
		// res.name
		// recover,
		// extend/map Error to App Domain (see above) or procotol (404, grpc...)...
		// log
	}

	const x = res  // x is "hi" | {file: number}
}

function y() {
	let res = fn("dsad")

	if (errIs(res, "No File")) {
		return res
	}

	const x = res  // x1 is E<Timeout> | AggregateError | "hi" | {file: number}
}
