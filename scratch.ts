/* I need runningPrc for:
	sleep(): is prc.cancel() it needs to do clearTimeout() that sets sleep

- need to set runningPrc_m so that next ribu op can catch it


	csp.queue.push(putterPrc, receiverPrc)
	resolvePutter()
	resolveReceiver()

	putter resolves. Options:
		- ch.rec():
			putterPrc = queue.pull() // putterPrc, q is [receiverPrc]

			queue.push(putterPrc2, receiverPrc2)
			resolvePutter()  // scheduled
			resolveReceiver()  // scheduled
			-- goes to 2) ---  q is [receiverPrc, putterPrc2, receiverPrc2]

		- sleep():
			putterPrc = queue.pull() // putterPrc,
			On wake: q.push(putterPrc)
			-- goes to 2) ---  q is [receiverPrc]

		- finishNormalDone():
			if go() goes after this?


		- go():
			putterPrc = q.pull()  // to use as parent, q is [receiverPrc]
			// here the runningPrc must be newPrc.
			// so q.shift(newPrc), q is [newPrc, receiverPrc]
			any sync op runs. Options:
				- sleep():
					newPrc = queue.pull()  // q is [receiverPrc]
					-- goes to 2) ---  q is [receiverPrc]
				- go():
					newPrc = q.pull()
					//...idem
				- ch.rec():
					receiverPrc3 = queue.pull()  // newPrc, q is [receiverPrc]

					queue.push(putterPrc3, receiverPrc3)
					resolvePutter()  // scheduled
					resolveReceiver()  // scheduled
					-- goes to 2) ---  q is [receiverPrc, putterPrc3, receiverPrc3]




	2) receiver resolves. Idem options.
		the idea is that q.pull() -> receiverPrc

*/