// const inFlight = Monitor()
// ?? need a way to cancel the most recent one or filter by type or whatever.
	// what happens if I keep track manually of the Prcs and I cancel one that Monitor is monitoring?
		// maybe monitor ignores the one that are finished with ECancelled?


/*** Restart: cancel last request and issue a new one ***/

let inFlight: Prc | undefined = undefined

requestButton.onClick(() => {
	inFlight = go(function* () {
		if (inFlight) {
			yield inFlight.cancel()
		}
		const res = yield* request
		this.setState(res)
	})
})



/*** Keep latest: if new one comes and one is in flight, keep the one in flight ***/

requestButton.onClick(() => {
	go(function* () {
		if (inFlight) {
			return
		}
		inFlight = request
		const res = yield* request
		this.setState(res)
	})
})
