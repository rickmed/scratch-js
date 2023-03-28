/*
	So this is like CSP but channels are not fan-out, ie,
	1Process:1Channel

	implementation:
		fork accepts a gen or {rec()}

	fork runs the object and returns {gen}
		runs:
			if runs the gen until rec()
				rec() returns just a constant (message to scheduler)
				it checks if gen has an out channel (below it doesn't, until pipe())
					so it parks it
				pipe provides it with an out channel (and calls scheduler to resume the gen)


			out(msg) has the same semantics as out(ch, msg)




*/


async function* player(name) {
	while (true) {
		let msg = yield rec();
		// let {sender, msg} = yield rec(withSender)

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
