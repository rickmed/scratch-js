import { sleep } from "./ribu/cancellableResource.mjs"

async def child2():
    print("  child1: started! sleeping now...")
    await trio.sleep(1)
    print("  child1: exiting!")


async def parent():
    print("parent: started!")
    async with trio.open_nursery() as nursery:
        print("parent: spawning child1...")
        nursery.start_soon(child)
        print("parent: spawning child2...")
        nursery.start_soon(child)

        print("parent: waiting for children to finish...")
        # -- we exit the nursery block here --
    print("parent: all done!")



/* ************************************************* */

function* child() {
	console.log("child started")
	yield sleep(1)
	console.log("child exiting")
}

go(function* parent() {
	console.log("parent: started")
	console.log("parent: spawning child1")
	go(child)
	console.log("parent: spawning child2")
	go(child)
	console.log("parent: waiting for children to finish...")
	const res = yield waitAll
	console.log("parent: all done")
})