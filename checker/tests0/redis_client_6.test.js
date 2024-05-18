import redis from 'redis';
import chai from 'chai';
import { promisify } from 'util';
import redisClient from '../../utils/redis.js';


describe('redisClient test', () => {
    let testRedisClient;
    let redisDelAsync;
    let redisGetAsync;
    let redisSetAsync;

    beforeEach((done) => {
        testRedisClient = redis.createClient();
        redisDelAsync = promisify(testRedisClient.del).bind(testRedisClient);
        redisGetAsync = promisify(testRedisClient.get).bind(testRedisClient);
        redisSetAsync = promisify(testRedisClient.set).bind(testRedisClient);
        testRedisClient.on('connect', async () => {
            await redisSetAsync('aDelCheckerKey', 89);
            done()
        });
    });
    
    afterEach(async () => {
        await redisDelAsync('setCheckerKey');
    });

    it('set new key/value', async () => {
        const kv = await redisGetAsync('aDelCheckerKey');
        chai.assert.exists(kv);
        chai.assert.equal(kv, 89)
        
        await redisClient.del('aDelCheckerKey');
        
        const newKv = await redisGetAsync('aDelCheckerKey');
        chai.assert.notExists(newKv);
    });
});
