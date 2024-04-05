async function hi() {
	throw "dasd"
}

hi().then(x => x, x => console.log(x))