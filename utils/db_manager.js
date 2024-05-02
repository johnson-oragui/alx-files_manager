// const dbclient = require('./db');
import dbclient from './db';

class DBCrud {
  static async findUser(user) {
    try {
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
      const newUser = await dbclient.usersCollection.insertOne(newUserData);
      return newUser;
    } catch (err) {
      console.error('error in DBCrud.createNewUser method: ', err);
      return false;
    }
  }

  static async addNewFile(newFileData) {
    try {
      const newFile = await dbclient.filesCollection.insertOne(newFileData);
      return newFile;
    } catch (err) {
      console.error('error in DBCrud.addNewFile method: ', err);
      return false;
    }
  }

  static async findFile(file) {
    try {
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
