const { MongoClient } = require('mongodb');

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 27017;
const DB_DATABASE = process.env.DB_DATABSAE || 'files_manager';
const URI = `mongodb://${DB_HOST}:${DB_PORT}/${DB_DATABASE}`;

class DBClient {
  constructor() {
    this.client = new MongoClient(URI);

    this.client.connect()
      .then(() => {
        // console.log('Connected to mongodb');
        this.db = this.client.db(DB_DATABASE);
        this.usersCollection = this.db.collection('users');
        this.filesCollection = this.db.collection('files');
      })
      .catch((err) => console.error('error connnecting to mongodb', err));
  }

  isAlive() {
    return Boolean(this.db);
  }

  async nbUsers() {
    try {
      const count = await this.usersCollection.countDocuments();
      return count;
    } catch (error) {
      console.error('Error counting users: ', error);
      return -1;
    }
  }

  async nbFiles() {
    try {
      const count = await this.filesCollection.countDocuments();
      return count;
    } catch (error) {
      console.error('Error counting files: ', error);
      return -1;
    }
  }
}

const dbclient = new DBClient();
export default dbclient;
