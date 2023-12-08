import Queue from 'bull';
import { ObjectId } from 'mongodb';
import dbclient from './utils/db';

// Create a Bull queue for userQueue
const userQueue = new Queue('userQueue', {
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

export default userQueue;
