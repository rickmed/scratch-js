class MyClass {

	prop1 = "hi "

	method1() {
		console.log(this.prop1 + "one")
	}

	method2() {
		console.log(this.prop1 + "one")
	}
}

const system = new MyClass()
export const method1 = system.method1.bind(system)
export const method2 = system.method2.bind(system)