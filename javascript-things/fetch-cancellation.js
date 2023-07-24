/*
	Both fetch and undici.request are not really aborted.
	Both keep callbacks unresolved in the background.
	See below how when using process.exit(), nodejs finishes way faster
	than waiting for any scheduled callbacks to be resolved.
*/

import process from 'node:process';
import { request } from "undici"


const controller = new AbortController()
controller.signal


async function hi() {
	console.log("fetching")
	let photos = await fetch("https://jsonplaceholder.typicode.com/photos", {signal: controller.signal})
	console.log("done fetching")
	photos = await photos.json()
	console.log(photos[0])
}

// async function hi() {
// 	console.log("fetching")
// 	const {body} = await request("https://jsonplaceholder.typicode.com/photos", {signal: controller.signal})
// 	console.log("done fetching")
// 	const photos = await body.json()
// 	console.log(photos[0])
// }

// let timeoutID

// function promSleep(ms) {
// 	return new Promise(res => {
// 		timeoutID = setTimeout(() => {
// 			if (controller.cancelled) return
// 			console.log("resolved")
// 			res(undefined)
// 		}, ms)
// 	})
// }



process.on("exit", () => {
	console.timeEnd("node finish")
})

console.time("hi call")
hi()
.catch(e => {
	console.log(e.name)
	console.timeEnd("aborting took")
	console.time("node finish")
	// console.log("forcing exit")
	// process.exit()
})

console.timeEnd("hi call")


console.time("aborting took")
controller.abort()

// promSleep(3000)
// clearTimeout(timeoutID)
// console.time("node finish")
