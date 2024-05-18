import fs from 'fs'; // Import fs for file system operations
import mime from 'mime-types'; // Import mime-types for handling MIME types
import { ObjectId } from 'mongodb'; // Import ObjectId for MongoDB object IDs
import DBCrud from '../utils/db_manager'; // Import DBCrud for database operations
import redisClient from '../utils/redis'; // Import redisClient for Redis operations
import { fileQueue } from '../worker'; // Import fileQueue for background job processing
import { saveFileLocally, pathToBeRetruned } from '../utils/saveFileLocally';

export default class FilesController {
  static async postUpload(req, res) {
    try {
      const {
        name, // Filename
        type, // Type of the file (folder, file, image)
        parentId = 0, // Parent ID, default is 0 (root)
        isPublic = false, // Public flag, default is false
        data, // Base64 encoded file data
      } = req.body;

      // retrieve the token from header
      const token = req.header('x-token');

      // return unauthorized if token is missing
      if (!token) {
        // logging to console for debugging purpose
        console.error('Error getting token: ', token);
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // construct a key to get userId from redisClient
      const key = `auth_${token}`;

      // retrieve userId stored in redis
      const userId = await redisClient.get(key);

      // return unauthorized if token is invalid
      if (!userId) {
        // logging to console for debugging purpose
        console.error('Error finding userId', userId);
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Retrieve the user from database based on the userId
      const user = await DBCrud.findUser({ _id: new ObjectId(userId) });

      // return unauthorized if userId does not exist in database
      if (!user) {
      //   // logging to console for debugging purpose
        console.error('Error finding user', user);
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if the name is provided
      if (!name) {
        // logging to console for debugging purpose
        console.error('Missing name: ', name);
        return res.status(400).json({ error: 'Missing name' });
      }

      // Accepted file types
      const acceptedTypes = ['folder', 'file', 'image'];

      // Check if the type is valid
      if (!type || !acceptedTypes.includes(type)) {
        // logging to console for debugging purpose
        console.error('Missing type: ', type, 'or not in accepted types');
        return res.status(400).json({ error: 'Missing type' });
      }

      // Check if data is provided for non-folder types
      if (!data && type !== 'folder') {
        // logging to console for debugging purpose
        console.error('Data not found: ', data, 'or type is not folder');
        return res.status(400).json({ error: 'Missing data' });
      }

      // If parentId is not 0, it is a subfolder, validate the parent folder
      if (parentId !== 0) {
        const parentFolder = await DBCrud.findFile({ _id: new ObjectId(parentId) });

        // Check if the parent folder exists
        if (!parentFolder) {
          // logging to console for debugging purpose
          console.error('parentFolder not found: ', parentFolder);
          return res.status(400).json({ error: 'Parent not found' });
        }

        if (parentFolder.type !== 'folder') {
          // logging to console for debugging purpose
          console.error('parentFolder not a folder: ', data);
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      }

      // Create a new file or folder document
      const newFileOrFolder = {
        userId: new ObjectId(user._id),
        name,
        type,
        isPublic,
        parentId,
      };

      // If the type is folder, add the new file document in the DB
      if (type === 'folder') {
        const dbResult = await DBCrud.addNewFile(newFileOrFolder);
        // logging to console for debugging
        console.log('new folder file added: ', dbResult);
        // update the newFileOrFolder id with the inserted id
        newFileOrFolder.id = dbResult.insertedId;
        return res.status(201).json(newFileOrFolder);
      }

      // For type=file|image, store the file locally
      const localPath = saveFileLocally(data);

      // return error if file could not be saved locally
      if (!localPath) {
        console.error('could not save file locally: ');
        res.status(500).json({ error: 'Internal Server Error' });
      }

      // Update the newFileOrFolder document with the localPath
      newFileOrFolder.localPath = pathToBeRetruned;
      // logging to console for debugging
      console.log('newFileOrFolder.localPath" ', newFileOrFolder.localPath);

      // Add the new file document in the collection files
      const dbResult = await DBCrud.addNewFile(newFileOrFolder);
      // logging to console for debugging
      // console.log('dbResult for localPath', dbResult);
      newFileOrFolder.id = dbResult.insertedId;
      // logging to console for debugging
      console.log('newFileOrFolder._id: ', newFileOrFolder.id);

      // check if file type is image before enqueing to create a thumbnail
      if (newFileOrFolder.type === 'image') {
        // Get MIME-type based on the file name
        const mimeType = mime.lookup(data);
        if (mimeType.startsWith('image/')) {
          // Enqueue job to generate thumbnails
          await fileQueue.add({ fileId: newFileOrFolder.id, userId: newFileOrFolder.userId });
        } else {
          throw new Error('The mimeType of the supposed image is not an image mimeType');
        }
      }

      // remove unecessary details before returning to the user
      if (newFileOrFolder._id) delete newFileOrFolder._id;
      if (newFileOrFolder.localPath) delete newFileOrFolder.localPath;

      // return file details to the user
      return res.status(201).json(newFileOrFolder);
      // return res.status(200).json();
    } catch (error) {
      console.error('Error in postUpload request: ', error.message);
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

      const user = await DBCrud.findUser(new ObjectId(userId));
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

      const fileDocument = await DBCrud.findFile(attributes);
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

      // set the key for retrieving userId from redis
      const key = `auth_${token}`;

      // Retrieve userId from Redis
      const userId = await redisClient.get(key);
      // for debugging purpose
      console.log('userId: ', userId);

      // Validate userId
      if (!userId || typeof userId !== 'string' || userId.length !== 24) {
        console.error('Invalid userId: ', userId);
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Retrieve user from MongoDB
      const user = await DBCrud.findUser(new ObjectId(userId));
      // for debugging purpose
      console.log('user: ', user);

      // Check if user exists
      if (!user) {
        // for debugging purpose
        console.error('no usser found: ', user);
        res.status(401).json({ error: 'Unauthorized' });
      }
      // Set default values for parentId, page, and pageSize
      const parentId = req.query.parentId || '0';
      const page = parseInt(req.query.page, 10) || 0;
      const pageSize = 20;

      // for debugging purpose
      console.log('ready for aggregation');
      console.log('user._id: ', user._id);

      // Define aggregation pipeline
      const aggregate = [
        {
          $match: {
            userId: user._id,
            parentId: parentId === '0' ? 0 : new ObjectId(parentId),
          },
        },
        {
          $skip: page * pageSize,
        },
        {
          $limit: pageSize,
        },
      ];

      // Execute aggregation
      const files = await DBCrud.filesAggregate(aggregate).toArray();
      // for debugging purpose
      console.log('files: ', files);

      // return the files with status code 200
      return res.status(200).json(files);
    } catch (error) {
      console.error('Error in getIndex request', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async putPublish(req, res) {
    try {
      // Retrieve the user based on the token
      const { 'x-token': token } = req.headers;

      const key = `auth_${token}`;

      const userId = await redisClient.get(key);

      // for debugging purpose
      console.log('userId: ', userId);

      // Find user in MongoDB based on userId
      const user = await DBCrud.findUser(new ObjectId(userId));

      // Check if user exists
      if (!user) {
        console.error('User not found', user);
        return res.status(401).json({ error: 'Not found' });
      }

      // Define the query to fetch the fileDocument
      const toFetch = { userId: new ObjectId(user._id) };

      // Find the fileDocument in the filesCollection
      const fileDocument = await DBCrud.findFile(toFetch);
      console.log('fileDocument: ', fileDocument);

      // Check if fileDocument exists
      if (!fileDocument) {
        console.log('File document not found', fileDocument);
        return res.status(404).json({ error: 'Not found' });
      }

      // Save the updated fileDocument
      await DBCrud.fileUpdate(toFetch, { $set: { isPublic: true } });

      // Update the isPublic field to true
      fileDocument.isPublic = true;

      return res.status(200).json(fileDocument);
    } catch (error) {
      console.error('Error in putPublish method');
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async putUnpublish(req, res) {
    try {
      // Retrieve the user based on the token
      const { 'x-token': token } = req.headers;

      const key = `auth_${token}`;

      const userId = await redisClient.get(key);

      // for debugging purpose
      console.log('userId: ', userId);

      // Find user in MongoDB based on userId
      const user = await DBCrud.findUser(new ObjectId(userId));

      // Check if user exists
      if (!user) {
        console.error('User not found', user);
        return res.status(401).json({ error: 'Not found' });
      }

      // Define the query to fetch the fileDocument
      const toFetch = { userId: new ObjectId(user._id) };

      // Find the fileDocument in the filesCollection
      const fileDocument = await DBCrud.findFile(toFetch);
      console.log('fileDocument: ', fileDocument);

      // Check if fileDocument exists
      if (!fileDocument) {
        console.log('File document not found', fileDocument);
        return res.status(404).json({ error: 'Not found' });
      }

      // Save the updated fileDocument
      await DBCrud.fileUpdate(toFetch, { $set: { isPublic: false } });

      // Update the isPublic field to true
      fileDocument.isPublic = false;

      return res.status(200).json(fileDocument);
    } catch (error) {
      console.error('Error in putPublish method');
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getFile(req, res) {
    const fileId = req.params.id;

    try {
      const file = await DBCrud.findFile({ _id: new ObjectId(fileId) });
      // Check if the file exists
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Check if the file is public or the user is authenticated and the owner
      if (!file.isPublic && (!req.user || req.user.id !== file.userId)) {
        return res.status(404).json({ error: 'File not found' });
      }
      // Check if the file is a folder
      if (file.type === 'folder') {
        return res.status(400).json({ error: "A folder doesn't have content" });
      }

      // Check if the file is locally present (replace with your own logic)
      if (!file.localPath) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Get MIME-type based on the file name
      const mimeType = mime.lookup(file.name);

      // Set response headers

      res.setHeader('Content-Type', mimeType);

      // Read the file content and send it as the response
      const data = fs.readFileSync(file.localPath);

      return res.status(200).send(data);
    } catch (error) {
      console.error('Error in getFile method', error.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
