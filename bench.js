/*


allOrErr:
  SUCC:
    values[]
  ERR: if a job fails, rest are cancelled.
    Err<"JobHadErr"> | EmptyArguments, etc...
    (can find the failed job with ogJobs.find(j => j.isErr))


implementation is okCb and Errcb is same function
first
  SUCC: (cancel the rest)
    OkJob | ErrJob
  ERR:
    EmptyArguments, etc...

// test that it works with cancelJob
firstOk: (cancel the rest)
  SUCC
    OkJob
  Err:
    Err<"AllFailed"> | EmptyArguments, etc...

all:
  SUCC:
    (OkJob | ErrJob)[]
  ERR:
    EmptyArguments, etc...


=>> NOW:
  - todo: optimize loop_tg so it doesn't link/unlink when _cancel() completes sync (most of times)


THEN: implement the rest of helpers and this

export function allOrErrFrom<T>(
  values: T[],
  fn: (val: T) => Generator
) {
  // but implement with new _Job passing this as parent
  return allOrErr(values.map(val => () => go(fn, val)))
}

THEN: implement pools (including myJobs() from calculator)






*/

// Conceptually, cancelJob.cancel()
// 1) unsub from all jobs (jobs are already cancelled)
// 1) settles
function cancel(jobs) {

  function* _cancel() {

    for (const job of jobs) {
      job.cancel()
    }

    using pool = Pool(jobs)

    while (pool.inFlight) {
      const res = yield* pool
      // will unsub if cancel is cancelled.
    }

    // Pool will unsub from all jobs and return itself to
    // object pool.
  }

  return go(_cancel)
}

/* implement this

function timeoutAfter<T>(job: Job<T, any>, ms: number): Job<T | undefined, any> {
  return first([job, sleep(ms)])
}

*/