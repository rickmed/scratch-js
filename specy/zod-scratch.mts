import { z } from "zod";


// // /* **********  Literals  ********** */
// // this is interpreted as [4, 4, 4...] so the 2nd arg is ignored
// const arrParser = z.array(z.literal(4), z.literal(5))
// arrParser.safeParse(4)

// // idem set: interpreset as Set<4, 4, 4...>
// const setParser = z.set(z.literal(4), z.literal(5))

// // can't pass non primitives to z.literal
// z.literal([]); z.literal({}); z.literal(new Set())

// //
// const litParser = z.object({
// 	a: z.literal("a")
// })

// const res = litParser.safeParse({})

// if (res.success) {
// 	console.log(res.data)
// }


// const emailToDomain = z
//   .string()
//   .email()
//   .transform((val) => {
// 		console.log("TRANSFORM")
// 		return val.split("@")[1]
// 	});

// const res = emailToDomain
// 	// transform doesn't run if parser errored
// 	.safeParse("colinhacksexample.com"); // => example.com


/* Refine */

// const validationSchema = z.object({
// 	firsty: z
// 		.object({
// 			password: z.string().min(4),
// 			confirm_pw: z.string(),
// 		})
// // refine runs if input passes native validation, ie,
// 	// is object with correct keys of strings.
// 		.refine(data => {
// 			console.log("RANNN \n =========== \n")
// 			return data.password === data.confirm_pw
// 		},
// 		{
// 			message: "Passwords don't match",
// 		}
// 	)
// })

// const res = validationSchema.safeParse({
// 	firsty: {
// 		password: "hel",
// 		confirm_pw: "hello",
// 	}
// })


// /* **********  refine and transform  ********** */

// const nameToGreeting = z
//   .string().endsWith("o")
//   .transform((val) => {
// 		console.log("TTT 1:", val)
// 		return val.toUpperCase()
// 	})
// 	.refine((val) => {
// 		console.log("REF 1:", val)
// 		return val.length > 3
// 	})
// 	.transform((val) => {
// 		 console.log("TTT 2: ", val)
// 		 return `Hello ${val}`
// 	 })
//   .refine((val) => val.indexOf("!") === -1);

// const res = nameToGreeting.safeParse("hiii")


const checker = z
	.object({
		pw: z.string().min(1),
		c_pw: z.string().min(1),
		other: z.number(),
	})

const res = checker.safeParse({
	pw: 4,
	c_pw: 5,
	other: 55,
	m: 55,
})

if (res.success) {
	console.log("GOOD: ")
	console.log(res.data)
}
else {
	console.log(res.error.issues)
	console.log()
	console.log()
	const errs = res.error.format()
	console.dir(errs, {depth: 50, compact: false, showHidden: true})
	console.log()
	console.log()
}

// /* **********  Errors Data Structure  ********** */
// const Form = z.object({
// 	un: z.string().min(10).max(1),
// 	pw: z.string().min(4)
// })

// const res = Form.safeParse({
// 	un: "rsd",
// 	pw: "432"
// })

// if (res.success) {
// 	console.log("OKKK")
// 	console.log(res.data)
// }
// else {
// 	console.log(res.error.format())
// }
