import { start } from "ribu"

// start is important for testing, so modules are pure (one scheduler per system)
const { spawn } = start()

// me === self()
spawn(function* coord({me}) {

	// yield to ribu knows this is a child of coord
	// both below are launched in parallel
	yield spawn(locateFilePaths, me)
	yield spawn(loadFiles, pid)

})




/*
me()

// need to access selfPID() here somehow
spawn(function* coor({pid}) {
	coor.pid

})


*/


/*
ways to "connect" actors

// 1) weird bc locateFiles should be first in OOO-pipeline
// but need loadFiles pid so that locateFiles knows where to send data

spawn(function* coord({me}) {

	const pid = yield spawn(loadFiles, me)
	yield spawn(locateFiles, pid)

})


// 2) locateFilesPaths send to that channel, loadFiles receives on same channel

spawn(function* coord({me}) {

	const _ch = ch()
	yield spawn(locateFilePaths, _ch)
	yield spawn(loadFiles, _ch, me)

})


// 3) implementation???

spawn(function* coord({me}) {

	const locate = yield spawn(locateFilePaths, _ch)
	const load = yield spawn(loadFiles, _ch, me)
	locate.pipe(load)

})
*/
