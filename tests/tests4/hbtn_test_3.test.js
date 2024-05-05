/* eslint-disable jest/no-hooks */
import chai from 'chai';
import chaiHttp from 'chai-http';
import { MongoClient } from 'mongodb';
import { promisify } from 'util';
import redis from 'redis';
import sha1 from 'sha1';

chai.use(chaiHttp);

describe('will GET /connect', () => {
  let testClientDb;
  let testRedisClient;
  let redisDelAsync;
  let redisGetAsync;
  let redisSetAsync;
  let redisKeysAsync;

  let initialUser = null;
  let initialUserPwd = null;
  let initialUserId = null;

  const fctRandomString = () => Math.random().toString(36).substring(2, 15);

  // Function to remove all keys from Redis with pattern 'auth_*'
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

    // Connect to MongoDB
    const client = await MongoClient.connect(`mongodb://${dbInfo.host}:${dbInfo.port}/${dbInfo.database}`);
    if (client) {
      testClientDb = client.db(dbInfo.database);
    } else {
      console.error('Couldn\'t connect to db');
    }

    // Clear users collection
    await testClientDb.collection('users').deleteMany({});

    // Add a test user
    initialUserPwd = fctRandomString();
    initialUser = {
      email: `${fctRandomString()}@me.com`,
      password: sha1(initialUserPwd),
    };
    const { insertedId } = await testClientDb.collection('users').insertOne(initialUser);
    console.log('ops: ', insertedId);
    if (insertedId) {
      console.log('initialUserId: ', insertedId.toString());
      initialUserId = insertedId.toString();
    }

    // Initialize Redis client and promisified functions
    testRedisClient = redis.createClient();
    redisDelAsync = promisify(testRedisClient.del).bind(testRedisClient);
    redisGetAsync = promisify(testRedisClient.get).bind(testRedisClient);
    redisSetAsync = promisify(testRedisClient.set).bind(testRedisClient);
    redisKeysAsync = promisify(testRedisClient.keys).bind(testRedisClient);

    // Remove all existing Redis keys before each test
    await fctRemoveAllRedisKeys();
  });

  afterEach(async () => {
    // Remove all Redis keys after each test
    await fctRemoveAllRedisKeys();
    // Quit Redis client
    testRedisClient.quit();
  });

  it('gET /connect with correct user email and password', () => new Promise((done) => {
    const basicAuth = `Basic ${Buffer.from(`${initialUser.email}:${initialUserPwd}`, 'binary').toString('base64')}`;
    chai.request('http://localhost:5000')
      .get('/connect')
      .set('Authorization', basicAuth)
      .end(async (err, res) => {
        chai.expect(err).to.be.null;
        chai.expect(res).to.have.status(200);
        const resUserToken = res.body.token;
        chai.expect(resUserToken).to.not.be.null;

        const redisToken = await redisGetAsync(`auth_${resUserToken}`);
        chai.expect(redisToken).to.not.be.null;
        chai.expect(initialUserId).to.equal(redisToken);

        done();
      });
  })).timeout(30000);
});
