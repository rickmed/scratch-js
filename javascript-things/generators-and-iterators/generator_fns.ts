/**
 * Simplified Demonstration of Delegating Iterators in JavaScript
 *
 * The yield* expression allows one generator to delegate to another generator,
 * passing along its yielded values before continuing with its own.
 */

// First generator function that produces some values
function* child() {
   yield 1;
   return "child done"
}

// Second generator that delegates to the first one using yield*
function* main() {

   const childRet = yield* child()
   console.log('continued', childRet)
}

// Create an instance of the delegating generator
const gen = main();

// Manually iterate through the generator using next()
console.log('starting main')
console.log(gen.next())
console.log("resuming main")
console.log(gen.next())