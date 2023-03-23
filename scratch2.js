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