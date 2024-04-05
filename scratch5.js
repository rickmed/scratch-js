import { readFile } from "fs";

readFile("./dumm.txt", "utf-8", (err, res) => {
	console.log(err)
})