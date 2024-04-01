import { type Job } from "./Job.mjs"

class System {
	deadline = 5000
	stack: Array<Job> = []

	get running(): Job | undefined {
		return this.stack.at(-1)
	}
}

export const sys = new System()

export function runningJob() {
	return sys.running!
}