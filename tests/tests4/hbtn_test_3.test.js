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
    const { ops } = await testClientDb.collection('users').insertOne(initialUser);
    if (ops && ops.length > 0) {
      initialUserId = ops[0]._id.toString();
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
    // Close MongoDB connection
    if (testClientDb) await testClientDb.close();
    // Quit Redis client
    testRedisClient.quit();
  });

  it('will GET /connect with unknown user email', async () => {
    // Construct Basic Auth header with fake user email
    const basicAuth = `Basic ${Buffer.from(`fake_${initialUser.email}:${initialUserPwd}`).toString('base64')}`;

    // Make GET request to /connect endpoint
    const res = await chai.request('http://localhost:5000')
      .get('/connect')
      .set('Authorization', basicAuth);

    // Assert response status code and error message
    chai.expect(res).to.have.status(401);
    chai.expect(res.body.error).to.equal('Unauthorized');

    // Assert that no Redis keys exist with pattern 'auth_*'
    const authKeys = await redisKeysAsync('auth_*');
    chai.expect(authKeys).to.be.an('array').that.is.empty;
  }).timeout(30000);
});
