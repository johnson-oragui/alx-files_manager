// Import necessary modules and utilities
const { v4: uuidv4 } = require('uuid');
const sha1 = require('sha1');
const DBCrud = require('../utils/db_manager');
const redisClient = require('../utils/redis');

// Define the AuthController class
class AuthController {
  // Endpoint to sign-in the user and generate a new authentication token
  static async getConnect(req, res) {
    const { authorization } = req.headers;
    // for debugging
    console.log('authorization: ', authorization);
    try {
      // Check if Authorization header is present and starts with 'Basic '
      if (!authorization || !authorization.startsWith('Basic ')) {
        // for debugging
        console.log('authorization', authorization);
        const errMsg = { error: 'Unauthorized' };
        return res.status(401).json(errMsg);
      }

      // split the credentials from space to seperate 'Basic' and the credentials
      const credentials = authorization.split(' ')[1];
      // decode the base64 from the header basic auth credentials
      const decodedCredentials = Buffer.from(credentials, 'base64').toString('utf-8');
      // split the decoded strings to email and password
      const [email, password] = decodedCredentials.split(':');
      // for debugging
      console.log('email: ', email, 'password: ', password);

      // Check if email or password is missing
      if (!email || !password) {
        const errMsg = { error: 'Unauthorized' };
        return res.status(401).json(errMsg);
      }

      // Hash the password using SHA1
      const sha1Hashed = sha1(password);

      // Attempt to find a user with the given email in the database
      const userExists = await DBCrud.findUser({ email, password: sha1Hashed });
      // for debugging
      console.log('userExists', userExists);

      // If the user doesn't exist, return an unauthorized error
      if (!userExists) {
        // for debugging
        console.log('userExists', userExists);
        const errMsg = { error: 'Unauthorized' };
        return res.status(401).json(errMsg);
      }

      // Generate a new authentication token
      const token = uuidv4();
      // Create a key for Redis storage
      const key = `auth_${token}`;
      // Set the user ID in Redis with the generated token for 24 hours
      const duration = 24 * 60 * 60;

      // Store user ID in Redis with the generated token for 24 hours
      await redisClient.set(key, userExists._id.toString(), duration);
      // Return the token in the response
      return res.status(200).json({ token });
    } catch (error) {
      // Log an error message if an error occurs during the operation
      console.error('Error when setting header', error.message);
      // Return a 500 Internal Server Error response
      return res.status(500).json({ error: error.message });
    }
  }

  // Endpoint to sign-out the user based on the token
  static async getDisconnect(req, res) {
    const { 'x-token': token } = req.headers;

    try {
      // Check if the token is present
      if (!token) {
        console.log('No token found', token);
        return res.status(401).json({ error: 'Unauthorized' });
      }
      // bcb7e6df-a282-4639-8849-2f217b102ee2

      // Create a key for Redis storage
      const key = `auth_${token}`;
      // Retrieve the user ID associated with the token from Redis
      const userId = await redisClient.get(key);

      // log key and userId to console for debugging purpose
      // console.log(`key = ${key}, userId=${userId}`);

      // If no user ID is found, return an unauthorized error
      if (!userId) {
        console.log('No user id', userId);
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Delete the token from Redis and return a 204 No Content response
      await redisClient.del(key);
      return res.status(204).end();
    } catch (error) {
      // Log an error message if an error occurs during the operation
      console.error('Error while trying to disconnect', error.message);
      // Return a 500 Internal Server Error response
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

// Export the AuthController class
export default AuthController;
