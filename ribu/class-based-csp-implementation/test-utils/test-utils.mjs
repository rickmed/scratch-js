import { CSP_api } from "../source/core.mjs"

class Clock {

	/** @type {Array<{ms: number, cb: _Ribu.VoidCB}>} */
	sheduledCallbacks = []

	/** @type {(ms: number) => Promise<boolean>}  - true if there was a scheduled callback. False otherwise */
	async tick(ms) {

		const allScheduled = this.sheduledCallbacks

		let currScheduled = allScheduled[0]

		if (currScheduled === undefined) {
			return false
		}

		/** @type {Array<Promise<true>>} */
		let proms_when_CBs_are_fired = []

		while (ms >= currScheduled.ms) {

			const {cb} = currScheduled

			const prom_when_cb_is_fired = new Promise(res => {
				globalThis.setTimeout(() => {cb(); res(true)}, 0)
			})

			proms_when_CBs_are_fired.push(prom_when_cb_is_fired)

			const _currScheduled = allScheduled.shift()

			if (_currScheduled === undefined) {
				break
			}

			currScheduled = _currScheduled
		}

		await Promise.all(proms_when_CBs_are_fired)
		return true
	}

	/** @type {_Ribu.SetTimeout} */
	setTimeout(cb, _ms) {

		// could order by ms with like binary search and LL, but good enough

		const scheduled = this.sheduledCallbacks
		const l = scheduled.length
		let i = 0
		while (i < l) {
			const {ms} = scheduled[i]
			if (_ms <= ms) {
				break
			}
			i++
		}

		scheduled.splice(i, 0, {cb, ms: _ms})
	}
}


export class CSP extends CSP_api {

	constructor() {
		super()
		const clock = new Clock()
		this.clock = clock
		this._setTimeout = clock.setTimeout
	}

}