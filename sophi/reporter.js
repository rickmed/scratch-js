function pathFromRootDir(relPath, rootPath) {

	const rootDir = rootPath.split(path.sep).pop()
	const __dirname = path.dirname(fileURLToPath(import.meta.url))

	let foundRootDir = false
	let pathToCurrModule = []
	for (const dir of __dirname.split(path.sep)) {
		if (foundRootDir) {
			pathToCurrModule.push(dir)
			continue
		}
		if (dir === rootDir) foundRootDir = true
	}

	return path.join(...pathToCurrModule, relPath)
}