import express from 'express';
import dotenv from 'dotenv';

import { connectDB } from './src/config/db.js';

dotenv.config();

const app = express();

// Set the server port
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Basic route handler
app.get('/', (req, res) => {
  res.send('Welcome to the Trip Planner Server!');
});

// Start the server and establish database connection
app.listen(PORT, () => {
  connectDB();
  console.log(`Server is running on port ${PORT}`);
});
