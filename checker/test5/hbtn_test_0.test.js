/* eslint-disable jest/expect-expect */
/* eslint-disable jest/no-hooks */
const chai = require('chai');
const chaiHttp = require('chai-http');

const { v4: uuidv4 } = require('uuid');

const { MongoClient, ObjectID } = require('mongodb');
const { promisify } = require('util');
const redis = require('redis');
const sha1 = require('sha1');

chai.use(chaiHttp);

describe('pOST /files', () => {
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
    const client = await MongoClient.connect(`mongodb://${dbInfo.host}:${dbInfo.port}/${dbInfo.database}`);
    testClientDb = client.db(dbInfo.database);

    await testClientDb.collection('users').deleteMany({});
    await testClientDb.collection('files').deleteMany({});

    // Add 1 user
    initialUser = {
      email: `${fctRandomString()}@me.com`,
      password: sha1(fctRandomString()),
    };
    const createdDocs = await testClientDb.collection('users').insertOne(initialUser);
    if (createdDocs.insertedId) {
      initialUserId = createdDocs.insertedId.toString();
    }

    testRedisClient = redis.createClient({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 6379, // Default Redis port
    });
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

  it('pOST /files invalid token user', () => new Promise((done) => {
    const fileData = {
      name: fctRandomString(),
      type: 'folder',
    };
    chai.request('http://localhost:5000')
      .post('/files')
      .set('X-Token', `${initialUserToken}_121`)
      .send(fileData)
      .end(async (err, res) => {
        chai.expect(err).to.be.null;
        chai.expect(res).to.have.status(401);

        const resError = res.body.error;
        chai.expect(resError).to.equal('Unauthorized');

        testClientDb.collection('files')
          .find({})
          .toArray((err, docs) => {
            chai.expect(err).to.be.null;
            chai.expect(docs.length).to.equal(0);

            done();
          });
        done();
      });
    done();
  })).timeout(30000);
});
