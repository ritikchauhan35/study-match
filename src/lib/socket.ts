import { io } from 'socket.io-client';

// Get the Socket.IO server URL from environment variables or use default
const SOCKET_URL = import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:3001';

// Create a socket instance
export const socket = io(SOCKET_URL);

// Add connection event listeners
socket.on('connect', () => {
  console.log('Connected to Socket.IO server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from Socket.IO server');
});

socket.on('connect_error', (error) => {
  console.error('Socket.IO connection error:', error);
});

// Export a function to get the socket instance
export const getSocket = () => socket;