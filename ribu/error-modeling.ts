class MyErr<Tag extends string = string> extends Error {
	tag: Tag
	constructor(tag: Tag) {
		super()
		this.tag = tag
	}
}

function child(x: number) {
	if (x % 3 === 0) {
		return "normal return"
	}
	if (x % 2 === 0) {
		return new MyErr("ENOENT")
	}
	return new MyErr("OTHER")
}

function main() {
	const res = child(1)
	if (err(res, "ENOENT")) {
		const x = res  // x should be MyErr("ENOENT"), OK
		return x
	}
	// if (err("OTHR", res)) {  // =>>> I want err() to complain since "hey" is not "ENOENT" or "OTHER"
	// return res
	// }
	const w = res  // w should be "normal return" | MyErr("OTHER")
	return w
	// if (err("ENOENT", res)) {
	// 	const x = res  // x should be MyErr("ENOENT"), OK
	// 	return x
	// }
	// if (err("OTHR", res)) {  // =>>> I want err() to complain since "hey" is not "ENOENT" or "OTHER"
	// return res
	// }
	// const w = res  // w should be "normal return" | MyErr("OTHER")
	// return w
}

function err<X, T extends Extract<X, MyErr>['tag']>(x: X, tag: T): x is Extract<X, MyErr<T>> {
	return x instanceof MyErr && x.tag === tag
}


// type ErrorTag =
// 	| "ENOENT"
// 	| "OTHER"

// class MyErr<Tag extends ErrorTag> extends Error {
// 	tag: Tag
// 	constructor(tag: Tag) {
// 		super()
// 		this.tag = tag
// 	}
// }

// function err<Tag extends ErrorTag>(tag: Tag, x: unknown): x is MyErr<Tag> {
// 	return x instanceof MyErr && x.tag === tag
// }