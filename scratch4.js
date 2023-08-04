/* I need runningPrc for:

	sleep(): in prc.cancel() it needs to do clearTimeout() that sets sleep

- need to set runningPrc_m so that next ribu op can catch it. Example:

	channel msg exchange:

	csp.queue.enqueue(putterPrc, receiverPrc), q is [receiverPrc, putterPrc]
	resolvePutter()
	resolveReceiver()

	putter continues, user could do:

		- ch.rec():

			putterPrc = queue.pull()  // q is [receiverPrc]

				queue.enqueue(putterPrc2, receiverPrc2)
				resolvePutter2()  // scheduled
				resolveReceiver2()  // scheduled
				microtask = [putterPrc2, receiverPrc2, receiverPrc]
				-- goes to 2) ---  q is [putterPrc2, receiverPrc2, receiverPrc]


		- sleep():
			putterPrc = queue.pull() // putterPrc,
			On wake: q.enqueue(putterPrc)
			-- goes to 2) ---  q is [receiverPrc]

		- finishNormalDone():
			if go() goes after this?


		- go():
			putterPrc = q.pull()  // to use as parent, q is [receiverPrc]
			-- runningPrc must be newPrc. so q.skipQueue(newPrc), q is [receiverPrc, newPrc] --

			any sync op runs. Options:
				- sleep():
					newPrc = queue.pull()  // q is [receiverPrc]
					-- goes to 2) ---  q is [receiverPrc]
				- go():
					newPrc = q.pull()
					//...idem
				- ch.rec():
					receiverPrc3 = queue.pull()  // newPrc, q is [receiverPrc]

					queue.enqueue(putterPrc3, receiverPrc3)
					resolvePutter()  // scheduled
					resolveReceiver()  // scheduled
					-- goes to 2) ---  q is [receiverPrc, putterPrc3, receiverPrc3]




	2) receiver resolves. Idem options.
		operator has runningPrc = q.pull()  // receiverPrc

*/


/* Detecting unwrapped promises (no runningPrc tracking)

	when all sync operations are done from a chan exchange resume,
	runningPrcS_m must be empty.
	I could schedule a microtask to check this after each ribu op.
	do this if csp.detectUnwrappedIO = true
	export csp object to user.

*/


function greet() {
	console.log(this.name)
}

function Person(name) {
	let obj = {name}
	obj.__proto__.greet = greet
	return obj
}

// const p = Person("rick")
// console.log(Object.getOwnPropertyNames(p.__proto__))


function Person2(name) {
	this.name = name
}

Person2.prototype.greet = greet

const p2 = new Person2("rick")
console.log(Object.getOwnPropertyNames(p2.__proto__.__proto__))

p2.greet()
