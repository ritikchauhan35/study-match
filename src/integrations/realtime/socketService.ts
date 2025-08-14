import { io, Socket } from 'socket.io-client';
import { getCurrentUser } from '../user/userUtils';

// Socket.IO server URL from environment variables
const SOCKET_URL = import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:3001';

let socket: Socket | null = null;
let isConnected = false;
let channels: Record<string, ChannelSubscription> = {};

interface ChannelSubscription {
  name: string;
  callbacks: Record<string, ((payload: any) => void)[]>;
}

// Initialize socket connection
export const initializeSocket = () => {
  if (!socket) {
    const user = getCurrentUser();
    
    socket = io(SOCKET_URL, {
      auth: {
        userId: user.id,
        username: user.display_name
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('Connected to real-time server');
      isConnected = true;
      
      // Resubscribe to channels after reconnection
      Object.keys(channels).forEach(channelName => {
        socket?.emit('join', { channel: channelName });
      });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from real-time server');
      isConnected = false;
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  return socket;
};

// Create a channel subscription
export const createChannel = (channelName: string) => {
  if (!socket) {
    initializeSocket();
  }

  if (!channels[channelName]) {
    channels[channelName] = {
      name: channelName,
      callbacks: {}
    };

    // Join the channel on the server
    socket?.emit('join', { channel: channelName });
  }

  return {
    on: (event: string, callback: (payload: any) => void) => {
      if (!channels[channelName].callbacks[event]) {
        channels[channelName].callbacks[event] = [];
      }
      channels[channelName].callbacks[event].push(callback);

      // Set up listener for this event
      socket?.on(`${channelName}:${event}`, (data) => {
        channels[channelName].callbacks[event].forEach(cb => cb(data));
      });

      return () => {
        // Remove this specific callback
        channels[channelName].callbacks[event] = 
          channels[channelName].callbacks[event].filter(cb => cb !== callback);
      };
    },

    send: (event: string, payload: any) => {
      if (!socket || !isConnected) {
        console.error('Cannot send message: Socket not connected');
        return false;
      }

      socket.emit('broadcast', {
        channel: channelName,
        event,
        payload
      });

      return true;
    },

    unsubscribe: () => {
      if (channels[channelName]) {
        // Leave the channel on the server
        socket?.emit('leave', { channel: channelName });
        delete channels[channelName];
      }
    }
  };
};

// Track user presence in a room
export const trackPresence = (roomId: string) => {
  const channel = createChannel(`presence:${roomId}`);
  const user = getCurrentUser();

  // Send join event when tracking starts
  channel.send('join', { user });

  // Set up heartbeat to maintain presence
  const heartbeatInterval = setInterval(() => {
    channel.send('heartbeat', { userId: user.id });
  }, 30000); // Every 30 seconds

  return {
    onSync: (callback: (users: any[]) => void) => {
      return channel.on('sync', callback);
    },
    onJoin: (callback: (user: any) => void) => {
      return channel.on('join', callback);
    },
    onLeave: (callback: (user: any) => void) => {
      return channel.on('leave', callback);
    },
    leave: () => {
      clearInterval(heartbeatInterval);
      channel.send('leave', { userId: user.id });
      channel.unsubscribe();
    }
  };
};

// Close socket connection
export const closeSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    isConnected = false;
    channels = {};
  }
};