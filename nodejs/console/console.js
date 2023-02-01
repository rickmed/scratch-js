const origWrite = process.stdout.write

let logs = []

process.stdout.write = (data) => {
	logs.push(data)
	// origWrite.call(process.stdout, "logged: " + data)
}

console.group()
console.log("\x1b[31m  HOLA  \x1b[m")
console.dir("\x1b[31m  HOLA  \x1b[m")
console.groupEnd()
console.dir('DONE')

process.stdout.write = origWrite

console.dir(logs)
