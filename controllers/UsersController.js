// Import the necessary modules and utilities
const sha1 = require('sha1');
const { ObjectId } = require('mongodb');
const redisClient = require('../utils/redis');
const userQueue = require('../worker');
const DBCrud = require('../utils/db_manager');

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
      const existingUser = await DBCrud.findUser({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Already exist' });
      }

      // Hash the password using SHA1
      const hashedPassword = sha1(password);

      // Create a new user object
      const newUserData = {
        email,
        password: hashedPassword,
      };

      // Insert the new user into the 'users' collection
      const result = await DBCrud.createNewUser(newUserData);

      // Enqueue job to send Welcome email
      await userQueue.add({ userId: result.insertedId });

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
    const { 'x-token': token } = req.headers;
    // log token to console for debugging purpose
    // console.log(token);

    try {
      // Check if the token is missing
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Construct the key used to store the user ID in Redis
      const key = `auth_${token}`;
      // Retrieve the user ID from Redis
      const userId = await redisClient.get(key);
      // log userId to console for debuggging purpose
      // console.log(`UserId: ${userId}`);

      // Check if the user ID is not found in Redis
      if (!userId) {
        // added for debugging purpose
        // console.error('Error fetching userId');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Attempt to find a user in the 'usersCollection' with the given userId
      const user = await DBCrud.findUser({ _id: new ObjectId(userId) });
      // log user to console for debuggging purpose
      // console.log(`user: ${user._id}`);

      // Check if the user is not found in the database
      if (!user) {
        // added for debugging purpose
        console.error('Error fetching user by Id');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Respond with the user's email and ID if everything is successful
      return res.status(200).json({ id: user._id, email: user.email });
    } catch (error) {
      // Handle any unexpected errors and respond with a 500 Internal Server Error
      console.error('Error in getMe', error.messsage);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

// Export the UsersController class for use in other modules
module.exports = UsersController;
