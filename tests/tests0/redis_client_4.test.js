import redis from 'redis';
import chai from 'chai';
import { promisify } from 'util';
import redisClient from '../../utils/redis.js';


describe('redisClient test', () => {
    let testRedisClient;
    let redisDelAsync;
    let redisGetAsync;

    beforeEach((done) => {
        testRedisClient = redis.createClient();
        redisDelAsync = promisify(testRedisClient.del).bind(testRedisClient);
        redisGetAsync = promisify(testRedisClient.get).bind(testRedisClient);
        testRedisClient.on('connect', async () => {
            await redisDelAsync('setCheckerKey');
            done()
        });
    });
    
    afterEach(async () => {
        await redisDelAsync('setCheckerKey');
    });

    it('set new key/value', async () => {
        await redisClient.set('setCheckerKey', '89', 1000);
        const kv = await redisGetAsync('setCheckerKey');
        chai.assert.exists(kv);
        chai.assert.equal(kv, 89)
    });
});