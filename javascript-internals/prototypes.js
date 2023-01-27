/* In serious code use Object.getPrototypeOf instead of __proto__  */
const getProto = Object.getPrototypeOf

// ** String is a function constructor
// String.protytype -> obj
// String.__proto__ -> NativeCode
// NativeCode.__proto === String.prototype.__proto__

// console.log("a".__proto__ === String.prototype)

// true:
// "a".__proto__.__proto__ ===
// String.prototype.__proto__ ===
// String.__proto__.__proto__

const PP = String.prototype.__proto__
// const PP = String.__proto__.__proto__
// console.log(Object.getOwnPropertyNames(PP))
/*
PP has:
	[
	'constructor',
	'__defineGetter__',
	'__defineSetter__',
	'hasOwnProperty',
	'__lookupGetter__',
	'__lookupSetter__',
	'isPrototypeOf',
	'propertyIsEnumerable',
	'toString',
	'valueOf',
	'__proto__',  ---------------->  null (root prototype)
	'toLocaleString'
	]
*/

// can't do:
// Object.setPrototypeOf(PP, {})
// bc PP.__proto__ is immutable
