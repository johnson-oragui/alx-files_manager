// Import the Express framework
import express from 'express';
// import the UsersController from controllers directory
import UserController from '../controllers/UsersController';
// import the AuthController from controllers directory
import AuthController from '../controllers/AuthController';
// import FilesController from controllers directory
import FilesController from '../controllers/FilesController';
// Import the AppController from the controllers folder
import AppController from '../controllers/AppController';

// Create an instance of the Express Router
const router = express.Router();

// Define the route for checking the status
router.get('/status', AppController.getStatus);

// Define the route for getting statistics
router.get('/stats', AppController.getStats);

// Define the route for adding users
router.post('/users', UserController.postNew);

// Define route for Auth
router.get('/connect', AuthController.getConnect);

// Define route for dixconnection
router.get('/disconnect', AuthController.getDisconnect);

// define route for
router.get('/users/me', UserController.getMe);

//
router.post('/files', FilesController.postUpload);

router.get('/files/:id', FilesController.getShow);

router.get('/files/:id/data', FilesController.getFile);

router.get('/files', FilesController.getIndex);

router.put('/files/:id/publish', FilesController.putPublish);

router.put('/files/:id/publish', FilesController.putUnpublish);
// Export the router for use in other modules
export default router;
