async def child1():
    print("  child1: started! sleeping now...")
    await trio.sleep(1)
    print("  child1: exiting!")


async def child2():
    print("  child2: started! sleeping now...")
    await trio.sleep(1)
    print("  child2: exiting!")

async def parent():
    print("parent: started!")
    async with trio.open_nursery() as nursery:
        print("parent: spawning child1...")
        nursery.start_soon(child1)

        print("parent: spawning child2...")
        nursery.start_soon(child2)

        print("parent: waiting for children to finish...")
        # -- we exit the nursery block here --
    print("parent: all done!")


# function* child1() {
# 	console.log("  child1: started! sleeping now...")
# 	yield sleep(1)
# 	console.log("  child1: exiting!")
# }

# function* child2() {
# 	console.log("  child2: started! sleeping now...")
# 	yield sleep(1)
# 	console.log("  child2: exiting!")
# }

# function* main() {
# 	console.log("parent: started!")

# 	const child1 = go(child1)
# 	const child2 = go(child2)

# 	yield waitErr(child1, child2)
# 	console.log("parent: all done!")
# }