// Import the necessary modules and utilities
import sha1 from 'sha1';
import db from '../utils/db';
import redisClient from '../utils/redis';

// Async function to retrieve a user by their ID from the database
async function getUserById(userId) {
  try {
    // Attempt to find a user in the 'usersCollection' with the given userId
    const existingUser = await db.usersCollection.findOne({ userId });
    // If a user with the given userId is found, return the user object
    if (existingUser) {
      return existingUser;
    }
    // If no user is found, return false to indicate that the user doesn't exist
    return false;
  } catch (error) {
    // If an error occurs during the database operation, log the error
    console.log('Error getting user by Id', error.message);
    // Return false to indicate that an error occurred while retrieving the user
    return false;
  }
}
// Define the UsersController class
class UsersController {
  // Endpoint: POST /users
  static async postNew(req, res) {
    try {
      // Extract email and password from the request body
      const { email, password } = req.body;

      // Check if email is missing
      if (!email) {
        return res.status(400).json({ error: 'Missing email' });
      }

      // Check if password is missing
      if (!password) {
        return res.status(400).json({ error: 'Missing password' });
      }

      // Check if the email already exists in the database
      const existingUser = await db.usersCollection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Already exist' });
      }

      // Hash the password using SHA1
      const hashedPassword = sha1(password);

      // Create a new user object
      const newUser = {
        email,
        password: hashedPassword,
      };

      // Insert the new user into the 'users' collection
      const result = await db.usersCollection.insertOne(newUser);

      // Send the new user as a JSON response with a status code of 201 (Created)
      return res.status(201).json({ id: result.insertedId, email });
    } catch (error) {
      // Handle errors and send a 500 Internal Server Error response
      console.error('Error creating new user:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // Endpoint: GET /users/me
  // Retrieve the user information based on the provided token
  static async getMe(req, res) {
    // Extract the token from the request headers
    const { 'X-Token': token } = req.headers;

    try {
      // Check if the token is missing
      if (!token) {
        return res.status(401).json({ error: 'Unauthorised' });
      }

      // Construct the key used to store the user ID in Redis
      const key = `auth_${token}`;
      // Retrieve the user ID from Redis
      const userId = await redisClient.get(key);

      // Check if the user ID is not found in Redis
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Retrieve the user information from the database based on the user ID
      const user = await getUserById(userId);

      // Check if the user is not found in the database
      if (user === false) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Respond with the user's email and ID if everything is successful
      return res.status(200).json({ email: user.email, id: user.id });
    } catch (error) {
      // Handle any unexpected errors and respond with a 500 Internal Server Error
      console.error('Error in getMe', error.messsage);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

// Export the UsersController class for use in other modules
export default UsersController;
