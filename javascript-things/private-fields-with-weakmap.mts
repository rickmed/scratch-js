
// this should be in module scope
const privKs = new WeakMap();
let counter = 0;
const proto = {
	showPrivate() {
		return privKs.get(this).age
	},
	showPublic() {
		return this.name
	}
}
function User(name: string, age: number) {
	const obj = {name, age}
	return Object.setPrototypeOf(obj, proto)
}



class Thing {
	static #counter = 0;
	#age;
	name: string
	constructor(name: string, age: number) {
		this.name = name;
		this.#age = age;
	}
	showPublic() {
		return this.name;
	}
	showPrivate() {
		return this.#age;
	}
}