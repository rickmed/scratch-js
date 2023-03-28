/*

- take(ch): the obj ch is sent to the gen's manager,
	- it checks if there msgs available in queue,
		- if no msgs, the scheduler puts the gen object in the ch's waitingReceivers
			- and continues
		- if there are, it sends them to gen (until gen finishes)

- put(ch): the obj ch is sent to the gen's manager,
	- checks if queue has capacity,
		- if it has, it puts the value in queue and continue running then gen until:
			- done
			- ch is full
				which will park the gen (put it in ch.waitingSenders)
				and put the ch in channelsWithNewMsgs

after main*'s put():
	ch.waitingReceivers = [player1, player2] and ch.msgs[{hits: 0}] and
	channelsWithNewMsgs = [ch]

Everytime put(), take() finishes I need to loop channelsWithNewMsgs (pending work):

	pop player1 from from ch.waitingReceivers, and runs it
		it sleeps (parked with a promise to rerun scheduler)
			but it could have take() again.
				* maybe a process could starve other ones (so need to schedule them)

** CSP implementation includes mChannels*nProcesses implementation
		conjecture: most applications just need 1:1 communication (like actors)
		so actors as a default implementation maybe be way simpler.








	1) loop all channels to see if there are waitingReceivers and resumes the first one
	with the first value in queue
		- but this is inefficient bc most channels won't have waitingReceivers | Senders at some time
	* so need to index the ones that have newInfo
	* indexing runnable processes is unnecessary (if keeping process' references in channels)

	2) index the channels that have new info in them (on put)
		- loop those channels (and waitingReceivers, waitingSenders),
			(pop them and resume) with the value (if Receivers)

	3) index queue: [processes,ch]:
		- [player1,table, 0], [player2,table, 0]   // these are pending to be ran
			// 0 means they're parked to *take* so the scheduler knows to resume them with .next(queueTopVal)
			player1 is ran until sleep:
				scheduler parks it (puts it in a promise which when finished, it places it at the back of runnable
					queue to be ran
			scheduler now pops player2 from runnableQueue (blocked on take)
				(in this ocasion, player2 can't be resumed bc there are no messages in its take.queue bc player1 took it)
				but it is not taken from the runnableQueue since it wasn't ran.
				scheduler returns
			- player1 wakes up from sleep
					- does a put() (sends the ch object to scheduler)
					- now I'd need to run player2 (waiting for new msgs in its inbox)
						but I would to loop all runnableQueue (most processes there are not interested in this channel)
							so this is innefficient.
						I need an index of all processes interested in that channel (ch.waitingReceivers)

*/

const CH = Symbol("channel")
const PUT = 1
const TAKE = 2

function ch(capacity) {
	return {
		type: CH,  // bc you can yield other things like sub-tasks
		capacity,
		msgs: [],
		waitingReceivers: [],
		waitingSenders: [],
		request: undefined,
		put() {
			this.request = PUT
			return this
		},
		take() {
			this.request = TAKE
			return this
		}
	}
}


function fork(genFn, ...args) {
	const gen = genFn(...args)

	let yieldedVal = gen.next()
	while (g)
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
fork(player, "ping", table);
fork(player, "pong", table);
yield put(table, { hits: 0 });