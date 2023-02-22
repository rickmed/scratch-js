async function async_fn() {
	return Promise.resolve("async")
}

function sync_fn() {
	return "sync"
}


async function uno(cb) {
	let res

	if (cb.constructor.name === "AsyncFunction") {
		res = await cb()
	}
	else {
		res = cb()
	}

	console.log(res)
}

uno(sync_fn)

console.log("CONSOLE")


// export function buildTestID(path, title) {
// 	if (title === "test 333") {
// 		console.log({path, title})
// 		console.log(new Error().stack)
// 		console.log("")
// 	}

// 	if (path.length === 0) return title

// 	let id = path.join(SEP)
// 	id += SEP + title

// 	return id
// }