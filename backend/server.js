import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import http from 'http';
import connect from './src/db/connect.js';
import { initializeSocket } from './src/socket.js';
import userRoutes from './src/routes/userRoutes.js';
import documentRoutes from './src/routes/documentRoutes.js';
import aiRoutes from './src/routes/aiRoutes.js';

dotenv.config();

const PORT = process.env.PORT || 3001;
const CLIENT_ORIGIN = 'http://localhost:3001';

const app = express();

// --- Middlewares ---
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --- Simple health route ---
app.get('/health', (_req, res) => res.json({ ok: true, env: process.env.NODE_ENV || 'development' }));

// --- API routes ---
app.use('/api/v1', userRoutes);
app.use('/api/v1', documentRoutes);
app.use('/api/v1/ai', aiRoutes);
// --- 404 handler ---
app.use((req, res, next) => {
  res.status(404).json({ message: 'Not found' });
});

// --- Error handler ---
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
});

// --- Start server & initialize socket.io ---
const startServer = async () => {
  try {
    // Connect to DB first
    await connect();
    console.log('Connected to database');

    // Create HTTP server from express app
    const httpServer = http.createServer(app);

    // Initialize Socket.IO and attach to the HTTP server
    initializeSocket(httpServer);
    console.log('Socket.IO initialized');

    // Start listening
    httpServer.listen(PORT, () => {
      console.log(`Server with Socket.IO is running on port ${PORT}`);
    });

    // Graceful shutdown
    const shutdown = (signal) => {
      return async () => {
        try {
          console.info(`\nReceived ${signal}. Shutting down gracefully...`);
          httpServer.close(() => {
            console.info('HTTP server closed.');
            process.exit(0);
          });

          // If still not closed in 10s, force exit
          setTimeout(() => {
            console.error('Forcing shutdown.');
            process.exit(1);
          }, 10000);
        } catch (err) {
          console.error('Error during shutdown', err);
          process.exit(1);
        }
      };
    };

    process.on('SIGINT', shutdown('SIGINT'));
    process.on('SIGTERM', shutdown('SIGTERM'));
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();

// handle uncaught exceptions / rejections to avoid silent crashes
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // prefer to crash and let process manager (pm2/docker) restart cleanly
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});