
// const format = (startCode, endCode) =>
// str => "\x1b[" + startCode + "m" + str + "\x1b[" + endCode + "m"

// "\x1b[39m"

// /* Colors */
// const RESET_COL = "39"   // set default foreground color
// const RESET_BG = "49"    // set default background color

// const codes = {
// 	black: ["30", RESET_COL],
// 	red: ["31", RESET_COL],
// 	green: ["32", RESET_COL],
// 	yellow: ["33", RESET_COL],
// 	blue: ["34", RESET_COL],
// 	magenta: ["35", RESET_COL],
// 	cyan: ["36", RESET_COL],
// 	white: ["37", RESET_COL],
// 	gray: ["90", RESET_COL],
// 	bgBlack: ["40", RESET_BG],
// 	bgRed: ["41", RESET_BG],
// 	bgGreen: ["42", RESET_BG],
// 	bgYellow: ["44", RESET_BG],
// 	bgBlue: ["44", RESET_BG],
// 	bgMagenta: ["45", RESET_BG],
// 	bgCyan: ["46", RESET_BG],
// 	bgWhite: ["47", RESET_BG],
// 	bgGray: ["100", RESET_BG],
// 	bold: ["1", "22"],
// 	dim: ["2", "22"],
// 	italic: ["3", "23"],
// 	underline: ["4", "24"],
// 	inverse: ["7", "27"],
// 	hidden: ["8", "28"],
// 	overline: ["1", "22"],
// 	strikethrough: ["1", "22"],
// 	reset: ["1", "22"],
// }

// /* Modifiers */
// export const overline = format(53, 55);
// export const strikethrough = format(9, 29);
// export const reset = format(0, 0);




// export const reset = format(0, 0)
// export const bold = format(1, 22)
// export const dim = format(2, 22)
// export const italic = format(3, 23)
// export const underline = format(4, 24)
// export const overline = format(53, 55)
// export const inverse = format(7, 27)
// export const hidden = format(8, 28)
// export const strikethrough = format(9, 29)

// console.dir(inverse(red("Hello")))
// console.dir(red(inverse("Hello")))
// console.dir({red: red("Hello")})
// console.dir({inverse: inverse("Hello")})

// const api = {
// 	message1: "hello",
// 	message2: "everyone",
// }

// const handler2 = {

// 	// eslint-disable-next-line -- _ var not used
// 	get(_, k) {
// 		return "world"
// 	},
// }

// export const proxy2 = new Proxy(api, handler2)

// console.log("HELLO")
// console.log("\x1b[31mHELLO")
// console.log("HELLO")
console.log("\x1b[31m HELLO \x1b[m")

console.log("HELLO")
