export function printDiff(rec, exp) {

	let diff = deepDiff(rec, exp)
	diff = flatten(diff)
	const table = toTable(diff)

	// console.dir({diff}, {depth: 50, compact: false, sorted: true, numericSeparator: true})

	console.log(table.toString())

	function flatten(diff) {
		let table = []
		let currPath = []

		_build(diff)

		function _build(diff) {

			if (Array.isArray(diff)) {

				const rec = diff[0]
				const exp = diff[1]

				table.push({
					path: currPath.slice(),
					rec: rec,
					exp: exp,
				})

				return
			}

			const { ctor, diffs } = diff

			const sortedKs = [...diffs.keys()]
				.sort((a, b) => {
					if (a.constructor === Symbol || b.constructor === Symbol) {
						return 0
					}
				})

			for (const k of sortedKs) {
				currPath.push({ k, ctor })
				_build(diffs.get(k))
				currPath.pop()
			}
		}

		return table
	}
	function toTable(diff) {

		let paths = []
		let receives = []
		let expecteds = []

		diff.forEach(({path, rec, exp}, i) => {
			paths[i] = toPathCell(path)
			receives[i] = toValCell(rec)
			expecteds[i] = toValCell(exp)
		})

		let table = new Table({
			colWidths: Array(paths.length).fill(10),
			// chars: {
			// 	"top": " ", "top-mid": "", "top-left": "", "top-right": ""
			// 	, "bottom": " ", "bottom-mid": "", "bottom-left": "", "bottom-right": ""
			// 	, "left": "", "left-mid": "", "mid": " ", "mid-mid": ""
			// 	, "right": "", "right-mid": "", "middle": ""
			// },
		})

		table.push(paths, receives, expecteds)

		return table
	}
	function toPathCell(path) {
		return {content: formatPath(path, "\n"), truncate: "…".yellow}
	}
	function toValCell(val) {
		let cell = {
			content: val === empty ? "" : format(val),
			wordWrap: !isPojo(val),
			wrapOnWordBoundary: false,
		}

		return cell
	}
	function format(val) {

		let str = val

		if (val.constructor === Function) {
			str = `${val.name}()`
		}
		else if (val.constructor === Object) {
			const opts = {
				compact: false,
				depth: 2,
				colors: false,
				sorted: true
			}
			let objStr = util.inspect(val, opts)
			str = objStr
		}
		else {
			const opts = {
				depth: 3,
				compact: true,
				colors: false,
				sorted: true
			}
			str = util.inspect(val, opts)
		}

		return str
	}
	function isPojo(x) {
		return x.constructor === Object
	}
	function formatPath(_path, separator) {
		let path = []

		for (let { k, ctor } of _path) {
			if (k.constructor === Symbol) {
				k = k.toString()
			}
			if (!(ctor === Object || ctor === Array)) {
				k = `${ctor.name}(${k})`
			}
			if (ctor === Object) {
				k = `'${k}'`
			}

			path.push(k)
		}

		return path.join(separator).yellow
	}
	function formatVal(x) {

	}
}
