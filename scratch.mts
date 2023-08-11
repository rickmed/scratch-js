const proto = {
	get greet(): string {
		return this.name
	}
}

let obj = {age: 42, name: "john"}

const newObj = Object.create(proto, obj)

console.log(newObj)