import { start } from "ribu"

// start is important for testing, so modules are pure (one scheduler per system)
const { spawn } = start()

// me === self()
spawn(function* coord({me}) {

	// yield let ribu knows this is a child of coord
	// both are launched in parallel
	const locatePID = yield spawn(locateFilesPath, me)
	yield spawn(loadFiles, locatePID)

})



async function* locateFilesPath($coord) {
	const {testFiles: {folders, subString, extensions}} = sophiConfig

	let files = await Promise.all(folders.map(async folder => lookRecursive(folder)))
	files = files.flat().filter(hasCorrectNamesAndExtensions)
	return files

	async function lookRecursive(dirPath) {
		const files = await fs.readdir(dirPath, { withFileTypes: true })
		const fileNames = await Promise.all(files.map(async file => {
			const filePath = path.join(dirPath, file.name)
			if (file.isDirectory()) {
				return lookRecursive(filePath)
			} else {
				return filePath
			}
		}))
		return fileNames.flat()
	}

	function hasCorrectNamesAndExtensions(file) {
		const fileExt = path.extname(file).slice(1)
		if (!extensions.includes(fileExt)) {
			return false
		}
		for (const str of subString) {
			if (file.includes(str)) {
				return true
			}
		}
		return false
	}
}


