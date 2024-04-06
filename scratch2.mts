import * as s from 'superstruct'

// /* **********  Map Support  ********** */
// const User = s.object({
// 	first: s.string(),
// 	age: s.number(),
// })

// const UserMap = s.map(User, s.boolean())

// const user = new Map([
// 	[{ id: 321, name: 4 }, false]
// ])


// const [e, res] = UserMap.validate(user)


const litParser = s.object({
	a: s.literal("a")
})

const [e, res] = litParser.validate([1, "3"])


if (e) {
	// console.log(e)
	// console.log("\n")
	console.dir(e.failures())
	// console.dir(e.failures(), {depth: 50, compact: false, showHidden: true})
}

