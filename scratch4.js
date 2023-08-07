let objS = []
for (var i = 0; i < 1000; i++) {
    objS.push({
		name: "rick",
		get n() {
			return this.name
		}
	 });
}