import { v4 as uuidv4 } from 'uuid'; // Import UUID for unique file naming
import path from 'path'; // Import path for handling file paths
import fs from 'fs'; // Import fs for file system operations

// get file folder name from env or select a default one
const LOCALFOLDERNAME = process.env.FOLDER_PATH || '/tmp/files_manager';

// create uuid string
const UUIDSTRING = uuidv4().toString();

export const saveFileLocally = async (data) => {
  const localPath = path.join(LOCALFOLDERNAME, UUIDSTRING);

  try {
    // Check if the directory exists, if not, create it
    await fs.promises.access(LOCALFOLDERNAME);
    console.log('directory exists');
  } catch (err) {
    console.log('creating folder...');
    await fs.promises.mkdir(LOCALFOLDERNAME, { recursive: true });
  }
  try {
    // Save the file locally
    await fs.promises.writeFile(localPath, Buffer.from(data, 'base64'));
    // logging to console for debugging
    console.log('written data to file');
    return `/tmp/files_manager/${UUIDSTRING}`;
  } catch (err) {
    console.log('retrying to write file to directory: ');
    try {
      // retyr Saving the file locally
      await fs.promises.writeFile(localPath, Buffer.from(data, 'base64'));
      // logging to console for debugging
      console.log('written data to file');
      return `/tmp/files_manager/${UUIDSTRING}`;
    } catch (err) {
      console.error('failed to write file to directory');
      return false;
    }
  }
};

// saveFileLocally would return a promise, manually export a pathname to be use
// image thumbnail would throw an error if filepath is missing, as database insertion
// would not wait for fs.promise.writefile to finish before conmencing operation
export const pathToBeRetruned = `/tmp/files_manager/${UUIDSTRING}`;
