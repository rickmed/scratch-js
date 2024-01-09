import fs from "node:fs"


function xx() {
	let res
	let rej

	fs.readFile("./packae.json", "utf8", (err, data) => {
		console.lo("done")
		if (err) rej(err)
		res(data)
	})

	return new Promise((_res, _rej) => {
		res = _res
		rej = _rej
	})
}

try {
	const res = await xx()
	console.log(res)
}
catch (e) {
	console.log("errorrr", e)
}