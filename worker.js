// worker.js

import Bull from 'bull';
import imageThumbnail from 'image-thumbnail';
import dbclient from '../utils/db';
import path from 'path';

const fileQueue = new Bull('fileQueue');

fileQueue.process(async (job) => {
  const { fileId, userId } = job.data;

  if (!fileId) {
    throw new Error('Missing fileId');
  }

  if (!userId) {
    throw new Error('Missing userId');
  }

  const fileDocument = await dbclient.filesCollection.findOne({ _id: fileId, userId });

  if (!fileDocument) {
    throw new Error('File not found');
  }

  const originalPath = fileDocument.localPath;

  // Generate thumbnails
  const sizes = [500, 250, 100];
  const promises = sizes.map(async (size) => {
    const thumbnailPath = `${originalPath}_${size}`;
    const thumbnail = await imageThumbnail(originalPath, { width: size });
    await imageThumbnail.outputFile(thumbnail, thumbnailPath);
  });

  await Promise.all(promises);
});

export default fileQueue;
