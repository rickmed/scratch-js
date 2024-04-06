import { readFile } from "fs";

readFile("./dsadasd.txt", "utf-8", (err, res) => {
	console.log("cause" in err)
})