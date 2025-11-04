import express from 'express';
import cors from 'cors';
import 'express-async-errors';
import { setupRoutes } from './routes/index.js';

const app = express();

app.use(cors());
app.use(express.json());

setupRoutes(app);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

export default app;
