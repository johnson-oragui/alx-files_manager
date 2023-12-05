import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { ObjectId } from 'mongodb';
import dbclient from '../utils/db';
import redisClient from '../utils/redis';

export default class FilesController {
  static async postUpload(req, res) {
    try {
      // retrieve the token from header
      const { 'x-token': token } = req.headers;

      if (!token) {
        // logging to console for debugging purpose
        console.error('Error getting token: ', token);
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // construct a key to get userId from redisClient
      const key = `auth_${token}`;
      // logging to console for debugging purpose
      console.log('key: ', key);

      // retrieve userId from redisClient
      const userId = await redisClient.get(key);
      // logging to console for debugging purpose
      console.log('UserId: ', userId);

      // Retrieve the user based on the userId
      const user = await dbclient.usersCollection.findOne({ _id: new ObjectId(userId) });
      // logging to console for debugging purpose
      console.log('User: ', user);

      if (!user) {
        // logging to console for debugging purpose
        console.error('Error finding user', user);
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const {
        name, type, parentId, isPublic, data,
      } = req.body;

      if (!name) {
        // logging to console for debugging purpose
        console.error('Name not found: ', name);
        return res.status(400).json({ error: 'Missing name' });
      }

      const acceptedTypes = ['folder', 'file', 'image'];

      if (!type || !acceptedTypes.includes(type)) {
        // logging to console for debugging purpose
        console.error('Type not found: ', type, 'or not in accepted types');
        return res.status(400).json({ error: 'Missing type' });
      }

      if (type !== 'folder' && !data) {
        // logging to console for debugging purpose
        console.error('Data not found: ', data, 'or type is not folder');
        return res.status(400).json({ error: 'Missing data' });
      }

      if (parentId) {
        const parentFile = await dbclient.filesCollection.findOne({ _id: parentId });

        if (!parentFile) {
          // logging to console for debugging purpose
          console.error('parentFile not found: ', parentFile);
          return res.status(400).json({ error: 'Parent not found' });
        }

        if (parentFile.type !== 'folder') {
          // logging to console for debugging purpose
          console.error('parentFile not a folder: ', data);
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      }

      if (!isPublic) {
        // logging to console for debugging purpose
        console.error('isPublic not found: ', isPublic);
        console.log('isPublic is optional');
      }

      // Create a new file document
      const newFile = {
        userId: new ObjectId(user._id),
        name,
        type,
        isPublic: isPublic || false,
        parentId: parentId || 0,
        localPath: '',

      };

      // If the type is folder, add the new file document in the DB
      if (type === 'folder') {
        const dbResult = await dbclient.filesCollection.insertOne(newFile);
        // logging to console for debugging
        console.log('dbResult: ', dbResult);
        console.log('NewFile id: ', newFile._id);
        // update the newFile id with the inserted id
        newFile._id = dbResult.insertedId;
        return res.status(201).json(newFile);
      }

      // For type=file|image, store the file locally
      const folderStorage = process.env.FOLDER_PATH || '/tmp/files_manager';
      // logging to console for debugging
      console.log('folderStorage: ', folderStorage);

      const localPath = path.join(folderStorage, `${uuidv4()}`);
      // logging to console for debugging
      console.log('localPath: ', localPath);

      // Check if the directory exists, if not, create it
      if (!fs.existsSync(folderStorage)) {
        fs.mkdirSync(folderStorage, { recursive: true });
      }

      // Save the file locally
      fs.writeFileSync(localPath, Buffer.from(data, 'base64'));
      // logging to console for debugging
      console.log('written data to file');

      // Update the newFile document with the localPath
      newFile.localPath = localPath;
      // logging to console for debugging
      console.log('newFile.localPath" ', newFile.localPath);

      // Add the new file document in the collection files
      const dbResult = await dbclient.filesCollection.insertOne(newFile);
      // logging to console for debugging
      console.log('dbResult for localPath', dbResult);
      newFile._id = dbResult.insertedId;
      // logging to console for debugging
      console.log('newFile._id: ', newFile._id);

      return res.status(201).json(newFile);
    } catch (error) {
      console.error('Error in postUpload request', error.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getShow(req, res) {
    try {
      // Retrieve the user based on the token
      const { 'x-token': token } = req.headers;
      // for debugging purpose
      console.log('token : ', token);

      const key = `auth_${token}`;

      const userId = await redisClient.get(key);
      // for debugging purpose
      console.log('userId: ', userId);

      const user = await dbclient.usersCollection.findOne(new ObjectId(userId));
      // for debugging purpose
      console.log('user: ', user);

      if (!user) {
        // for debugging purpose
        console.error('no usser found: ', user);
        res.status(401).json({ error: 'Unauthorized' });
      }

      // Retrieve the file document based on the ID and user

      const { id } = req.params.id;
      // for debugging purpose
      console.log('id: ', id);

      const attributes = { _id: new ObjectId(id), userId: new ObjectId(userId) };

      const fileDocument = await dbclient.filesCollection.findOne(attributes);
      // for debugging purpose
      console.log('fileDocument: ', fileDocument);

      if (!fileDocument) {
        // log for debugging purpose
        console.error('fileDocument not found: ', fileDocument);
      }

      return res.status(200).json(fileDocument);
    } catch (error) {
      console.error('Error in getShow request', error.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getIndex(req, res) {
    try {
      // Retrieve the user based on the token
      const { 'x-token': token } = req.headers;
      // for debugging purpose
      console.log('token : ', token);

      const key = `auth_${token}`;

      const userId = await redisClient.get(key);
      // for debugging purpose
      console.log('userId: ', userId);

      const user = await dbclient.usersCollection.findOne(new ObjectId(userId));
      // for debugging purpose
      console.log('user: ', user);

      if (!user) {
        // for debugging purpose
        console.error('no usser found: ', user);
        res.status(401).json({ error: 'Unauthorized' });
      }
      const parentId = req.query.parentId || '0';
      const page = parseInt(req.query.page, 10) || 0;
      const pageSize = 20;

      const aggregate = [
        {
          $match: {
            userId: new ObjectId(userId),
            parentId: new ObjectId(parentId),
          },
        },
        {
          $skip: page * pageSize,
        },
        {
          $limit: pageSize,
        },
      ];
      const files = await dbclient.filesCollection.aggregate(aggregate).toArray();
      console.log('files: ', files);
    } catch (error) {
      console.error('Error in getIndex request', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
