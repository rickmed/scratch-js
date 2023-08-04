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

let obj: Obj & typeof proto = Object.create(proto)
obj.age = 42
obj.name = "john"



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