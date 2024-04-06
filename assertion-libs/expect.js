import { expect } from "expect";

try {

	// const houseForSale = {
	// 	bath: true,
	// 	bedrooms: 4,
	// 	kitchen: {
	// 	  amenities: ['oven', 'stove', 'washer'],
	// 	  area: 20,
	// 	  wallColor: 'white',
	// 	},
	//  };
	//
	//  const desiredHouse = {
	// 	bath: true,
	// 	kitchen: {
	// 	  amenities: ['ovn', 'stove', 'washer'],
	// 	  wallColor: expect.stringMatching(/white|yellow/),
	// 	},
	//  };

	// // Accepts Maps
	//  const houseForSale = {
	// 	bath: new Map([["hi", 54]]),
	// 	bedrooms: 4,
	// 	kitchen: {
	// 	  amenities: ['oven', 'stove', 'washer'],
	// 	  area: 20,
	// 	  wallColor: 'white',
	// 	},
	//  };

	//  const desiredHouse = {
	// 	bath: new Map([["h", 		{
	// 		amenities: ['oven', 'stove', 'washer'],
	// 		wallColor: expect.stringMatching(/white|yellow/),
	// 	 },]]),
	// 	kitchen: {
	// 	  amenities: ['oven', 'stove', 'washer'],
	// 	  wallColor: expect.stringMatching(/white|yellow/),
	// 	},
	//  };

	// Accepts Maps
	const houseForSale = {
		bedrooms: 4,
		kitchen: function whey() { return 69},
	};

	const desiredHouse = {
		// bath: new Map([["h", {
		// 	amenities: ['ovn', 'stoe', 'washr'],
		// 	wallColor: expect.stringMatching(/white|yellow/),
		// },]]),
		kitchen: {
			// area: "ds",
			amenities: ['oven', 'stove', 'washer'],
			wallColor: expect.stringMatching(/white|yellow/),
		},
	};


console.log("HIII")
	expect(houseForSale).toMatchObject(desiredHouse);

}
catch (e) {
	// console.dir(e)
	// [ 'stack', 'message', 'matcherResult' ]

	console.log(e)
	// [ 'actual', 'expected', 'message', 'name', 'pass' ]
	// name is operatorName
	// pass: true | false
	// console.log("\n")
	// console.log(e.matcherResult.message)
	// console.log("\n")
	// console.log(e.stack)
	// console.log("\n")

	// console.log(e)
}
