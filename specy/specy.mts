import { z } from "specy"
import { t } from "my-i18n-lib"


/* **********  got/want values should be added to error automatically  ********** */



const checker = z
	.object({
		pw: z.string().min(2, {msg: v => t(`Need to be 2 chars but got ${v}`)}).email(),
		c_pw: z.string().min(1).email(),
		other: z.number(),
	})

	// runs if "core/native validations passes" even if other validators fail
	.refine(res => {  // :: {pw: parsedOKType, c_pw: parsedOKType}  always
		if (res.pw !== res.c_pw) {

			// return an object to associate error with some field
				// object must have all/some properties of schema
				// so that the path is type checked.

				return {
					c_pw: "Passwords don't match"
					// c_pw: SpecErr("Passwords don't match")
				}

			// return string if want to associate error to the parent.
				// return "Passwords don't match"
		}
		// return undefined if validation passes.
	})

	.catch( res => {
		// res ::
			// SpecErr<Array<Errors>>  eg, if type if different
			// {pw: string | Err<Array<Err>>, c_pw: string | Err<Array<Err>>}  if error in somekey

		return "WHATEVER TYPE"  // this changes the type of Spec
	})

	.mapOk(res => {
		// res :: always good {pw: parsedOKType, c_pw: parsedOKType}
		return "WHATEVER TYPE"  // this changes the type of Spec
	})

	.map( res => {

		// reasons s.object can fail:
			// is not an object (but a string, Map..)
			// required key is missing.
			// an extra key is present when object is .strict
			// and of course all keys custom validations

		// so res is not guaranteed to be some kind of object with errors
			// it can be plain SpecErr

	// res ::
		// SpecErr<Array<Errors>>  if type if different
		// {pw: string | Err<Array<Err>>, c_pw: string | Err<Array<Err>>}  if error in somekey

		const {pw, c_pw} = res
		const pwV = pw?.got || pw
		const c_pwV = pw?.got || pw

		if (pw !== c_pw) {
			const msg = "Passwords don't match"
			res.c_pw = c_pw.errors?.add(msg) || SpecErr(msg)
		}
		// object is already mutated no need to return.
	})


/**   SOLVED  ********************
 *
 */


/* **********   BAIL early  **********
Need to be in core bc can't use something like .appplicate() in a declarative
	object/array api (it's not a pipeline)
Needs to be the default bc of security

Implementation:
	maybe a .config({bail: false}) that returns the same Spec (but configs it)
		the inner Specs inherit the configs unless overwritten by them.
*/


/*******  PATH with custom validation  *******
- Zod's feels like a hack, also it’s not type checked
- DONE: see refine
*/


/* **********   ASYNC VALIDATION  **********
- Why not supported?
	- Bloat library.
	- Further departs from Typescript types.
	- Async validations in serial/parallel? dependand on one another...?

- Ok how to do it.

	const input = {}  // :: unknown

	let res = z.object({
		username: z.string()  // length, whatever...
		// ... other things
	}).safeParse(input)

	if (res instanceof Error) return "whatever"

	// validate res.username async...
	res = validateASync(username)

	if (res instanceof Error)  return SpecErr({username: res})
*/


/* **********   DEFAULT VALUES  **********
- In Zod, the below fails to apply the default value "HIII" (what I want is:
	"if value is a string && isEmail, return the value, else, return defaultVal)

const emailToDomain = z
	.string()
	.email()
	.default("HI")

const res = emailToDomain.safeParse("not an email")  // DOESN'T output "HI"

// in Specy
const emailSpecy = z
	.string()
	.email()
	.default("HIII")  // defaultVal needs to be the same type of prev Spec<T>

// implementation
const def = defVal => _ => {
	return defVal
}

.catch(def("DEFAUL_VAL"))


.catch( res => {
	// res ::
		// SpecErr<Array<Errors>>  eg, if type if different
		// {pw: string | Err<Array<Err>>, c_pw: string | Err<Array<Err>>}  if error in somekey

	return "WHATEVER TYPE"  // this changes the type of Spec
})
*/


/* **********  separate static/ts part with dynamic parts?  **********
- Keep door open for code generation of checker.
	- For keep static checking part only in ts and have fast runtime checking
*/



/* **********  Other Things Considered  **********

// refine with proxy

.refineProxyV(res => {
	// res is a proxy obj that on .get() returns the OGVal
	// and on writes (see below)

	if (res.pw !== res.c_pw) {
		// mutating c_pw means:
			// if newVal is ::SpecErr -> add Err to errArray
		res.c_pw = SpecErr("Passwords don't match")
	}
})

*/