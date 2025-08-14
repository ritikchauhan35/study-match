import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// MongoDB services will be handled through API endpoints instead of direct imports

// Get current file path (ES modules don't have __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // In production, restrict this to your frontend URL
    methods: ["GET", "POST"]
  }
});

// Store active channels and their subscribers
const channels = new Map();

// Store presence data for each channel
const presenceByChannel = new Map();

// Helper function to get or create a channel
function getOrCreateChannel(channelName) {
  if (!channels.has(channelName)) {
    channels.set(channelName, new Set());
  }
  return channels.get(channelName);
}

// Helper function to get or create presence data for a channel
function getOrCreatePresence(channelName) {
  if (!presenceByChannel.has(channelName)) {
    presenceByChannel.set(channelName, new Map());
  }
  return presenceByChannel.get(channelName);
}

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Handle channel subscription
  socket.on('subscribe', ({ channel, userId, userInfo }) => {
    console.log(`User ${userId} subscribing to channel: ${channel}`);
    
    // Join the socket.io room
    socket.join(channel);
    
    // Add to our channel tracking
    const subscribers = getOrCreateChannel(channel);
    subscribers.add(socket.id);
    
    // Track presence if userId is provided
    if (userId) {
      const presence = getOrCreatePresence(channel);
      presence.set(userId, {
        userId,
        online: true,
        lastSeen: new Date(),
        ...userInfo
      });
      
      // Broadcast presence update to all channel subscribers
      io.to(channel).emit('presence', {
        event: 'join',
        userId,
        userInfo
      });
      
      // Send current presence state to the new subscriber
      const presenceState = Array.from(presence.values());
      socket.emit('presence', {
        event: 'sync',
        users: presenceState
      });
    }
  });
  
  // Handle channel unsubscription
  socket.on('unsubscribe', ({ channel, userId }) => {
    console.log(`User ${userId} unsubscribing from channel: ${channel}`);
    
    // Leave the socket.io room
    socket.leave(channel);
    
    // Remove from our channel tracking
    const subscribers = channels.get(channel);
    if (subscribers) {
      subscribers.delete(socket.id);
    }
    
    // Update presence if userId is provided
    if (userId && presenceByChannel.has(channel)) {
      const presence = presenceByChannel.get(channel);
      presence.delete(userId);
      
      // Broadcast presence update
      io.to(channel).emit('presence', {
        event: 'leave',
        userId
      });
    }
  });
  
  // Handle broadcast messages
  socket.on('broadcast', ({ channel, event, payload }) => {
    console.log(`Broadcasting to ${channel}: ${event}`);
    io.to(channel).emit(event, payload);
  });
  
  // Handle heartbeat for presence
  socket.on('heartbeat', ({ channel, userId }) => {
    if (userId && presenceByChannel.has(channel)) {
      const presence = presenceByChannel.get(channel);
      if (presence.has(userId)) {
        const userData = presence.get(userId);
        userData.lastSeen = new Date();
        presence.set(userId, userData);
      }
    }
  });
  
    // Basic message handling for real-time communication
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
    
    // Broadcast the message to all users in the room
    io.to(roomId).emit('new_message', message);
  });
  
  // Room management
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });
  
  socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
      console.log(`User ${socket.id} left room ${roomId}`);
    });

    socket.on('update_lobby', ({ lobbyId, updates }) => {
      // In a real application, you would update the lobby in your database
      // For this demo, we'll just log it to the console
      console.log(`Received update for lobby ${lobbyId}:`, updates);

      // Optionally, you could broadcast this update to other users in the lobby
      // io.to(lobbyId).emit('lobby_updated', updates);
    });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Remove from all channels and update presence
    channels.forEach((subscribers, channelName) => {
      if (subscribers.has(socket.id)) {
        subscribers.delete(socket.id);
        
        // Find and update user presence
        const presence = presenceByChannel.get(channelName);
        if (presence) {
          // Find the userId associated with this socket
          let userIdToRemove = null;
          presence.forEach((data, userId) => {
            if (data.socketId === socket.id) {
              userIdToRemove = userId;
            }
          });
          
          if (userIdToRemove) {
            presence.delete(userIdToRemove);
            io.to(channelName).emit('presence', {
              event: 'leave',
              userId: userIdToRemove
            });
          }
        }
      }
    });
  });
});

// Cleanup inactive users periodically (every minute)
setInterval(() => {
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
  
  presenceByChannel.forEach((presence, channelName) => {
    presence.forEach((userData, userId) => {
      if (userData.lastSeen < twoMinutesAgo) {
        // User has been inactive for more than 2 minutes
        presence.delete(userId);
        
        // Broadcast presence update
        io.to(channelName).emit('presence', {
          event: 'leave',
          userId
        });
      }
    });
  });
}, 60000);

// Start the server
let PORT = parseInt(process.env.VITE_SOCKET_PORT) || 3001;

// Function to try starting server on different ports
function startServer(port) {
  server.listen(port, () => {
    console.log(`Socket.IO server running on port ${port}`);
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