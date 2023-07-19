// @ts-nocheck

const $locateFiles = Go(locateFiles, sophiConfig)


function* locateFiles(this: GenThis<{filePathS: Ch<string>}>, sophiConfig: SophiConfig) {

	const { include: { folders, subStrings, extensions } } = sophiConfig
	const {filePathS} = this

	for (const dir of sophiConfig.folders) {
		go(readDir(dir))
	}

	function* readDir(dirPath) {
		const entries = yield readdir(dirPath, { withFileTypes: true })
		for (const entry of entries) {
			if (entry.isFile() && hasCorrectNamesAndExtensions(entry)) {
				yield filePathS.put(entry.path)
			}
			if (entry.isDirectory()) {
				go(readDir(entry.path))
			}
		}
	}

	this.onCancel = function* () {
		yield filePathS.put(DONE)
	}
}




function* locateFiles(sophiConfig) {
	const { include: { folders, subStrings, extensions } } = sophiConfig
	this.filePathS = ch<string>(30)

	for (const dir of sophiConfig.folders) {
		go(readDir(dir))
	}

	function* readDir(dirPath) {
		const entries = yield readdir(dirPath, { withFileTypes: true })
		for (const entry of entries) {
			if (entry.isFile() && hasCorrectNamesAndExtensions(entry)) {
				yield filePathS.put(entry.path)
			}
			if (entry.isDirectory()) {
				go(readDir(entry.path))
			}
		}
	}

	this.filePathS = filePathS

	this.onCancel = function* () {
		yield filePathS.put(DONE)
	}
}




// still have to type _this_ bc it's not inline
function* genfn2(this: GenThis<{port: Ch, portStr: Ch<string>}>, str: string, num: number) {

	this.onCancel = function* () { }

	const { port, portStr } = this

	yield port.put()
	yield portStr.put(str + num.toString())
}

Go({port: ch(), portStr: ch<string>()}, genfn2, "c", 43).port








// still have to type _this_ bc it's not inline
function* genfn2(this: GenThis<{port: Ch, portStr: Ch<string>}>, str: string, num: number, port, portStr) {

	this.onCancel = function* () { }

	const { port, portStr } = this

	yield port.put()
	yield portStr.put(str + num.toString())
}

go(genfn2, "c", 43, ch(), ch<string>()).port



// still have to type _this_ bc it's not inline
function* genfn2(this: GenThis<{port: Ch, portStr: Ch<string>}>, str: string, num: number) {


	this.onCancel = function* () {}

	// const port = ch()
	// const portStr = ch<string>()

	this.ports({port: ch(), portStr: ch<string>()})
	const { port, portStr } = this


	yield port.put()
	yield portStr.put(str + num.toString())
}

go(genfn2, "c", 43).port



function locateFiles(sophiConfig) {

	const { include: { folders, subStrings, extensions } } = sophiConfig
	const filePathS = ch<string>(30)

	return go(function* locateFiles() {

		for (const dir of sophiConfig.folders) {
			go(readDir(dir))
		}

		function* readDir(dirPath) {
			const entries = yield readdir(dirPath, { withFileTypes: true })
			for (const entry of entries) {
				if (entry.isFile() && hasCorrectNamesAndExtensions(entry)) {
					yield filePathS.put(entry.path)
				}
				if (entry.isDirectory()) {
					go(readDir(entry.path))
				}
			}
		}

		onCancel(function* () {
			yield filePathS.put(DONE)
		})

	}).ports({filePathS})
}