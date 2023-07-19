const controller = new AbortController()
controller.signal

console.time()

async function hi() {
	let photos = await fetch("https://jsonplaceholder.typicode.com/photos", {signal: controller.signal})
	photos = await photos.json()
	console.log(photos[0])
}


function promSleep(ms) {
	return new Promise(res => {
		timeoutID = setTimeout(() => {
			if (controller.cancelled) return
			console.log("resolved")
			res(undefined)
		}, ms)
	})
}


console.log("hello")
hi()
.catch(e => e)
.finally(() => {
	console.log("nothing")
	console.timeEnd()
})
controller.abort()
// clearTimeout(timeoutID)
console.log("all done")
