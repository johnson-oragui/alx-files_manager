import redis from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = redis.createClient();

    this.client.on('error', (err) => {
      console.log(err.message);
    });
  }

  isAlive() {
    if (this.client.ping) {
      return true;
    } else {
      console.log('not ready');
      return false;
    }
  }

  async get(key) {
    const asyncGet = promisify(this.client.get).bind(this.client);
    try {
      const value = await asyncGet(key);
      return value;
    } catch (error) {
      console.error('Error in get method', error.message);
      throw error;
    }
  }

  async set(key, value, duration) {
    const asyncSet = promisify(this.client.set).bind(this.client);
    try {
      await asyncSet(key, value, 'EX', duration);
    } catch (error) {
      console.error('Error in set method', error.message);
      throw error;
    }
  }

  async del(key) {
    const asyncDel = promisify(this.client.del).bind(this.client);
    try {
      await asyncDel(key);
    } catch (error) {
      console.error('Error in del method', error.message);
      throw error;
    }
  }

  async close() {
    const asyncQuit = promisify(this.client.quit).bind(this.client);
    try {
      await asyncQuit();
    } catch (error) {
      console.error('Error with close method', error.message);
      throw error;
    }
  }
}

const redisClient = new RedisClient();
export default redisClient;
