import chai from 'chai';
// import sinon from 'sinon';

import redisClient from '../../utils/redis';

// sinon.stub(console, 'log');

describe('redisClient test', () => {
  it('isAlive when redis started', () => new Promise((done) => {
    let i = 0;
    const repeatFct = async () => {
      await setTimeout(() => {
        i += 1;
        if (i >= 5) {
          chai.assert.isTrue(false);
          // console.log(redisClient.isAlive());
          done();
        } else if (!redisClient.isAlive()) {
          repeatFct();
        } else {
          chai.assert.isTrue(true);
          done();
        }
      }, 1000);
    };
    repeatFct();
  })).timeout(10000);
});

