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

  static async addNewFile(newFileData) {
    try {
      return dbclient.filesCollection.insertOne(newFileData);
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  static async findFile(file) {
    try {
      console.log('findfile', file);
      return await dbclient.filesCollection.findOne(file);
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  static async fileUpdate(queryData, fileData) {
    try {
      console.log('findfile', fileData);
      return await dbclient.filesCollection.updateOne(queryData, fileData);
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  static async filesAggregate(aggregate) {
    try {
      console.log('findfile', aggregate);
      return await dbclient.filesCollection.aggregate(aggregate);
    } catch (err) {
      console.error(err);
      return false;
    }
  }
}

export default DBCrud;
