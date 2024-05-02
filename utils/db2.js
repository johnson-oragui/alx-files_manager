// Import the MongoClient from the 'mongodb' library
const { MongoClient } = require('mongodb');

// Define constants for MongoDB connection
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 27017;
const DB_DATABASE = process.env.DB_DATABSAE || 'files_manager';

// Create the MongoDB connection URI based on the constants
const URI = `mongodb://${DB_HOST}:${DB_PORT}/${DB_DATABASE}`;

// Class representing the MongoDB client
class DBClient {
  // Constructor for initializing the MongoDB client
  constructor() {
    this.client = new MongoClient(URI);
    this.db = null;
    this.usersCollection = null;
    this.filesCollection = null;
  }

  // Method to check if the MongoDB connection is alive
  isAlive() {
    try {
      this.connect();
      return Boolean(this.db);
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  // Method to asynchronously get the number of users in the 'users' collection
  async nbUsers() {
    try {
      await this.connect();
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
      await this.connect();
      // Use the countDocuments method to get the count of documents in the 'files' collection
      const count = await this.filesCollection.countDocuments();
      return count;
    } catch (error) {
      // Log an error message if an error occurs during the operation
      console.error('Error counting files: ', error);
      return -1;
    }
  }

  async connect() {
    try {
      // connect to mongo server
      await this.client.connect();
      // console.log('connected to mongo server');
      this.db = this.client.db(DB_DATABASE);
      this.usersCollection = this.db.collection('users');
      this.filesCollection = this.db.collection('files');
      return true;
    } catch (err) {
      console.error('Error connecting to MongoDB:', err);
      // Return false if connection fails
      return false;
    }
  }

  // Method to disconnect from the MongoDB server
  async disconnect() {
    if (this.client.isConnected()) {
      try {
        await this.client.close();
        console.log('Disconnected from MongoDB server');
      } catch (err) {
        console.error('Error disconnecting from MongoDB:', err);
      }
    }
  }
}

const dbClient = new DBClient();
// Export the created instance for use in other parts of the application
export default dbClient;
