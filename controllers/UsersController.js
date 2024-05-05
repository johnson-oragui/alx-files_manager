// Import the necessary modules and utilities
import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import redisClient from '../utils/redis';
import { userQueue } from '../worker';
import DBCrud from '../utils/db_manager';

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
    const token = req.header('X-Token');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });


    const user = await DBCrud.findUser({ _id: new ObjectId(userId) });
    if (user) return res.status(200).json({ id: userId, email: user.email });
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// Export the UsersController class for use in other modules
export default UsersController;
