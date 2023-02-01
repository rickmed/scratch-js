const origWrite = process.stdout.write

// process.stdout.write = (data) => {
// 	origWrite.call(process.stdout, "logged: " + data)
// }

process.stdout.moveCursor(16)
console.log({hello: 3})