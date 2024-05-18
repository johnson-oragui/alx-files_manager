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

    const file = await DBCrud.findFile({ _id: new ObjectId(fileId), userId: new ObjectId(userId) });
    if (!file) throw new Error('File not found');
    const path = file.localPath;
    // console.log('local path from image thumb: ', path);
    fs.promises.writeFile(`${path}_500`, await imageThumb(path, { width: 500 }));

    fs.promises.writeFile(`${path}_250`, await imageThumb(path, { width: 250 }));

    fs.promises.writeFile(`${path}_100`, await imageThumb(path, { width: 100 }));
  } catch (error) {
    console.error('An error occurred: ', error.message);
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
