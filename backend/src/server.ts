import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import dotenv from 'dotenv';
import { expressMiddleware } from '@apollo/server/express4';

import { connectDatabase } from './config/database';
import { createApolloServer, createContext } from './config/apollo';
import { authMiddleware } from './middleware/auth';
import { uploadProfilePicture, uploadDogPhoto, getFileUrl } from './middleware/upload';
import { initializeChatHandler } from './socket/chatHandler';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 4000;

async function startServer() {
  // Create Express app
  const app = express();

  // Create HTTP server
  const httpServer = http.createServer(app);

  // Initialize Socket.io
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Initialize chat handler
  initializeChatHandler(io);

  // Connect to database
  await connectDatabase();

  // Create Apollo Server
  const { server } = await createApolloServer(httpServer);

  // Middleware
  app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // File upload endpoints
  app.post('/upload/profile', authMiddleware, (req, res) => {
    uploadProfilePicture(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const fileUrl = getFileUrl(req.file.filename, baseUrl);
      
      res.json({ url: fileUrl, filename: req.file.filename });
    });
  });

  app.post('/upload/dog', authMiddleware, (req, res) => {
    uploadDogPhoto(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const fileUrl = getFileUrl(req.file.filename, baseUrl);
      
      res.json({ url: fileUrl, filename: req.file.filename });
    });
  });

  // GraphQL endpoint
  app.use(
    '/graphql',
    express.json(),
    expressMiddleware(server, {
      context: createContext,
    })
  );

  // Start server
  httpServer.listen(PORT, () => {
    console.log(`
🚀 Server ready!
   
📍 GraphQL:    http://localhost:${PORT}/graphql
📍 WebSocket:  ws://localhost:${PORT}/graphql
📍 Health:     http://localhost:${PORT}/health
📍 Uploads:    http://localhost:${PORT}/uploads

🐕 Dog Sitting Platform Backend is running!
    `);
  });
}

// Start the server
startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
