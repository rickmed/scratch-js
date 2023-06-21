describe.skip("hooks", () => {

	it("beforeAll", () => {

		suite.reset()
		let a = 0

		function beforeAllHook() {
			a += 2
		}

		group("a", () => {
			group("a1", () => {
				beforeAll(beforeAllHook)
				test("test 1", () => {
					a *= 2
				})
			})
		})

		// _check_Eq_(a, 4)

		const _suite = suite.pullSuite()
		check(_suite.hooks.get(`a${SEP}a1`)).with({beforeAll: [beforeAllHook]})
	})

	it("beforeEach", () => {

		suite.reset()
		let a = 0

		group("a", () => {
			beforeEach(() => {
				a += 2
			})
			test("test 1", () => {
				a *= 2
			})
			test("test 2", () => {
				a *= 2
			})
		})

		_check_Eq_(a, 12)
	})

	it("afterEach", () => {

		suite.reset()
		let a = 0

		group("a", () => {

			test("test 1", () => {
				a *= 2
			})
			test("test 2", () => {
				a *= 2
			})
			afterEach(() => {
				a += 2
			})
		})

		_check_Eq_(a, 6)
	})

	it("afterAll", () => {

		suite.reset()
		let a = 0

		group("a", () => {
			test("test 1", () => {
				a *= 2
			})
			afterAll(() => {
				a += 2
			})
		})

		_check_Eq_(a, 2)
	})


})