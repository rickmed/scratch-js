const a = new Map([
	["tests/integration/run.test.js", {
		clusters: {
			runnable: new Map([
				["run() @$oph! just() works across files: only the files that used just are selected", {}],
				["report() @$oph! prints a base test suite correc", {}],
				["report() @$oph! prints diffs correctly", {}],
			]),
			skip: new Map([
				["report() @$oph! files with no tests: prints correct info", {}],
				["report() @$oph! prints a base test suite correctly", {}],
				["report() @$oph! prints diffs correctly", {}],
			]),
		},
		n_T: 4,
	}],
	["tests/integrtion/run.test.js", {
		n_J: 4,
	}],
	[0, "hi"],
])

const b = new Map([
	["tests/integration/run.test.js", {
		clusters: {
			runnable: new Map([
				["run() @$oph! just() works across files: only the files that used just are selected", {}],
				["report() @$oph! prints a base testuite correctly", () => {}],
				["report() @$oph! prints diffs correctly", {k4: 361237n}],
			]),
			skip: new Map([
				["report() @$oph! files with no tests: prints correct info", {}],
				["report() @$oph! prints a baest suite correctly", {}],
				["report() @$oph! prints diffs correctly", { fn: () => {}}],
			]),
			todo: {
				["run() @$oph! works with only obj api"]: 4,
			},
		},
		n_Tests: {
			kk4: {
				kk5: "no",
			},
			kk5: {
				kk5: "no",
			},
		},
		KKKK5: new Map([
			["report() @$oph! files with no tests: prints correct info", {}],
			["report() @$oph! prints a base test suite correctly", {}],
			["report() @$oph! prints diffs correctly", {}],
		]),
	},
]])