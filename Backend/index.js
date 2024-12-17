const express = require('express');
const app = express();

// Set the server port
const PORT = 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Basic route handler
app.get('/', (req, res) => {
  res.send('Welcome to the Trip Planner Server!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
