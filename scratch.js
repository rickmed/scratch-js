/*
- there's no global scheduler
- goroutines are attached to channels and blocked()|unblocked() whenever
a goroutine in the other side puts/takes a value.
- channels have lists of receivers and senders.
	- sendersList is used to be unblocked whenever a channel has free capacity.
	- receiverList is used to be unblocked whenever there's new data (to be pulled from)
*/

const CH = Symbol("channel")
function ch(cap) {
	return {
		type: CH,
		cap,
		queue: [],
		receivers: [],
		senders: [],
	}
}


function go(genFn, ...args) {
	const gen = genFn(...args)

}

function take(ch) {

}




function timeout(ms) {
	return new Promise(res => setTimeout(() => res()), ms)
}



async function* player(name, table) {
	while (true) {
		let ball = yield take(table);

		if (ball === CLOSED) {
			console.log(name + ": table's gone");
			return;
		}

		ball.hits += 1;
		console.log(`${name} ${ball.hits}`);

		await timeout(100);
		yield put(table, ball);
	}
}

const table = ch();
go(player, "ping", table);
go(player, "pong", table);
yield put(table, { hits: 0 });