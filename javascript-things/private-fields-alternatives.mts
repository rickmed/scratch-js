/* Original thing */
class Person {
	#name;
	constructor(name: string) {
		this.#name = name;
	}
	getName() {
		return this.#name;
	}
}

const person = new Person("person")
const personName = person.getName()
console.log(personName)


/** Classes with Symbols
 * This is good bc you can pass around the symbol within your module
 */
const _name = Symbol()
const _getName = Symbol()
export class Welder {
	[_name]: string
	constructor(name: string) {
		this[_name] = name;
	}
	[_getName]() {
		return this[_name];
	}
}

const welder = new Welder("welder")
const welderName = welder[_getName]()
console.log(welderName)

const arr: Welder[] = [new Welder("j")]



/* With WeakMaps. Around ~30% slower */
// this should be in module scope
let counter = 0;

const privKs = new WeakMap();

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
	privKs.set(obj, {age})
	return Object.setPrototypeOf(obj, proto)
}

const user = User("b", 2)
const userAge = user.showPrivate()
// console.log(userAge)



/** With Symbols (only way to get around is with Object.getOwnPropertySymbols)
 * 99% as fast as classes
 * But using an additional priv object occurs in too many internal v8 memory
 */
const priv_ = Symbol("private data")

const proto2 = {
	showPrivate() {
		return this[priv_].age
	},
	showPublic() {
		return this.name
	}
}

function Teacher(name, age) {
	const obj = {name, [priv_]: {age}}
	return Object.setPrototypeOf(obj, proto2)
}

const teacher = Teacher("c", 3)
console.log(teacher.showPrivate())
