import fg from "fast-glob"

const entries = await fg(
	['zod/**'],
	{
	dot: true,
	cwd: "/home/rick/Projects/scratch-js/"
	}
);

console.log(process.cwd())
console.log(entries)