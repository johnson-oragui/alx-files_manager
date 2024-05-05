const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;
const mime = require('mime-types');
const { ObjectId } = require('mongodb');
const DBCrud = require('../utils/db_manager');
const redisClient = require('../utils/redis');
const { fileQueue } = require('../worker');

class FilesController {
  static async postUpload(req, res) {
    try {
      // retrieve the token from header
      const { 'x-token': token } = req.headers;
      console.log('token: ', token);

      if (!token) {
        // logging to console for debugging purpose
        console.error('Error getting token: ', token);
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const {
        name, type, isPublic, data,
      } = req.body;

      // construct a key to get userId from redisClient
      const key = `auth_${token}`;
      // logging to console for debugging purpose
      console.log('key: ', key);

      // retrieve userId from redisClient
      const userId = await redisClient.get(key);
      // logging to console for debugging purpose
      console.log('UserId: ', userId);
      if (!userId) {
        // logging to console for debugging purpose
        console.error('Error finding userId', userId);
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Retrieve the user based on the userId
      const user = await DBCrud.findUser({ _id: new ObjectId(userId) });
      // logging to console for debugging purpose
      console.log('User: ', user);

      if (!user) {
        // logging to console for debugging purpose
        console.error('Error finding user', user);
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!name) {
        // logging to console for debugging purpose
        console.error('Missing name: ', name);
        return res.status(400).json({ error: 'Missing name' });
      }

      const acceptedTypes = ['folder', 'file', 'image'];

      if (!type || !acceptedTypes.includes(type)) {
        // logging to console for debugging purpose
        console.error('Missing type: ', type, 'or not in accepted types');
        return res.status(400).json({ error: 'Missing type' });
      }

      if (!data && type !== 'folder') {
        // logging to console for debugging purpose
        console.error('Data not found: ', data, 'or type is not folder');
        return res.status(400).json({ error: 'Missing data' });
      }

      const parentId = req.body.parentId || 0;
      if (parentId !== 0) {
        const parentFile = await DBCrud.findFile({ _id: new ObjectId(parentId) });

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
        parentId,
      };

      // If the type is folder, add the new file document in the DB
      if (type === 'folder') {
        const dbResult = await DBCrud.addNewFile(newFile);
        // logging to console for debugging
        console.log('new folder file added: ', dbResult);
        // update the newFile id with the inserted id
        newFile.id = dbResult.insertedId;
        return res.status(201).json(newFile);
      }

      // For type=file|image, store the file locally
      const folderStorage = process.env.FOLDER_PATH || '/tmp/files_manager';
      const fullpath = path.join(process.cwd(), folderStorage);
      // logging to console for debugging
      console.log('folderStorage: ', fullpath);

      const localPath = path.join(fullpath, `${uuidv4()}`);
      // logging to console for debugging
      console.log('localPath: ', localPath);
      console.log(process.cwd());

      try {
        // Check if the directory exists, if not, create it
        await fs.access(fullpath);
        console.log('directory exists');
      } catch (err) {
        console.log('creating folder...');
        await fs.mkdir(fullpath, { recursive: true });
      }

      // Save the file locally
      await fs.writeFile(localPath, Buffer.from(data, 'base64'));
      // logging to console for debugging
      console.log('written data to file');

      // Update the newFile document with the localPath
      newFile.localPath = localPath;
      // logging to console for debugging
      console.log('newFile.localPath" ', newFile.localPath);

      // Add the new file document in the collection files
      const dbResult = await DBCrud.addNewFile(newFile);
      // logging to console for debugging
      console.log('dbResult for localPath', dbResult);
      newFile.id = dbResult.insertedId;
      // logging to console for debugging
      console.log('newFile._id: ', newFile.id);

      // Enqueue job to generate thumbnails
      await fileQueue.add({ fileId: newFile.id, userId: newFile.userId });

      return res.status(201).json(newFile);
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

module.exports = FilesController;
