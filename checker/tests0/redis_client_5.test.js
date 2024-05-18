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

    it('set new key/value with expiration', (done) => {
        setTimeout(async () => {
            await redisClient.set('setCheckerKey', 89, 2);
            const kv = await redisGetAsync('setCheckerKey');
            chai.assert.exists(kv);
            chai.assert.equal(kv, 89)
            
            setTimeout(async () => {
                const newKv = await redisGetAsync('setCheckerKey');
                chai.assert.notExists(newKv);
                done();
            }, 5000);
        }, 100);
    
    }).timeout(10000);
});