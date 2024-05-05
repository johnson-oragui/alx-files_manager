// Import the MongoClient from the 'mongodb' library
import { MongoClient } from 'mongodb';

// Class representing the MongoDB client
class DBClient {
  // Constructor for initializing the MongoDB client
  constructor() {
    // Define constants for MongoDB connection
    const DB_HOST = process.env.DB_HOST || 'localhost';
    const DB_PORT = process.env.DB_PORT || 27017;
    const DB_DATABASE = process.env.DB_DATABSAE || 'files_manager';

    // Create the MongoDB connection URI based on the constants
    this.URI = `mongodb://${DB_HOST}:${DB_PORT}/${DB_DATABASE}`;
    // Create a new instance of MongoClient with the connection URI

    this.client = null;
    this.isConnected = false;
    this.db = null;
    this.usersCollection = null;
    this.filesCollection = null;
    this.connect()
      .then(() => {})
      .catch((err) => console.error('error connecting to db', err));
  }

  async connect() {
    try {
      this.client = await MongoClient.connect(this.URI, { useUnifiedTopology: true });
      this.isConnected = true;
      // Get a reference to the database and initialize collections
      this.db = this.client.db();
      this.usersCollection = this.db.collection('users');
      this.filesCollection = this.db.collection('files');
      return null;
    } catch (err) {
      console.error('Error connecting to MongoDB', err);
      return false;
    }
  }

  // Method to check if the MongoDB connection is alive
  isAlive() {
    return this.isConnected;
  }

  // Method to asynchronously get the number of users in the 'users' collection
  async nbUsers() {
    try {
      // Use the countDocuments method to get the count of documents in the 'users' collection
      const count = await this.usersCollection.countDocuments();
      return count;
    } catch (error) {
      // Log an error message if an error occurs during the operation
      console.error('Error counting users: ', error);
      return -1;
    }
  }

  // Method to asynchronously get the number of files in the 'files' collection
  async nbFiles() {
    try {
      // Use the countDocuments method to get the count of documents in the 'files' collection
      const count = await this.filesCollection.countDocuments();
      return count;
    } catch (error) {
      // Log an error message if an error occurs during the operation
      console.error('Error counting files: ', error);
      return -1;
    }
  }
}

// Create an instance of the DBClient class to represent the MongoDB client
const dbclient = new DBClient();

// Export the created instance for use in other parts of the application
export default dbclient;
