const RibuE = Symbol("RibuExc")
export const UNKNOWN = "Unknown"

type EBase<Tag extends string = string> = {
	readonly [RibuE]: true
	readonly tag: Tag
}

export type E<Tag extends string = string> = EBase<Tag> & {
	readonly cause: Error
}

export type ExcProcessCancelled = EBase<"ProcessCancelled">

export function E<Tag extends string>(tag: Tag, cause: Error): E<Tag> {
	return { tag, cause, [RibuE]: true as const}
}

export function EUnknown<Tag extends string>(tag: Tag, cause: Error): E<Tag> {
	return { tag, cause, [RibuE]: true as const}
}

export function EPrcCancelled(): ExcProcessCancelled {
	return { tag: "ProcessCancelled", [RibuE]: true }
}


export function e(x: unknown): x is EBase {
	return isRibuE(x)
}

export function notTag<X, T extends Extract<X, E>["tag"]>(x: X, tag: T): x is Extract<X, E> & Exclude<X, E<T>> {
	return isRibuE(x) && x.tag !== tag
}

function isRibuE(x: unknown): x is E {
	return typeof x === "object" && x !== null && RibuE in x && "tag" in x
}




/* Usage Example */

function readFile(x: string) {
	if (x === "one") {
		return E("NotFound", Error())
	}
	if (x === "two") {
		return E("PERM_ERR", Error())
	}
	if (x === "3") {
		return E("Unknown", Error())
	}
	return "file2" as string
}

function recoverOp(x: string) {
	if (x === "one") {
		return E("SOME_ERR", Error())
	}
	return "file" as string
}

function uploadFile(x: string) {
	if (x === "one") {
		return E("TIMEOUT", Error())
	}
	if (x === "two") {
		return E("NOPE", Error())
	}
	return true as boolean
}


function readFileWithErrHandling(filePath: string) {
	let res = readFile(filePath)  // .unwrap?
		.if("NotFound", recoverOp, filePath)

	if (e(res)) return res




	if (e(res)) {
		res = res.on("NotFound", recoverOp, filePath)
		if (e(res)) return res
	}


	// if (notTag(res, "NotFound")) return res; if (e(res)) {
	// 	const res2 = recoverOp(filePath)
		// if (e(res2)) return res2
	// 	res = res2
	// }

	return res
}
