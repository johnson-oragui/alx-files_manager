// Import the Express framework
import express from 'express';
import routes from './routes/index';

// Create an instance of the Express application
const app = express();

// Define the port number to listen on (use the environment variable PORT if available,
//      otherwise default to 5000)
const PORT = process.env.PORT || 5000;

// Add middleware to parse JSON requests for task 3
app.use(express.json());

// Middleware to use the defined routes for all requests
app.use('/', routes);

// Start the Express server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
