import { z, ZodSchema } from "zod"

const Schema = z.object({
	name: z.literal("rick")
}).strict()

console.log(Schema.shape.name)

const res = Schema.safeParse({ name: "rick", oy: 1 })

// if (res.error) console.dir(res.error.issues);
if (res.error) console.dir(res.error.issues);


/* .error:: ZodError
[ 'stack', 'issues', 'addIssue()', 'addIssues()', 'name' ]

.name: "ZodError"

.issues::
[
  {
    code: "invalid_type",
    expected: "string",
    received: "number",
    path: ["names", 1],
    message: "Invalid input: expected string, received number",
  },
  {
    code: "unrecognized_keys",
    keys: ["extra"],
    path: ["address"],
    message: "Unrecognized key(s) in object: 'extra'",
  },
  {
    code: "too_small",
    minimum: 10000,
    type: "number",
    inclusive: true,
    path: ["address", "zipCode"],
    message: "Value should be greater than or equal to 10000",
  },
];




*/

// error


// if (res.error) console.dir(res.error);


// mySchema.safeParse("tuna"); // => { success: true; data: "tuna" }
// mySchema.safeParse(12); // => { success: false; error: ZodError }

/*
EXAMPLE 1:

const person = z.object({
	names: z.array(z.string()).nonempty(), // at least 1 name
	address: z.object({
		line1: z.string(),
		zipCode: z.number().min(10000), // American 5-digit code
	}),
});

const data = schema.safeParse({
	names: ["Dave", 12], // 12 is not a string
	address: {
		line1: "123 Maple Ave",
		zipCode: 123, // zip code isn't 5 digits
		extra: "other stuff", // unrecognized key
	},
})

{
	code: "invalid_type",
	expected: "string",
	received: "number",
	path: ["names", 1],
	message: "Invalid input: expected string, received number",
},
{
	code: "unrecognized_keys",
	keys: ["extra"],
	path: ["address"],
	message: "Unrecognized key(s) in object: 'extra'",
},
{
	code: "too_small",
	minimum: 10000,
	type: "number",
	inclusive: true,
	path: ["address", "zipCode"],
	message: "Value should be greater than or equal to 10000",
},


EXAMPLE 2:
{
	success: false,
	error: {
		name: "ZodError",
		stack: string (issue + stack),
		issues: [
			{
				code: 'invalid_literal',
				expected: 'tuna',
				path: [],
				message: 'Invalid literal value, expected "tuna"'
			},
		]
	}
]

ON SUCCESS:
{
	success: true,
	data: <parsed data>
}

*/




// console.log(tuna.error.issues);
// console.log(tuna.error.errors);
