import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import { connectDB } from './src/config/db.js';

// Import Routes
import authRoutes from './src/routes/authRoutes.js';
import taskRoutes from './src/routes/taskRoutes.js';

dotenv.config();

const app = express();

// Set the server port
const PORT = process.env.PORT || 3000;

// Middleware to handle CORS, allowing all origins
app.use(cors({ origin: '*' }));

// Middleware to parse JSON requests
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/task', taskRoutes);

// Basic route handler
app.get('/', (req, res) => {
  res.send('Welcome to the Trip Planner Server!');
});

// Start the server and establish database connection
app.listen(PORT, () => {
  connectDB();
  console.log(`Server is running on port ${PORT}`);
});
