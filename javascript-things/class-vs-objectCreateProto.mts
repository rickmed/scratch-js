function greet(this: Obj1): string {
	return this.name
}

type Obj1 = {
	name: string
	age: number
}
const Proto1 = {
	greet,
	get getAge() {    let this_ = this as Obj1   // this is slightly annoying, but getters/setters are probably the exception
		return this_.age
	},
	set setName(x: string) {
		this.name = x
	}
}

let obj1: Obj1 = {age: 42, name: "john"}
const x1 = Object.setPrototypeOf(obj1, Proto1) as Obj1 & typeof Proto1


/* Semi composition */

class Obj2 {
	constructor(
		public name: string,
		public age: number,
		private __proto__: null = null
	) {}
}
const methods = {
	greet
}
class Proto2 extends Obj2 {
	get getAge() {
		return this.age
	}
	set setName(x: string) {
		this.name = x
	}
}

let obj = new Obj2("john", 42)
const x2 = Object.setPrototypeOf(obj1, Object.assign(Proto2.prototype, methods)) as Proto2 & typeof methods
console.log(x2.greet())