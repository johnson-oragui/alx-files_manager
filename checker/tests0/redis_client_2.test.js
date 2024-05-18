import redis from 'redis';
import chai from 'chai';
import { promisify } from 'util';
import redisClient from '../../utils/redis.js';


describe('redisClient test', () => {
    let testRedisClient;
    let redisDelAsync;

    beforeEach((done) => {
        testRedisClient = redis.createClient();
        redisDelAsync = promisify(testRedisClient.del).bind(testRedisClient);
        testRedisClient.on('connect', async () => {
            await redisDelAsync('myCheckerKey');
            done()
        });
    });
    
    afterEach(async () => {
    });

    it('get of not existing key', async () => {
        chai.assert.notExists(await redisClient.get('myCheckerKey'));
    });
});