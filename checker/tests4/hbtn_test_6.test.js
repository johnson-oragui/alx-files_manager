/* eslint-disable jest/expect-expect */
/* eslint-disable no-unused-expressions */
/* eslint-disable jest/no-hooks */
import chai from 'chai';
import chaiHttp from 'chai-http';

import { v4 as uuidv4 } from 'uuid';

import { MongoClient } from 'mongodb';
import { promisify } from 'util';
import redis from 'redis';
import sha1 from 'sha1';
import { stat } from 'fs';

chai.use(chaiHttp);

describe('will GET /users/me', () => {
  let testClientDb;
  let testRedisClient;
  let redisDelAsync;
  let redisGetAsync;
  let redisSetAsync;
  let redisKeysAsync;

  let initialUser = null;
  let initialUserId = null;
  let initialUserToken = null;

  const fctRandomString = () => Math.random().toString(36).substring(2, 15);

  const fctRemoveAllRedisKeys = async () => {
    const keys = await redisKeysAsync('auth_*');
    await Promise.all(keys.map(async (key) => {
      await redisDelAsync(key);
    }));
  };

  beforeEach(async () => {
    const dbInfo = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || '27017',
      database: process.env.DB_DATABASE || 'files_manager',
    };
    const client = await MongoClient.connect(`mongodb://${dbInfo.host}:${dbInfo.port}/${dbInfo.database}`);
    if (client) {
      testClientDb = client.db(dbInfo.database);
    } else {
      console.error('could not connect to Mongodb');
    }
    await testClientDb.collection('users').deleteMany({});

    // Add 1 user
    initialUser = {
      email: `${fctRandomString()}@me.com`,
      password: sha1(fctRandomString()),
    };
    const createdDocs = await testClientDb.collection('users').insertOne(initialUser);
    if (createdDocs.ops && createdDocs.ops.length > 0) {
      initialUserId = createdDocs.ops[0]._id.toString();
    }

    testRedisClient = redis.createClient();
    redisDelAsync = promisify(testRedisClient.del).bind(testRedisClient);
    redisGetAsync = promisify(testRedisClient.get).bind(testRedisClient);
    redisSetAsync = promisify(testRedisClient.set).bind(testRedisClient);
    redisKeysAsync = promisify(testRedisClient.keys).bind(testRedisClient);
    await fctRemoveAllRedisKeys();
    // Set token for this user
    initialUserToken = uuidv4();

    await redisSetAsync(`auth_${initialUserToken}`, initialUserId);
  });

  afterEach(() => {
    fctRemoveAllRedisKeys();
  });

  it('gET /users/me with no token', () => new Promise((done) => {
    chai.request('http://localhost:5000')
      .get('/users/me')
      .end(async (err, res) => {
        chai.expect(err).to.be.null;
        chai.expect(res).to.have.status(401);
        console.log('status: ', res.statusCode);

        const resError = res.body.error;
        console.log('resError: ', resError);
        chai.expect(resError).to.equal('Unauthorized');

        done();
      });
  })).timeout(30000);
});
