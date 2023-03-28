async function* player(name, table) {
	while (true) {
		let ball = yield take(table);

		ball.hits += 1;
		console.log(`${name} hits. Total hits: ${ball.hits}`);

		// await timeout(100); this does not work bc the scheduler needs to know when to park/resume other actors
		yield sleep(100)
		yield put(table, ball);
	}
}

fork(function* main() {

	const table = ch(1);

	fork(player, "player 1", table)
	fork(player, "player 2", table)

	yield put(table, { hits: 0 });
})



/* example of sophi coordinator

A channel needs to be created so that workers pass messages to it (or
and actor with a channel attached) -> actor.send(msg)

Sophi stages:
1) look for testFiles
	since look for testFiles needs to wait for I/O bc it is recursive, step 2
	can start in parallel

2) loadTestFiles: import(testFiles) and make testSuites (work stealing by workers)
	1 and 2 can be ran in parallel (coordinator launches both in parallel)

3) onlyUsed checkpoint:
	await(onlyUsed: file | filesImported)
		the coordinator actor must passed to the loadTestFiles workers.



4) run the tests...


*/
