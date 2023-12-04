// Import the necessary modules and utilities
import crypto from 'crypto';
import db from '../utils/db';

// Function to hash a string using SHA-1
const cryptoPwdHash = (pwdToHash) => {
  const sha1Hash = crypto.createHash('sha1');
  sha1Hash.update(pwdToHash);
  return sha1Hash.digest('hex');
};

// Define the UsersController class
class UsersController {
  // Endpoint: POST /users
  static async postUser(req, res) {
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
      const existingUser = await db.userCollection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Already exists' });
      }

      // Hash the password using SHA1
      const hashedPassword = cryptoPwdHash(password);

      // Create a new user object
      const newUser = {
        email,
        password: hashedPassword,
      };

      // Insert the new user into the 'users' collection
      const result = await db.usersCollection.insertOne({ newUser });

      // Extract relevant information for the response
      const responseUser = {
        id: result.insertedId,
        email: result.ops[0].email,
      };

      // Send the new user as a JSON response with a status code of 201 (Created)
      return res.status(201).json(responseUser);
    } catch (error) {
      // Handle errors and send a 500 Internal Server Error response
      console.error('Error creating new user:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

// Export the UsersController class for use in other modules
export default UsersController;
