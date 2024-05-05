// Import the Redis and MongoDB utilities
const redis = require('../utils/redis');
const db = require('../utils/db');

// Define the AppController class
class AppController {
  // Endpoint: GET /status
  static async getStatus(req, res) {
    try {
      // Check if Redis and MongoDB are alive
      const isRedisAlive = await redis.isAlive();
      const isMongoDbAlive = await db.isAlive();

      // Prepare the status object
      const status = {
        redis: isRedisAlive,
        db: isMongoDbAlive,
      };

      // Send the status as a JSON response with a status code of 200
      res.status(200).json(status);
    } catch (error) {
      // Handle errors and send a 500 Internal Server Error response
      console.error('Error checking status:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // Endpoint: GET /stats
  static async getStats(req, res) {
    try {
      // Retrieve the number of users and files from MongoDB
      const usersCount = await db.nbUsers();
      const filesCount = await db.nbFiles();

      // Prepare the users and files statistics object
      const usersAndFiles = {
        users: usersCount,
        files: filesCount,
      };

      // Send the statistics as a JSON response with a status code of 200
      res.status(200).json(usersAndFiles);
    } catch (error) {
      // Handle errors and send a 500 Internal Server Error response
      console.error('Error getting stats:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

// Export the AppController class for use in other modules
module.exports = AppController;
