import redis from '../utils/redis';
import db from '../utils/db';

class AppController {
  static async getStatus(req, res) {
    try {
      const isRedisAlive = await redis.isAlive();
      const isMongoDbAlive = await db.isAlive();

      const status = {
        redis: isRedisAlive,
        db: isMongoDbAlive,
      };

      res.status(200).send(status);
    } catch (error) {
      console.error('Error checking status', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getStats(req, res) {
    try {
      const usersCount = await db.nbUsers();
      const filesCount = await db.nbFiles();

      const usersAndFiles = {
        user: usersCount,
        files: filesCount,
      };

      res.status(200).send(usersAndFiles);
    } catch (error) {
      console.error('Error getting stats: ', error);
      res.status(500).json({ error: 'Internal server Error' });
    }
  }
}

export default AppController;
