map(
	path => fs.promises.readFile(path).then(contents => ({ path, contents})
)
