//@ts-nocheck

import { sleep } from "effect/Clock"

var ch = chan()

go(function* () {
	while (true) {
		yield put(ch, 1)
		yield sleep(250)
	}
})

go(function* () {
	while (true) {
		yield put(ch, 2)
		yield sleep(300)
	}
})

go(function* () {
	while (true) {
		yield put(ch, 3)
		yield sleep(1000)
	}
})


go(function* () {
	for (var i = 0; i <10; i++) {
		console.log(yield take(ch))
	}
	ch.close()
	// if a close here, mostly likely prcS are sleeping,
	// so I close and move on (but prcS are still alive)
		// they will awake from sleep, block forever and be GCed.
	//
})

// think about TOCTTOU situations
