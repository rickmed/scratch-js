



const exp = {
	type: "Path",
	pathType: "Object",
	v: new Map([

		["a", { type: "NoIssue", v: "sameValue for exp and rec" }],
		["a1", { type: "NoIssue", v: { hi: 12 } }],   // idem

		["p1", { type: "Eq", v: [fn_p1, empty] }],    // [0] exp, [1] rec
		["p2", { type: "Eq", v: [empty, fn_p2] }],
		["p3", { type: "Eq", v: ["p3", 3] }],


		// const to_be_in_range = ({floor, ceiling}) => (rec) => {
		// 	return [rec >= floor && rec <= ceiling, `Expected ${rec} to be between ${floor} and ${ceil}`]
		// }
		["aNumber", {
			type: "UserPredicate",
			rec: "",   // the value it received which didn't pass the predicate
			arguments: {
				floor: 5,
				ceiling: 12,
			},
			usrMsg: false,  // print is different for each case
			msg: ""   // filled from usrMsg or fn.name
		}]
		//prints
		// (if not provided usrMsg)
		// 	Expected to pass to_be_in_range with arguments
		// 		floor: 5     with green mark
		// 		ceiling: 10
		// 	received: 13     with red mark
		// (if provided usrMsg)
		// 	Expected 13 to be between 5 and 10

		// exp.stack: z(x => x.includes("Error"))
		["stack", {
			type: "UserPredicate",
			rec: "",   // the value it received which didn't pass the predicate
			arguments: {},
			usrMsg: true,  // print is different for each case
			msg: ""   // filled from usrMsg or fn.name
		}]

		["k1FV", {
			type: "UnrecognizedKey",
			rec: "",   // the value of the Key (so user can see in report where screw up)
			msg: MSG.UNRECOGNIZED_KEY
		}]
		// prints
		// Unexpected Key
		// theKey: keyValue     with red mark



		["p4", [4, { pp4: "pp4" }]],
		[p5, [p5, empty]],
		[p6, [1, "a"]],
		[p8, [empty, 0]],
		["p7", {
			type: "Path",
			pathType: "Object",
			v: new Map([
				["pp7", {
					type: "Path",
					pathType: "Array",
					v: new Map([
						[1, [2, empty]],
					]),
				}],
				["set1", [new Set([2]), new Set([3])]],
			]),
		}],
	]),
}