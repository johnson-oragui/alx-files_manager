import chai from 'chai';
import sinon from 'sinon';

import redisClient from '../../utils/redis';

sinon.stub(console, 'log');

describe.only('redisClient test', () => {
  it('isAlive when redis not started', () => new Promise((done) => {
    let i = 0;
    const repeatFct = async () => {
      await setTimeout(() => {
        let cResult;
        try {
          cResult = redisClient.isAlive();
          // console.log('cResult:', cResult); // Add this line
        } catch (error) {
        // console.error('Error in isAlive:', error.message); // Add this line
          cResult = false;
        }
        chai.assert.isFalse(cResult);
        i += 1;
        if (i >= 5) {
          done();
        } else {
          repeatFct();
        }
      }, 1000);
    };
    repeatFct();
  })).timeout(10000);
});

