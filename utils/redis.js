import redis from 'redis';
import { promisify } from 'util';

class RedisClient {
    constructor () {

        this.client = redis.createClient();

        this.client.on('error', (err) => {
          console.log(err.message);
        });
    }

    }

    async get(key) {
      const asyncGet = promisify(this.client.get).bind(this.client);
      const value = await asyncGet(key);
      return value;
    }

    async set(key, value, duration) {
      const asyncSet = promisify(this.client.set).bind(this.client);
      await asyncSet(key, value, 'EX', duration);
    }

    async del(key) {
      const asyncDel = promisify(this.client.del).bind(this.client);
      await asyncDel(key);
    }

    async close() {
      await this.client.quit()
    }

}

const redisClient = new RedisClient();
export default redisClient;
