import {readdir} from "node:fs/promises"

async function rd(x: string) {
	try {
		return await readdir(x, {withFileTypes: true})
	}
	catch (e) {
		return e as Error
	}
}

class MyErr extends Error {}

async function div(x: string) {
	return x === "" ? new MyErr("yooo") : "epale"
}


async function main() {
	const num = await div("si")
	if (num instanceof Error) {
		return num
	}
	const res = await rd(num)
	return res
}
