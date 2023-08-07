// This is slightly faster than the class below
// no Object.prototype methods though
const proto = {
	greet(this: Obj): string {
		return this.name
	}
}

type Obj = {
	name: string
	age: number
}

let obj: Obj = {age: 42, name: "john"}
Object.setPrototypeOf(obj, proto)
const x = obj as Obj & typeof proto


function _done() {
	console.log("running")
	return "epale"
}

// add a getter
Object.defineProperty(obj, "_done", {
	get: _done
});

console.log(obj._done)




// class
class ObjClass {
	name: string
	age: number
	constructor(name: string, age: number) {
	  this.name = name
	  this.age = age
	}
	getName() {
	  return this.name
	}
	getAge() {
	  return this.age
	}
 }

 const objClass = new ObjClass("john", 42)
 objClass.getName()
 objClass.getAge()