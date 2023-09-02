import { Effect } from "effect"

const increment = (x: number) => x + 1

const divide = (a: number, b: number): Effect.Effect<never, Error, number> =>
  b === 0
    ? Effect.fail(new Error("Cannot divide by zero"))
    : Effect.succeed(a / b)

// $ExpectType Effect<never, Error, string>
const program = Effect.gen(function* (_) {
	// const eff_ = Effect.succeed("4")
	// console.log(Object.getOwnPropertyNames(eff_))
  const [a, b] = [10, 3]
	const xx = _(divide(a, b))
	// console.log(Object.getOwnPropertyNames(xx[Symbol.iterator]()))
	// console.log(xx[Symbol.iterator]().self.value)
  const n1 = yield* xx
  const n2 = increment(n1)
  return `Result is: ${n2}`
})


console.log(Effect.runSync(program)) // Output: "Result is: 6"
