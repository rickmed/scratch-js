// @ts-nocheck


/*** Cancellation ?
	I know which prc is running, when it yields something

	inside readDir there's a genOb yielding.

*/


function* readDir() {
	// prom is yielded to mainManager, and it will resume with success of prom
	const prom = fs.readdir("./", {withFileTypes: true})
	const x = yield prom
	return x as Awaited<typeof prom>
}