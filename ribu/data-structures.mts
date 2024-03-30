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
		arr.splice(arr.indexOf(v), 1)
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