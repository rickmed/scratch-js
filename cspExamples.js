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

// yield put(table, { hits: 0 });

/**** self() api options ***

// need to access selfPID() here somehow
spawn(function* coor({pid}) {
	coor.pid

})

*/
