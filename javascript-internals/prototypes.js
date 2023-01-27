
/*
String is a function constructor so it has a .protototype
This ‘prototype’ property points to the object that will be
asigned as the prototype of instances created with that function
when using ‘new’ ("" in String's case)
*/

const proto = Object.getPrototypeOf

const StringConst_P = proto(String)
// String.protytype -> obj
// getPrototypeOf(String) -> NativeCode

const strInstance_P = proto("a")
// true
// console.log(getPrototypeOf("a") === String.prototype)

const strInstance_PP = proto(strInstance_P)
const StringConst_PP = proto(StringConst_P)
// true:
// console.log(strInstance_PP == StringConst_PP)

const PP = StringConst_PP
// console.log(Object.getOwnPropertyNames(PP))

// null
const root_P = proto(PP)
