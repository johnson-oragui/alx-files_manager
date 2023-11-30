import redis from 'redis';

class RedisClient {
  constructor () {
    this.client = redis.createClient();

    this.client.on('error', (eeror) => {
      console.log(error);
    });
  }

  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    return new Promise((resolve, reject) => {
      this.client.get((key, (err, result)) => {
        if (err) {
          reject(err);
	} else {
          resolve(result);
	}
      });
    });
  }

  async set(key, value, duration) {
    return new Promise((resolve, reject) => {
      this.client.set((key, value, 'EX', duration, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(reply);
        }
      }));
    });
  }

  async del(key) {
    return new Promise((resolve, reject) => {
      this.client.del(key, (err, result) => {
        if (err) {
          reject(err);
	} else {
          resolve(result);
	}
      });
    });
  }

}

const redisClient = new RedisClient();
export default redisClient;
