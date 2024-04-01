/**
 * @todo rewrite to specialized data structure (ring buffer, LL...)
 */
export class Queue<V> {

	_array_m: Array<V> = []
	_capacity

	constructor(capacity = Number.MAX_SAFE_INTEGER) {
		this._capacity = capacity
	}

	get isEmpty() {
		return this._array_m.length === 0
	}

	get isFull() {
		return this._array_m.length === this._capacity
	}

	clear() {
		this._array_m = []
	}

	deQ() {
		return this._array_m.pop()
	}

	enQ(x: V) {
		this._array_m.unshift(x)
	}
}


export class ArrSet<V> {
	arr_m: Array<V> = []

	delete(v: V): this {
		const arr = this.arr_m
		arr.splice(arr.indexOf(v), 1)  // todo splice is expensive
		return this
	}

	get size(): number {
		return this.arr_m.length
	}

	add(v: V): this {
		this.arr_m.push(v)
		return this
	}

	// [Symbol.iterator] = this._array_m[Symbol.iterator]
}


const Q_VAL_PREFIX = "$_q$"
/**
 * - Callback arrays grow forever (splice() is expensive). It's ok since
 * callback deletions rarely happen in usage of this class.
 * - on() returns arrays idx so that callers can remove at O(1).
 * - There's a queue of 1 for each event name to be consumed (if exists) when
 * .on() arrives.
 */
export class Events {

	_store: Store = {}

	_on(name: string, cb: CB): number | undefined {

		let { _store } = this

		const qKey = Q_VAL_PREFIX + name
		const qVal = _store[qKey]
		if (qVal) {
			cb(qVal)
			_store[qKey] = undefined
			return
		}

		let cbs = _store[name]

		if (!cbs) {
			_store[name] = cb
			return 0  // when a new cb comes, arr is created and this cb becomex idx = 0
		}
		if (typeof cbs === "function") {
			_store[name] = cbs = [cbs]
		}
		cbs.push(cb)
		return cbs.length - 1
	}

	// make sure to call .on() first for the same event name
	_off(name: string, idx: number) {
		let { _store } = this
		let cbs = _store[name]!
		if (typeof cbs === "function") {
			_store[name] = undefined
		}
		else {
			(cbs as Array<CB | undefined>)[idx] = undefined
		}
	}

	_offAll(name: string) {
		this._store[name] = undefined
	}

	_emit(name: string, val: unknown) {
		let { _store } = this
		let cbs = _store[name]

		if (!cbs) {
			this._store[Q_VAL_PREFIX + name] = val as undefined
			return
		}

		if (typeof cbs === "function") {
			cbs(val)
			_store[name] = undefined
			return
		}

		const l = cbs.length
		for (let i = 0; i < l; i++) {
			const cb = cbs[i]
			if (cb) {
				cb(val)
				cbs[i] = undefined
			}
		}
	}

	// store[name] can be [...undefined], but it's ok since _emit() will be noop
	_haveCBs(name: string) {
		return this._store[name]
	}
}

type CB = (...args: any[]) => void
type CBS = undefined | CB | Array<CB | undefined>
type Store = {
	[key: string]: CBS;
}