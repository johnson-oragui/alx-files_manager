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
        //console.log('Connected to mongodb');
        this.db = this.client.db(DB_DATABASE);
      })
      .catch((err) => console.error('error connnecting to mongodb', err));
  }

  isAlive() {
    return Boolean(this.db);
  }

  async nbUsers() {
    try {
      await this.client.connect();
      const usersCollection = this.db.collection('users');
      const count = await usersCollection.countDocuments();
      return count;
    } catch (error) {
      console.error('Error counting users: ', error);
      return -1;
    }
  }

  async nbFiles() {
    try {
      await this.client.connect();
      const filesCollection = this.db.collection('files');
      const count = await filesCollection.countDocuments();
      return count;
    } catch (error) {
      console.error('Error counting files: ', error);
      return -1;
    }
  }
}

const dbclient = new DBClient();
export default dbclient;
