// Import the Express framework
import express from 'express';

// Import the AppController from the controllers folder
import AppController from '../controllers/AppController';

// Create an instance of the Express Router
const router = express.Router();

// Define the route for checking the status
router.get('/status', AppController.getStatus);

// Define the route for getting statistics
router.get('/stats', AppController.getStats);

// Export the router for use in other modules
export default router;
