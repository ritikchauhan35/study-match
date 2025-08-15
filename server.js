import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './server/db.js'; // Import connectDB
import Lobby from './server/models/Lobby.js'; // Import Lobby model

async function start() {
  // Load environment variables
  dotenv.config();

  // Connect to MongoDB and wait for it to succeed
  await connectDB();

  const app = express();
  app.use(cors());
  app.use(express.json()); // Middleware to parse JSON bodies

  // --- API Endpoints for Lobbies ---
  const router = express.Router();

  // [POST] /api/lobbies/find - Find matching lobbies
  router.post('/find', async (req, res) => {
    try {
      const { subjects } = req.body;
      if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
        return res.status(400).json({ message: 'Subjects are required' });
      }

      // Find lobbies that are not full and have at least one matching subject
      const lobbies = await Lobby.find({
        subjects: { $in: subjects },
        user_count: { $lt: 4 },
      }).sort({ updatedAt: -1 }); // Sort by most recent activity

      res.json(lobbies);
    } catch (error) {
      console.error('Error finding lobbies:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // [POST] /api/lobbies/create - Create a new lobby
  router.post('/create', async (req, res) => {
    try {
      const { subjects } = req.body;
      if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
        return res.status(400).json({ message: 'Subjects are required' });
      }

      const newLobby = new Lobby({
        subjects,
        user_count: 1,
      });

      await newLobby.save();
      res.status(201).json(newLobby);
    } catch (error) {
      console.error('Error creating lobby:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // [PUT] /api/lobbies/:id - Update a lobby (e.g., join)
  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // When updating, mongoose doesn't automatically update the `updatedAt` timestamp
      // unless a field is actually changed. We can force it by setting it manually.
      updates.updatedAt = new Date();

      const updatedLobby = await Lobby.findByIdAndUpdate(id, updates, { new: true });

      if (!updatedLobby) {
        return res.status(404).json({ message: 'Lobby not found' });
      }

      res.json(updatedLobby);
    } catch (error) {
      console.error('Error updating lobby:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // [GET] /api/lobbies/:id - Get a single lobby by ID
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const lobby = await Lobby.findById(id);

      if (!lobby) {
        return res.status(404).json({ message: 'Lobby not found' });
      }

      res.json(lobby);
    } catch (error) {
      console.error('Error getting lobby:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.use('/api/lobbies', router);


  const server = createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "*", // In production, restrict this to your frontend URL
      methods: ["GET", "POST"]
    }
  });

  // --- Socket.IO Handlers (Simplified) ---
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Room management
    socket.on('join_room', (roomId) => {
      socket.join( roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
      console.log(`User ${socket.id} left room ${roomId}`);
    });

    // Chat messaging
    socket.on('send_message', (messageData) => {
      const { roomId, text, userId, username, timestamp } = messageData;
      const message = {
        id: Date.now().toString(),
        room_id: roomId,
        text,
        user_id: userId,
        username,
        timestamp: timestamp || new Date()
      };
      io.to(roomId).emit('new_message', message);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  // Start the server
  let PORT = parseInt(process.env.VITE_SOCKET_PORT) || 3001;

  function startServer(port) {
    server.listen(port, () => {
      console.log(`Socket.IO and Express server running on port ${port}`);
    });

    server.on('error', (e) => {
      if (e.code === 'EADDRINUSE') {
        console.log(`Port ${port} is in use, trying port ${port + 1}`);
        server.removeAllListeners('error');
        startServer(port + 1);
      }
    });
  }

  startServer(PORT);
}

start();