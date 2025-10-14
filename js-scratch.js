import { sleep } from "effect/Clock";

async function* child(x) {
   await sleep(x)
}


async function* hi() {
   await sleep(30)
   const rec = await go(child, 64)
   // let's say the above fails,
   // on ribu, target just notifies observer and observer
   // sees target failed so it decides if do me.genObj.next() or don't

   // promises already have internally subscribers.
   // promise based susbscribers would I think mean reject the promise
   // and go try/catch which is super slow.

   // let's say a job is awaited +1 locations.
   // if job fails, ribu would still need awaiters LL.
      // this means +RAM usage (promise + )
}


const job = go(hi)
job.cancel()




// Maybe sleep sets up state in hi.state = timeout
// I'm thinking of tracking .runningJob with promises
   // on resume, someone calls resumeJob()
   // here is the timeout cb.
   // so it could be done.


// Yeap seems resolving back call stack of promises is slow.
// 


// Promises maybe problems:
// 1) Resolving back call stack of promises is slower than
   // resuming yield genFns.
// 2) What I meant vs. promises is not wrapping the in go(), but what if I do?
// 3)

// JS Problems:
   //

// What .cancel means:
   // unsubscribe from blocking resource (timeout, channel, job...)
   // calls ._cancel() on active children
   // exec onEnds()
