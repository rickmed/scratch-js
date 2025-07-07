// this is what we want to comply to
interface Comply {
	method1(): number
}

function fn1(x: Comply) {
	return x.method1()
}

/* Notes
	* What I'd really need it to mix two classes where the 3rd class has all Ks and Ms
*/

// methods of Methods will be put in obj's prototypes (could do +1 classes)
class Methods<V> {
	method1(this: User<V>) {
		return this.v
	}
}


/*****   Mixins with POJOs   *****/
// Issue: properties are not private.
// Trade-off: either public Ks or copy methods (Ks in clouse)

interface User<V> extends Methods<V> {
	v: V
	name: string
}


let obj1 = { v: 11, name: "john1" } as User<number>
Object.setPrototypeOf(obj1, Methods.prototype)


const obj1a = obj1.method1()
const obj1b = fn1(obj1)


/*****   Mixins with classes   *****/

class Ks2<V> {
	constructor(
		public v: V,
		public name: string,
		// private __proto__: null = null
	) { }
}

// including getters and setters
class Obj2<V> extends Ks2<V> {
	get getVV() {
		return this.v
	}
	set setV(x: V) {
		this.v = x
	}
}

// apply mixin
Object.getOwnPropertyNames(Methods.prototype).forEach((name) => {
	Object.defineProperty(
		Obj2.prototype,
		name,
		Object.getOwnPropertyDescriptor(Methods.prototype, name) ||
		Object.create(null)
	);
});

interface Obj2<V> extends Methods<V> { }

let obj2 = new Obj2(22, "john2")

const obj2a = obj2.method1()

const obj2b = fn1(obj1)
