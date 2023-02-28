

// check accepts a validation (predicate) function
// 1)

check("Logs should include error", x => x.includes("Error"), rec)

// check will call the function with the all the args on the right
// and pretty print the arguments vs the result of calling the fn with
// them (optional first parameter is userMsg)


// 2)
rec = 13
const toBeInRange = ({floor, ceiling}) => (rec) => {
	return rec >= floor && rec <= ceiling
}
check(toBeInRange, {floor: 5, ceiling: 10}, rec)

// 3) you can return a more custom message to be printed
const to_be_in_range = ({floor, ceiling}) => (rec) => {
	return [rec >= floor && rec <= ceiling, `Expected ${rec} to be between ${floor} and ${ceil}`]
}
check(to_be_in_range({floor: 5, ceiling: 10}), rec)
// if no custom message is provided and validation function is
// not anonymous, reporter can use fn.name in message








/* More Complex Use case */

function _assertCheckErr(recVal, expVal, opID, opMsg, usrMsg) {

	let spec = {
		code: "ERR_ASSERTION_SOPHI",
		op: opID,
		message: usrMsg || opMsg,
		userMsg: usrMsg ? true : false,
		received: recVal,
		expected: expVal,
		stack: z(`Expected to include "Error"`, x => x.includes("Error")),  // z accepts any validator like toBeWithinRange_api1
		range: z(to_be_in_range, {floor: 5, ceiling: 112}),
	}

	if (usrMsg) spec.opt = usrMsg

	return spec
	// return z.partial(spec)   // received can have extra properties (akin to expect.toMatchObject)
}

const received = {
	code: "ERR_ASSERTION_SOPHI",
	op: "NOT Deep Equal",
	message: "Expected NOT to be Deeply Equal",
	userMsg: false,
	received: {},
	expected: {},
	stack: "some string"
}

const spec = _assertCheckErr(recVal, expVal, opID, opMsg, usrMsg)
check_Spec("some msg", spec, received)
// no need to wrap spec in z, since check_Spec is specialized


/*
base error: {
	code: ERR_SOPHI_CHECK,
	stack:: string,
	issues: {} // a tree of issues
}

*/
