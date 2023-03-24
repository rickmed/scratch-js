async function hi() {
	return new Promise(res => setTimeout(() => res("hello"), 100))
}

const epa = hi()
console.log(epa)
console.log("yooo")