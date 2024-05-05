// Import the Express framework
const express = require('express');
// import the UsersController from controllers directory
const UsersController = require('../controllers/UsersController');
// import the AuthController from controllers directory
const AuthController = require('../controllers/AuthController');
// import FilesController from controllers directory
const FilesController = require('../controllers/FilesController');
// Import the AppController from the controllers folder
const AppController = require('../controllers/AppController');

// Create an instance of the Express Router
const router = express.Router();

// Define the route for checking the status
router.get('/status', AppController.getStatus);

// Define the route for getting statistics
router.get('/stats', AppController.getStats);

// Define the route for adding users
router.post('/users', UsersController.postNew);

// Define route for Auth
router.get('/connect', AuthController.getConnect);

// Define route for dixconnection
router.get('/disconnect', AuthController.getDisconnect);

// define route for
router.get('/users/me', UsersController.getMe);

//
router.post('/files', FilesController.postUpload);

router.get('/files/:id', FilesController.getShow);

router.get('/files/:id/data', FilesController.getFile);

router.get('/files', FilesController.getIndex);

router.put('/files/:id/publish', FilesController.putPublish);

router.put('/files/:id/publish', FilesController.putUnpublish);
// Export the router for use in other modules
module.exports = router;
