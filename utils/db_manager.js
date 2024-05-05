import dbclient from './db';

class DBCrud {
  static async findUser(user) {
    try {
      // Wait until the connection is established before using collections
      await dbclient.connect();
      const foundUser = await dbclient.usersCollection.findOne(user);
      console.log('from DBCrud.findUser', foundUser);
      return foundUser;
    } catch (err) {
      console.error('Error in DBCrud.findUser method: ', err);
      return false;
    }
  }

  static async createNewUser(newUserData) {
    try {
      // Wait until the connection is established before using collections
      await dbclient.connect();
      const newUser = await dbclient.usersCollection.insertOne(newUserData);
      return newUser;
    } catch (err) {
      console.error('error in DBCrud.createNewUser method: ', err);
      return false;
    }
  }

  static async addNewFile(newFileData) {
    try {
      // Wait until the connection is established before using collections
      await dbclient.connect();
      const newFile = await dbclient.filesCollection.insertOne(newFileData);
      console.log('Added file:', newFile);
      return newFile;
    } catch (err) {
      if (err.code === 11000) {
        // Duplicate key error, handle accordingly
        console.error('Duplicate key error in DBCrud.addNewFile method:', err);
      } else {
        console.error('Error in DBCrud.addNewFile method:', err);
      }
      return false;
    }
  }

  static async findFile(file) {
    try {
      // Wait until the connection is established before using collections
      await dbclient.connect();
      const foundFile = await dbclient.filesCollection.findOne(file);
      console.log('findfile', foundFile);
      return foundFile;
    } catch (err) {
      console.error('error in DBCrud.findFile method: ', err);
      return false;
    }
  }

  static async fileUpdate(queryData, fileData) {
    try {
      // Wait until the connection is established before using collections
      await dbclient.connect();
      const updatedFiled = await dbclient.filesCollection.updateOne(queryData, fileData);
      console.log('updatefile', updatedFiled);
      return updatedFiled;
    } catch (err) {
      console.error('error in DBCrud.fileUpdate method: ', err);
      return false;
    }
  }

  static async filesAggregate(aggregate) {
    try {
      // Wait until the connection is established before using collections
      await dbclient.connect();
      const aggFile = await dbclient.filesCollection.aggregate(aggregate);
      console.log('findfile', aggFile);
      return aggFile;
    } catch (err) {
      console.error('error in DBCrud..filesAggregate method: ', err);
      return false;
    }
  }
}

export default DBCrud;
