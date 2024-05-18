/* eslint-disable jest/expect-expect */
import chai from 'chai';

import chaiHttp from 'chai-http';

chai.use(chaiHttp);

describe('gET /status', () => {
  it('gET /status exists', () => new Promise((done) => {
    chai.request('http://localhost:5000')
      .get('/status')
      .end((err, res) => {
        chai.assert.isTrue(err === null);
        chai.assert.isTrue(res.statusCode === 200);
        chai.assert.isTrue(res.body.db === true);
        chai.assert.isTrue(res.body.redis === true);
        done();
      });
  })).timeout(30000);
});
