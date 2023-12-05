import redis from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = redis.createClient();

    this.client.on('error', (err) => {
      console.log(err.message);
    });
  }

  /**
  * Checks if the Redis client is alive.
  *
  * @returns {boolean} True if the client is alive, false otherwise.
  */
  isAlive() {
    if (this.client.ping) {
      return true;
    }
    return false;
  }

  /**
  * Gets the value associated with the specified key from the Redis server.
  *
  * @param {string} key - The key to get the value for.
  * @returns {Promise<string>} A promise that resolves to the value associated with
  *                           the specified key, or null if the key does not exist.
  */
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

  /**
  * Sets the value associated with the specified key in the Redis server.
  *
  * @param {string} key - The key to set the value for.
  * @param {string} value - The value to set.
  * @param {number} duration - The duration in seconds for which the key should exist.
  */
  async set(key, value, duration) {
    const asyncSetex = promisify(this.client.setex).bind(this.client);
    try {
      await asyncSetex(key, duration, value);
    } catch (error) {
      console.error('Error in set method', error.message);
      throw error;
    } finally {
      // Close the connection after the set operation completes
      setTimeout(() => {
        this.close();
      }, 20000);
    }
  }

  /**
  * Deletes the value associated with the specified key from the Redis server.
  *
  * @param {string} key - The key to delete the value for.
  * @returns {Promise<void>} A promise that resolves when the value has been deleted.
  */
  async del(key) {
    const asyncDel = promisify(this.client.del).bind(this.client);
    try {
      await asyncDel(key);
    } catch (error) {
      console.error('Error in del method', error.message);
      throw error;
    }
  }

  /**
  * Closes the connection to the Redis server.
  *
  * @returns {Promise<void>} A promise that resolves when the connection has been closed.
  */
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
