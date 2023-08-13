// this is what we want to comply to
interface Comply {
	method1(): string
}

function fn1(x: Comply) {
	return x.method1()
}

/* Methods mixed at prototype work with both Objects and Classes  */

class Methods<V> {
	method1<V>(this: User<V>) {
		return this.v
	}
}

/* Mixins with POJOs */

interface User<V> extends Methods<V> {
	v: V
	name: string
}


let obj1 = {v: 58, name: "john"} as User<number>
Object.setPrototypeOf(obj1, Methods.prototype)
const ww = obj1.method1()

const str = fn1(obj1)





// const x  = obj1
// type W<Type> = Type extends Obj2<infer X> ? X : never
// const x1 = Object.setPrototypeOf(obj1, Proto1) as W<typeof obj> & typeof Proto1

// const z = x1.greet()
// console.log(z)






/* Semi composition */

class Ks2<V> {
	constructor(
		public v: V,
		public name: string,
		// private __proto__: null = null
	) {}
}



// class GetAge2<T> {
// 	getV(this: Ks2<T>) {
// 		return this.v
// 	}
// }

class Obj2<V> extends Ks2<V> {
	get getVV() {
		return this.v
	}
	set setV(x: V) {
		this.v = x
	}
}


// interface Obj2<V> extends Methods<V> {}

// let obj = new Obj2(42, "john")

// Object.assign(Object.getPrototypeOf(obj), Methods.prototype)
// console.log(Object.getOwnPropertyNames(obj.__proto__))

// console.log(Methods.prototype.propertyIsEnumerable("method1"))

// console.log(Object.getOwnPropertyNames(Methods.prototype))


// const x = obj.method1()
// console.log(x)



/* Notes
	* I want to mix two classes really, where the 3rd class has both Ks and Ms
*/



/* Interaces and abstract classes */

// abstract class A {
// 	abstract f1(): string
// 	f2() {
// 		return "dsad"
// 	}
// }

// interface A1 {
// 	greet(): number
// }

// interface A2 {
// 	greet2(): string
// }

// class B {
// 	f1() {
// 		return "dasd"
// 	}
// }

// class C extends A {
// 	f1() {
// 		return "43"
// 	}
// }

// function g(x: A) {
// 	return x.f2()
// }


// const b1 = new B()

// g(b1)
