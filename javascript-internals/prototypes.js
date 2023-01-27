
/*
String is a function constructor so it has a .protototype
This ‘prototype’ property points to the object that will be
asigned as the prototype of instances created with that function
when using ‘new’ ("" in String's case)
*/

const StringConst_P = Object.getPrototypeOf(String)
// String.protytype -> obj
// getPrototypeOf(String) !== obj
// getPrototypeOf(String) -> NativeCode
// getPrototypeOf(strInstance) -> String.prototype -> obj


// getPrototypeOf( String.prototype || getPrototypeOf("a") ) ->

const strInstance_P = Object.getPrototypeOf("a")
// console.log(strInstance_P === String.prototype)

const strInstance_PP = Object.getPrototypeOf(strInstance_P)
const StringConst_PP = Object.getPrototypeOf(StringConst_P)
// true:
// console.log(strInstance_PP == StringConst_PP)

const PP = StringConst_PP
// console.log(Object.getOwnPropertyNames(PP))

// null
const root_P = Object.getPrototypeOf(PP)
console.log(root_P)
