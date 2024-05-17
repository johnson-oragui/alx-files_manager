import Queue from 'bull';
import imageThumb from 'image-thumbnail';
import { ObjectId } from 'mongodb';
import fs from 'fs';
import DBCrud from './utils/db_manager';

const fileQueue = new Queue('fileQueue');

fileQueue.process(async (job) => {
  try {
    const { fileId, userId } = job.data;
    if (!fileId) throw new Error('Missing fileId');
    if (!userId) throw new Error('Missing userId');

    const file = await DBCrud.findFile({ _id: ObjectId(fileId), userId: ObjectId(userId) });
    if (!file) throw new Error('File not found');
    const path = file.localPath;
    fs.writeFileSync(`${path}_500`, await imageThumb(path, { width: 500 }));

    fs.writeFileSync(`${path}_250`, await imageThumb(path, { width: 250 }));

    fs.writeFileSync(`${path}_100`, await imageThumb(path, { width: 100 }));
  } catch (error) {
    console.error('An error occurred:', error);
  }
});

const userQueue = new Queue('userQueue');

userQueue.process(async (job) => {
  try {
    const { userId } = job.data;
    if (!userId) throw new Error('Missing userId');
    const user = await DBCrud.findUser({ _id: ObjectId(userId) });
    if (!user) throw new Error('User not found');

    console.log(`Welcome ${user.email}!`);
  } catch (error) {
    console.error('An error occurred:', error);
  }
});

export { fileQueue, userQueue };
