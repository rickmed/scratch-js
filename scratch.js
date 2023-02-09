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
import Table from "cli-table3"


const obj = {
	yo: {
		epale: {
			hello: "esto un  un texto grande"
		},
		hola: 65
	},
	hi() { },
	epa: () => { }
}


let obj2 = {
	yo: {
		epale: {
			hi: "wepa",
			me: "ric"
		},
		hola: 65
	},
	hi: 6
}

let arr = [
	349, 350, obj, obj2, 353, 354, 355,
	356, 357, 358, 359, '360', 361, 362
]

const set = new Set(arr)

const setLog = inspect(arr, { compact: true, depth: 1 })
	.replaceAll("\n ", "")
	.replaceAll(" },", " },\n")
	.replaceAll("{", "\n {")



// instantiate
let table = new Table({
	wordWrap: true,
	chars: {
		"top": ' ', 'top-mid': '', 'top-left': '', 'top-right': ''
		, 'bottom': ' ', 'bottom-mid': '', 'bottom-left': '', 'bottom-right': ''
		, 'left': '', 'left-mid': '', 'mid': ' ', 'mid-mid': ''
		, 'right': '', 'right-mid': '', 'middle': ''
	},
})



// table.push(
// 	[
// 		{ content: "0".yellow.thick, vAlign: "center"},
// 		{content: show(obj).red, truncate: true},
// 		show(obj2).green
// 	],
// 	[
// 		{content: "0".yellow.thick, vAlign: "center", style: {["padding-right"]: 10}},
// 		show(obj).red,
// 		show(obj2).green
// 	],
// );

// console.group()

table.push(
	["3", 2, 4],
	[1, 5],
)

console.log(table.toString());


function show(obj) {
	let objStr = inspect(obj, { compact: false, colors: false, depth: 2, sorted: true })
	objStr = objStr.slice(4, objStr.length - 2)
	objStr = objStr.replaceAll("\n  ", "\n")
	return objStr
}
