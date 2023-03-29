/*
	So this is like CSP but channels are not fan-out, ie,
	1Process:1Channel

	fork runs the object and returns {gen}
		runs:
			it runs the gen until rec()

				it checks if gen has an out channel (below it doesn't, until pipe())
					so it parks it

				pipe provides it with an out channel (and calls scheduler to resume the gen)

			-rec():


			- out(msg):
				- checks if queue has capacity,
					- if it has, it puts the value in queue and continue running then gen until:
						- done
						- ch is full
							which will park the gen (put it in ch.waitingSenders)
							and put the ch in channelsWithNewMsgs

		Processes can be blocked on send (when out is full) or in (no new msgs)

*/

const NONE = Symbol("none")
const FULL = Symbol("full")

function Buffer(cap = 100) {
	let _buffer = []
	return {
		pull() {
			if (_buffer.length === 0) {
				return NONE
			}
			--cap
			return _buffer.pop()
		},
		push(x) {
			if (_buffer.length === cap) {
				return FULL
			}
			++cap
			_buffer.unshift(x)
		}
	}
}

let currRunningProcess = undefined

const REC = 1
function rec() {
	return REC
}

const OUT = 2
let outMsg
function out(msg) {
	outMsg = msg
	return OUT
}

const SLEEP = 3
let sleep_ms
function sleep(ms) {
	sleep_ms = ms
	return SLEEP
}

function fork(gen, ...args) {
	const genObj = gen(...args)
	genObj._inQ = Buffer()
	runProcess(genObj)
}


function runProcess(genObj = currRunningProcess) {
	let process = currRunningProcess

	let yielded = process.next()

	while (!yielded.done) {

		const yieldedVal = yielded.value

		if (yieldedVal === REC) {

			const msgFromBuffer = process._inQ.pull()

			if (msgFromBuffer === NONE) {
				park(process)
				return
			}

			yielded = process.next(msgFromBuffer)
			continue
		}

		if (yieldedVal === OUT) {

			if (!process._outQ) {
				park(process)
				return
			}

			const pushResult = process._inQ.push(outMsg)

			if (pushResult === FULL) {
				park(process)
				return
			}


		}

		if (yieldedVal === SLEEP) {
			setTimeout(() => {
				yielded = process.next()
				continue
			}, sleep_ms)
		}

	}
}


let parkedProcesses = new Set()
function park(process) {
	parkedProcesses.add(process)
}


async function* player(name) {
	while (true) {
		let msg = yield rec();
		// let {sender, msg} = yield recWithSender()

		msg.hits += 1;
		console.log(`${name} hits. Total hits: ${msg.hits}`);

		// await sleep(500); this does not work bc the scheduler needs to know when to park/resume other actors
		yield sleep(500)
		yield out(msg);
		// or yield out(msg, sender)
	}
}


const p1 = fork(player, "ping")
const p2 = fork(player, "pong")
p1.pipe(p2)
p2.pipe(p1)
send(p1, {hits: 0})

// or
// let p1 = fork(player, "ping")
// p1.pipe(player, "pong").pipe(p1)
//

yield put(table, { hits: 0 });


const ping = spawnStateless(system, async (msg, ctx) =>  {
	console.log(msg.value);

	await delay(500);
	dispatch(msg.sender, { value: ctx.name, sender: ctx.self });
 }, 'ping');

 const pong = spawnStateless(system, (msg, ctx) =>  {
	console.log(msg.value);
	dispatch(msg.sender, { value: ctx.name, sender: ctx.self });
 }, 'pong');

 dispatch(ping, { value: 'begin' sender:pong });




/**** self() api options ***


// need to access selfPID() here somehow
spawn(function* coor({pid}) {
	coor.pid

})


*/




/**** ways to "connect" actors ***

1) Elixir style
	- not great bc locateFiles should be first in OOO-pipeline
	but need loadFiles pid so that locateFiles knows where to send data

spawn(function* coord({me}) {

	const pid = yield spawn(loadFiles, me)
	yield spawn(locateFiles, pid)

})


// 3) implementation???
ie, where should locate send stuff?

spawn(function* coord({me}) {

	const locate = yield spawn(locateFilePaths)
	const load = yield spawn(loadFiles, me)
	locate.pipe(load)

	// or (if you don't need to reference load elsewhere)

	yield spawn(locateFilePaths).pipe(loadFiles, ...args)

})
*/
