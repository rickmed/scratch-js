// if you are to afraid of object k collition
import {test} from './sophi.mjs';

const testsAPI2 = [
    topic('equals()', [   // describe =alias= topic
        test("#only pull()", (queue) => {

        }),
        test.only("push()", (queue) => {

        }),
    ]),
    topic('some module()', [
        topic('equals()', [
            test("#only pull()", (queue) => {

            }),
            test.only("push()", (queue) => {

            }),
        ]),
    ]),
];


const tests1 = {
    equals: {
        "#only should not throw"() {
            const received = subject1(5);
            assert(received, expected, "optional msg to explain the assertion");
        },
        "should throw correctly"() {
            const received = subject1(5);
            assert(received, expected, "optional msg to explain the assertion");
        },
    },
    ['#only not equals()']: {
        "#only should not throw"() {
            const received = subject1(5);
            assert(received, expected, "optional msg to explain the assertion");
        },
        "should throw correctly"() {
            const received = subject1(5);
            assert(received, expected, "optional msg to explain the assertion");
        },
    },
    [`#serial equals`]: {   // force tests to run serially for some reason
        "#only should not throw"() {
            const received = subject1(5);
            assert(received, expected, "optional msg to explain the assertion");
        },
    },
}

const tests2 = {
    async "#only pull()"() {
        const received = await subject2(5);
        assert(received, expected);
    },
}

const tests3 = {
    "#only pull()"({done}) {
        const prom = Promise.resolve('hey');
        prom.then(val => {
            assert(val, expected);
            done();
        })
    },
}


// dyanmically skip tests in async
const tests4 = {  // https://github.com/facebook/jest/issues/8604
    async "#only pull()"(_, skip) {
        if (!(await remoteService.isActive())) {
            return skip()
          }
        //   … test the remote service …
    },
}

// maybe done()/skip() are just queue("done" | "skip")
// let's see the implementation


/*
- asserts and queue() calls, put things in circular queue and returns
- the testing runner coordinator makes sure the queue is small/empty
before pushing tests to be ran. ie, makes sure the readers of the tests results
are not being overwhelmed.

*/

const tests = Object.assign(tests1, tests2);

export default tests
