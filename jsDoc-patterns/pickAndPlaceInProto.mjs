/**
 * @template {keyof TObj} TObjKs
 * @template {{[K in TObjKs]: Function}} TObj
 * @param {TObj} obj
 * @param {Array<TObjKs>} methodNames
 * @returns {Pick<TObj, TObjKs>}
 */
function copyMethodsProto(obj, methodNames) {

	const newObjProto = /** @type {Pick<TObj, TObjKs>} */ (/** @type {unknown} */ ({}))

	for (const K of methodNames) {
		if (typeof obj[K] === "function") {
			newObjProto[K] = obj[K].bind(obj)
		}
	}

	return Object.create(newObjProto)
}


/*

type OmitFunctions<T, Exclude extends keyof T = never> = {
    [P in keyof T as T[P] extends Function ? P extends Exclude ? P: never : P]: T[P]
}

*/