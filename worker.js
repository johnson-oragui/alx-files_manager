import Queue from 'bull';
import sharp from 'sharp'; // Image processing library for resizing/formatting
import { ObjectId } from 'mongodb';
import dbclient from './utils/db';

// Create a Bull queue for userQueue
export const userQueue = new Queue('userQueue', {
  redis: {
    host: 'localhost',
    port: 6379,
  },
});

// Process the userQueue
userQueue.process(async (job) => {
  const { userId } = job.data;

  // Check if userId is present in the job
  if (!userId) {
    throw new Error('Missing userId');
  }

  // Find the user document in the 'usersCollection' based on userId
  const user = await dbclient.usersCollection.findOne({ _id: new ObjectId(userId) });

  // If no document is found in DB based on the userId, raise an error User not found
  if (!user) {
    throw new Error('User not found');
  }

  // Print in the console: Welcome <email>!
  console.log(`Welcome ${user.email}!`);
});

// Create a Bull queue for fileQueue
export const fileQueue = new Queue('fileQueue', {
  redis: {
    host: 'localhost',
    port: 6379,
  },
});

// Process the fileQueue
fileQueue.process(async (job) => {
  const { fileId, userId } = job.data;

  // Check if fileId and userId are present in the job
  if (!fileId || !userId) {
    throw new Error('Missing fileId or userId');
  }

  // Find the file document in the 'filesCollection' based on fileId
  const file = await dbclient.filesCollection.findOne({ _id: new ObjectId(fileId) });

  // If no document is found in DB based on the fileId, raise an error File not found
  if (!file) {
    throw new Error('File not found');
  }

  // Check if the file type is an image before processing
  if (file.type !== 'image') {
    console.log(`Skipping thumbnail generation for non-image file: ${fileId}`);
    return;
  }

  // Access the local file path from the file document
  const { localPath } = file.localPath;

  // Define paths for original and thumbnail images (replace with your naming convention)
  const originalImagePath = localPath;
  const thumbnailPath = `${localPath}.thumb.jpg`; // Example: filename.thumb.jpg

  try {
    // Read the original image using Sharp
    const image = sharp(originalImagePath);

    // Resize the image to a desired width and height (adjust as needed)
    await image.resize(200, 200).jpeg({ quality: 80 }).toFile(thumbnailPath);

    console.log(`Generated thumbnail for file: ${fileId}`);
  } catch (error) {
    console.error(`Error generating thumbnail for file ${fileId}: ${error.message}`);
  }
});
