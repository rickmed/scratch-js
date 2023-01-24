var expect = require('chai').expect;

it('my first test', () => {
    try {
        expect(2).to.equal(1);
    }
    catch(e) {
        console.log(e.message);
        // console.log(Object.getOwnPropertyNames(e));
    }
});


