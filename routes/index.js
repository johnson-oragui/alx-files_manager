// Import the Express framework
import express from 'express';

// Import the AppController from the controllers folder
import AppController from '../controllers/AppController';

// import the UsersController from controllers directory
import UsersController from '../controllers/UsersController';

// import the AuthController from controllers directory
import AuthController from '../controllers/AuthController';

// Create an instance of the Express Router
const router = express.Router();

// Define the route for checking the status
router.get('/status', AppController.getStatus);

// Define the route for getting statistics
router.get('/stats', AppController.getStats);

// Define the route for adding users
router.post('/users', UsersController.postNew);

router.get('/connect', AuthController.getConnect);

router.get('/disconnect', AuthController.getDisconnect);

router.get('/users/me', UsersController.getMe);

// Export the router for use in other modules
export default router;
