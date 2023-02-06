// https://man7.org/linux/man-pages/man4/console_codes.4.html
export let styleCodes = new Map([
	["black", "30"],
	["red", "31"],
	["green", "32"],
	["yellow", "33"],
	["blue", "34"],
	["magenta", "35"],
	["cyan", "36"],
	["white", "37"],
	["gray", "90"],

	["bgBlack", "40"],
	["bgRed", "41"],
	["bgGreen", "42"],
	["bgYellow", "44"],
	["bgBlue", "44"],
	["bgMagenta", "45"],
	["bgCyan", "46"],
	["bgWhite", "47"],
	["bgGray", "100"],

	["thick", "1"],  // since str.bold() exists
	["dim", "2"],
	["italic", "3"],
	["underline", "4"],
	["inverse", "7"],
	["strikethrough", "9"],
	["overline", "53"],
])

export const RESET = "\x1b[m"

const ObjectProto = Object.prototype
const ObjectProtoKs = new Set(Object.getOwnPropertyNames(ObjectProto))

let proxyCreated = false

export function setColorsProto() {

	if (proxyCreated === true) return
	proxyCreated = true

	const proxyHandler = {

		get(_, k, receiver) {

			if (ObjectProtoKs.has(k)) {
				if (typeof ObjectProto[k] === "function") {
					return (...args) => ObjectProto[k].call(receiver, ...args)
				}
				return ObjectProto[k]
			}

			const styleCode = styleCodes.get(k)
			if (styleCode !== undefined) {
				return "\x1b[" + styleCode + "m" + receiver + RESET
			}
		}
	}

	const proxy = new Proxy({}, proxyHandler)
	Object.setPrototypeOf(String.prototype, proxy)
}

export function restoreColorsProto() {
	if (proxyCreated === false) return
	Object.setPrototypeOf(String.prototype, Object.getPrototypeOf({}))
	proxyCreated = false
}




setColorsProto()



import { inspect } from "node:util"
import { util } from "zod"








const obj = {
	yo: {
		epale: {
			hello: "dsad"
		}
	},
	hi() {}
}

const diffs = [
	{
		path: "0",
		received: 1,
		expected: obj
	},
	{
		path: "last.0",
		received: obj,
		expected: JSON.stringify(obj, null, 2).green
	},

]
// console(diffs, {depth: 50, compact: false, sorted: true, numericSeparator: true})

// console.log("")
// console.log("Diffs: ".thick)
// console.log("")
// console.group()
// console.log("Path: ".yellow.thick + "name.last.0".yellow)
// console.group()
// console.log("Expected: ".red.thick)
// console.group()
// console.log("1")
// console.groupEnd()
// console.log("Received: ".green.thick)
// console.group()
// console.log(JSON.stringify(obj, null, 2))
// console.log("")
// console.groupEnd()
// console.groupEnd()

// console.log("Path: ".yellow.thick + "name.last.0".yellow)
// console.group()
// console.log("Expected: ".red.thick)
// console.group()
// console.log("1")
// console.groupEnd()
// console.log("Received: ".green.thick)
// console.group()
// console.log(JSON.stringify(obj, null, 2))

console.log("")
console.log("Diffs: ".thick)
console.log("")
console.group()
console.log("name.last.0".yellow.thick)
console.group()
console.log(inspect(new Set([1, 2, 3]), {compact: true, colors: false}).red + "  ≠  ".thick.gray + inspect(obj, {compact: true, colors: false}).green)
console.log("")
console.groupEnd()
console.groupEnd()


console.group()
console.log("name.last.0".yellow.thick)
console.group()
console.log(inspect(obj, {compact: true, colors: false}).red)
console.log(inspect(new Set([1, 2, 3]), {compact: true, colors: false}).red)
console.log("")
console.groupEnd()
console.groupEnd()


// const rec = [{hi: 1}, {hi: 2}, {hi: 3}]
const exp2 = [{hi: 1}, {hi: 3}, {hi: 3}]
console.dir(exp2, {depth: 50, compact: true, sorted: true, numericSeparator: true})

const rec = [1,
	{
		title: "show number of failed/passed tests > ",
		status: "SOHPI_FAILED",
		fn: () => {},
		error: obj
	},
	{
		title: "show number of failed/passed tests > ",
		status: "SOHPI_FAILED",
		fn: () => {},
		error: obj
	},
	{
		title: "show number of failed/passed tests > ",
		status: "SOHPI_FAILED",
		fn: () => {},
	}
]

const exp = [
	{
		title: "show number of failed/passed tests > ",
		status: "SOHPI_FAILED",
		fn: () => {},
		error: obj
	},
	{
		title: "show number of failed/passed tests > ",
		status: "SOHPI_FAILED",
		fn: () => {},
		error: obj
	},
	{
		status: "SOHPI_FAILED",
		fn: () => {},
	}
]
