import { go, Ch, DONE, type Job, me, myJobs } from "ribu"
/*
	Fix this whole file bc onlyUsed_Ch should be notified to mainSophi.ts
	otherwise, file processing in other nodejs workers won't be cancelled
*/

function* worker($locateFiles, resultsCh, onlyUsed) {
	const {filePaths} = $locateFiles

	for (;;) {
		const filePath = yield* filePaths.rec
		const suite = yield* fileSuite(filePath)
		if (suite.onlyUsed === true) {
			// alert parentThread onlyUsed
				// todo: need a thread-supported version of Ch and me()
			const resume = yield* onlyUsed(me())
			// if I'm resumed, it means I wasn't cancelled.
		}
	}
}

export default worker



/***  Child cancelling siblings and continue working **************************/

function* parent() {
	const childs = [1, 2, 3].map(id => go(jobling, id, myJobs()))
	const res = yield* myJobs().cont
}

function* jobling(id: number, parentChilds: Job[]) {
	const x = yield* asyncWork1()
	if (x === "something") {
		const siblings = parentChilds.toSpliced(parentChilds.indexOf(me()), 1)
		yield* cancel(siblings).$  // cancel() can pass Job | Job[]
	}
	const y = yield* asyncWork2()
}
