class RibuErr<Tag extends string = string> extends Error {
	constructor(readonly tag: Tag) {
		super()
	}
}

function Err<T extends string>(tag: T): RibuErr<T> {
	return new RibuErr(tag)
}

function fn(x: number) {
	if (x % 3 === 0) {
		return "normal return"
	}
	if (x % 2 === 0) {
		return Err("ENOENT")
	}
	return Err("OTHER")
}

function main() {
	const res = fn(1)
	if (err(res)) {
		if (res.tag === "ENOENT") {
			return res
		}
		return res
	}
	const x = res
}

function err(x: unknown): x is Error
function err<X, T extends Extract<X, RibuErr>['tag']>(x: X, tag?: T): x is Extract<X, RibuErr<T>>
function err<X, T extends Extract<X, RibuErr>['tag']>(x: X, tag?: T): x is Extract<X, RibuErr<T>> {
	if (tag === undefined) {
		return x instanceof Error
	}
	return x instanceof RibuErr && x.tag === tag
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