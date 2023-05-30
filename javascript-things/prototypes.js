/* In serious code use Object.getPrototypeOf instead of __proto__  */
const getProto = Object.getPrototypeOf

// ** String is a function constructor
// String.protytype -> obj
// String.__proto__ -> NativeCode
// NativeCode.__proto === String.prototype.__proto__

// "a".__proto__ === String.prototype
// [].__proto__ === Array.prototype

// true:
// "a".__proto__.__proto__ ===
// [].__proto__.__proto__ ===
// {}.__proto__ ===
// String.__proto__.__proto__ ===
// Object.__proto__.__proto__ ===
// Object.prototype ===
// String.prototype.__proto__ ===

const PP = Object.prototype
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


/*********************************/
// Object.__proto__ -> NativeCode
// [].__proto__ === Array.prototype
