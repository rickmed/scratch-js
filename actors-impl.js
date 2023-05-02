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
		get isEmpty() {
			return _buffer.length === 0
		},
		waitingReceiver: undefined,
		waitingSenders: new Set(),
	}
}

function newActor(genObj) {

	const actor = genObj

	actor._inBuff = newBuffer()
	actor.state = undefined

	actor.pipe = function pipe(otherActor) {
		actor._outBuff = otherActor._inBuff
		currRunningActor = actor
	}

	return actor
}

let currRunningActor = undefined

const REC = 1
function rec() {
	return REC
}

const SEND = 2
function out(msg) {
	currRunningActor._outMsg = msg
	return SEND
}

const SLEEP = 3
let sleep_ms
function sleep(ms) {
	sleep_ms = ms
	return SLEEP
}

function fork(gen, ...args) {
	const genObj = gen(...args)
	const actor = newActor(genObj)
	currRunningActor = actor
	runActor()
	return actor
}



/*
	actor._state
	actor._inBuff.waitingSenders
	actor._inBuff.waitingReceiver
	actor._outBuff
	actor._outMsg
*/
const BLOCKED_SEND = 1  // actor._outMsg = msg
const BLOCKED_REC = 2

function runActor() {

	const actor = currRunningActor

	if (actor._state === BLOCKED_REC) {

	}
	/*
	what state is it in?
	*/
	// in yield out(msg)
	// or yield rec()

	let yielded = actor.next()

	while (!yielded.done) {

		const yieldedVal = yielded.value

		if (yieldedVal === REC) {

			const msgFromBuffer = actor._inBuff.pull()

			if (msgFromBuffer === NONE) {
				actor._inBuff.waitingReceiver = actor
				actor._state = BLOCKED_REC
				return
			}

			yielded = actor.next(msgFromBuffer)
			continue
		}

		if (yieldedVal === SEND) {

			if (!actor._outBuff) {
				actor._state = BLOCKED_SEND
				return
			}

			const pushResult = actor._inBuff.push(actor._outMsg)

			if (pushResult === FULL) {
				actor._outBuff.waitingSenders.add(actor)
				actor._state = BLOCKED_SEND
				return
			}

			yielded = actor.next()
			continue
		}

		if (yieldedVal === SLEEP) {

			setTimeout(() => {
				resumeFromSleep(actor)
			}, sleep_ms)

			return
		}
	}
}

function resumeFromSleep(actor) {
	
}


function send(actor, msg) {

}



async function* player(name) {
	while (true) {
		let msg = yield rec();
		// let {sender, msg} = yield take()

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




/**** self() api options ***


// need to access selfPID() here somehow
spawn(function* coor({pid}) {
	coor.pid

})


*/
