let objS = []
for (var i = 0; i < 1000; i++) {
	const gen = (function* gen(){})()
    objS.push(gen);
}