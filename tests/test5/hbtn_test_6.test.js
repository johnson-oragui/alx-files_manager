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
    await testClientDb.collection('files').deleteMany({});

    // Add 1 user
    initialUser = {
      email: 'Johnson@me.com',
      password: sha1('johnson'),
    };
    console.log(initialUser);
    const createdDocs = await testClientDb.collection('users').insertOne(initialUser);
    // setTimeout(() => {}, 5000);
    console.log(createdDocs, createdDocs.insertedId);
    if (createdDocs.insertedId) {
      initialUserId = createdDocs.insertedId.toString();
      console.log(initialUserId);
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
    if (initialUserId) {
      await redisSetAsync(`auth_${initialUserToken}`, initialUserId);
    }
  });

  afterEach(async () => {
    await fctRemoveAllRedisKeys();
  });

  it('pOST /files creates a folder at the root', () => new Promise((done) => {
    const fileData = {
      name: 'newFile',
      type: 'folder',
    };
    chai.request('http://localhost:5000')
      .post('/files')
      .set('X-Token', initialUserToken)
      .send(fileData)
      .end(async (err, res) => {
        chai.expect(err).to.be.null;
        chai.expect(res).to.have.status(201);

        const resFile = res.body;
        chai.expect(resFile.name).to.equal(fileData.name);
        chai.expect(resFile.userId).to.equal(initialUserId);
        chai.expect(resFile.type).to.equal(fileData.type);
        chai.expect(resFile.parentId).to.equal(0);

        testClientDb.collection('files')
          .find({})
          .toArray((err, docs) => {
            chai.expect(err).to.be.null;
            chai.expect(docs.length).to.equal(1);
            const docFile = docs[0];
            chai.expect(docFile.name).to.equal(fileData.name);
            chai.expect(docFile._id.toString()).to.equal(resFile.id);
            chai.expect(docFile.userId.toString()).to.equal(initialUserId);
            chai.expect(docFile.type).to.equal(fileData.type);
            chai.expect(docFile.parentId.toString()).to.equal('0');
            done();
          })
          .catch((err) => {
            done(err);
          });
        done();
      });
  })).timeout(60000);
});
