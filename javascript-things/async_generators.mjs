function sleep(ms) {
	return new Promise(res => {
		setTimeout(() => res(), ms)
	})
}

async function* fn1() {
	yield "hola"
	await sleep(2000)
	return "Im done"
}

const res = fn1()
console.log(await res.next())
console.log(await res.next())