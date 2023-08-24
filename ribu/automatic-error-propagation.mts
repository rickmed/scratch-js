import E from "./error-modeling.js"

function main() {

	go(prc2)

	return "4"
}

// automatic error short circuiting?
// I would need to inspect the type of the value that the channel
// will resume the prc with
	// if instanceof Err, then genObj.return() or resolve prc with Err
	// but can't be statically checked :(, I think.

// let's say fs.read returns a Ch<

function* fsRead(x: string) {
	if (x === "ds") return "file"
	return Error("EPAEL")
}

type Ch<V> = {
	v: V
}

function* prc2() {
	yield "HI" as const
	const file = yield* fsRead("file.txt")  // let's say this fails.
	const data = process(file)
	return data
}

function process(file: Ch<string>) {
	return file + "hi"
}


main()
console.log("main done")


// function* prc() {
// 	const file: boolean = yield "hi"
// 	if (file === true) {
// 		return "epale"
// 	}
// 	const x = yield 4
// 	return 434
// }
