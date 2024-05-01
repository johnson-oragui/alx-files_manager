// const dbclient = require('./db');
import dbclient from './db';

class DBCrud {
  static async findUser(user) {
    try {
      console.log('findUser', user);
      return await dbclient.usersCollection.findOne(user);
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  static async createNewUser(newUserData) {
    try {
      return dbclient.usersCollection.insertOne(newUserData);
    } catch (err) {
      console.error(err);
      return false;
    }
  }
}

export default DBCrud;
