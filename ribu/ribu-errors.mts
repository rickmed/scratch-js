import { type Job } from "./Job.mjs"

export const RIBU_E = Symbol("RIBU_E")

type E<Name extends string = string> = Error & {
	[RIBU_E]: symbol
	name: Name
	jobName: string
}

export function E<Name extends string = string>(name: Name, jName: string, msg = "", symb = RIBU_E): E<Name> {
	let err = Error(msg) as E<Name>
	err[RIBU_E] = symb
	err.name = name
	err.jobName = jName
	return err
}


export const isErrors = Symbol("Errors")

export type Errors = E<"Errors"> & {
	errors: Error[]
}

export function Errors(errs: Error[], jName: string, msg: string): Errors {
	let err = E("Errors", jName, msg, isErrors) as Errors
	err.errors = errs
	return err
}



export const isECancOK = Symbol("ECancOK")

export type ECancOK = ReturnType<typeof ECancOK>

export function ECancOK(jName: string, msg: string) {
	return E("CancOK", jName, msg, isECancOK)
}



export function ExtendError<Name extends string = string>(name: Name, ogErr: Error): E<Name> {
	ogErr.name = name
	return ogErr as E<Name>
}


/****  Helpers check if error  ***********************/

export function isE(x: unknown): x is E {
	return x !== null && typeof x === "object" && RIBU_E in x
}

export function jobFailed(job: Job): boolean {
	const {val} = job
	return isE(val) && val[RIBU_E] === isErrors
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
		return Errors([Error("buuu")])
		// return Error("WHAT")
		// return AggregateError("WHAT")
		// return new TypeError('dsa')
	}
	if (x === "happyPath") {
		return "hi"
	}
	return 32
}

function x() {
	let res = fn("dsad")

	if (e(res)) {   // "if (res instanceof Error)"
		return res
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
