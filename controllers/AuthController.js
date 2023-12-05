// Import necessary modules and utilities
import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import db from '../utils/db';
import redisClient from '../utils/redis';

// function to return existing user if they exist, returns false it not exists
async function getUserByEmailAndPwd(email, pwd) {
  try {
    // Attempt to find a user with the given email in the database
    const existingUser = await db.usersCollection.findOne({ email });

    // If a user with the given email is found
    if (existingUser) {
      const existingUserPwd = existingUser.password;

      // If the password matches the stored password, return the user
      if (pwd === existingUserPwd) {
        return existingUser;
      }
    }

    // If no user is found or the password doesn't match, return false
    return false;
  } catch (error) {
    // Log an error message if an error occurs during the database operation
    console.log('Error in compare', error.message);

    // Return false to indicate an error or no user found
    return false;
  }
}

// Define the AuthController class
class AuthController {
  // Endpoint to sign-in the user and generate a new authentication token
  static async getConnect(req, res) {
    const authHeader = req.header('Authorization');
    try {
      // Check if Authorization header is present and starts with 'Basic '
      if (!authHeader || !authHeader.startsWith('Basic ')) {
        const errMsg = { error: 'Unauthorized' };
        return res.status(401).json(errMsg);
      }

      // split the credentials from space to seperate 'Basic' and the credentials
      const credentials = authHeader.split(' ')[1];
      // decode the base64 from the header basic auth credentials
      const decodedCredentials = Buffer.from(credentials, 'base64').toString('utf-8');
      // split the decoded strings to email and password
      const [email, password] = decodedCredentials.split(':');

      // Check if email or password is missing
      if (!email || !password) {
        const errMsg = { error: 'Unauthorized' };
        return res.status(401).json(errMsg);
      }

      // Hash the password using SHA1
      const sha1Hashed = sha1(password);

      // userExists is existing User or a boolean(user=exists, false=not exist)
      const userExists = await getUserByEmailAndPwd(email, sha1Hashed);

      // If the user doesn't exist, return an unauthorized error
      if (userExists === 'false') {
        const errMsg = { error: 'Unauthorized' };
        return res.status(400).json(errMsg);
      }

      // Generate a new authentication token
      const token = uuidv4();

      // Create a key for Redis storage
      const key = `auth_${token}`;

      // Set the user ID in Redis with the generated token for 24 hours
      const duration = 24 * 60 * 60;

      // make a fresh call to mogondb to retrieve the user document
      const user = await db.usersCollection.findOne({ email });

      // check if the user's ObjectId is valid
      if (ObjectId.isValid(user._id)) {
        // Store user ID in Redis with the generated token for 24 hours
        await redisClient.set(key, user._id.toString(), duration);
      }
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
    const { 'X-Token': token } = req.headers;

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

      console.log(`key = ${key}, userId=${userId}`);

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
