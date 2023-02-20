describe("throws if duplicate test titles", () => {

	it.skip("cb api", async () => {

		const path = absPathFromRel(import.meta.url, "./fixture.mixed.cb_obj_throwDuplicate.js")

		try {
			await setup([path])
		}
		catch (e) {
			const msg = `Duplicate test name "a" ▶ "test" in same file: ` + relPathFromProjectRoot(path)
			expect(e.message).toBe(msg)
		}
	})

	it("mixed cb and obj apis", async () => {

		const path = absPathFromRel(import.meta.url, "./fixture.mixed.cb_obj_throwDuplicate.js")

		try {
			await setup([path])
		}
		catch (e) {
			const msg = `Duplicate test name "a" ▶ "test" in same file: ` + relPathFromProjectRoot(path)
			expect(e.message).toBe(msg)
		}
	})
})