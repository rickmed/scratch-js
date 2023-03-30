let runnableActors = new Set()

const NONE = Symbol("none")
const FULL = Symbol("full")

function newBuffer(cap = 100) {
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
		},
		waitingReceiver: undefined,
		waitingSenders: new Set(),
	}
}

function newActor(genObj) {
	const actor = genObj
	actor._inBuff = newBuffer()
	actor.pipe = function pipe(otherActor) {
		actor._outBuff = otherActor._inBuff
		currRunningActor = actor
		runActor()
	}
}

let currRunningActor = undefined

const REC = 1
function rec() {
	return REC
}

const OUT = 2
function out(msg) {
	currRunningActor._outMsg = msg
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
	currRunningActor = newActor(genObj)
	runActor()
}


function runActor() {
	// need to check here what status is the actor in
	// bc it k

	const actor = currRunningActor
	let yielded = actor.next()

	while (!yielded.done) {

		const yieldedVal = yielded.value

		if (yieldedVal === REC) {

			const msgFromBuffer = actor._inBuff.pull()

			if (msgFromBuffer === NONE) {
				actor._inBuff.waitingReceiver = actor
				return
			}

			yielded = actor.next(msgFromBuffer)
			continue
		}

		if (yieldedVal === OUT) {

			if (!actor._outBuff) {
				// actor stays in actor._outMsg = msg
				return
			}

			const pushResult = actor._inBuff.push(actor._outMsg)

			if (pushResult === FULL) {
				// actor stays in actor._outMsg = msg
				actor._outBuff.waitingSenders.add(actor)
				return
			}

			yielded = actor.next()
			continue
		}

		if (yieldedVal === SLEEP) {

			setTimeout(() => {
				yielded = actor.next()
				continue
			}, sleep_ms)

			return
		}
	}
}





async function* player(name) {
	while (true) {
		let msg = yield rec();
		// let {sender, msg} = yield recWithSender()

		msg.hits += 1;
		console.log(`${name} hits. Total hits: ${msg.hits}`);

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
