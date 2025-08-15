import { socket } from '@/lib/socket';

const API_BASE_URL = import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:3001';

// Types
export interface Lobby {
  id: string; // Use 'id' which is a virtual in the backend model
  subjects: string[];
  user_count: number;
  last_activity: Date;
  is_full: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  room_id: string;
  text: string;
  user_id: string;
  username: string;
  timestamp: Date;
}

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
    throw new Error(errorBody.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}


// Lobby service for frontend
export const lobbyService = {
  findMatchingLobbies: (subjects: string[]): Promise<Lobby[]> => {
    return fetchAPI('/api/lobbies/find', {
      method: 'POST',
      body: JSON.stringify({ subjects }),
    });
  },

  createLobby: (subjects: string[]): Promise<Lobby> => {
    return fetchAPI('/api/lobbies/create', {
      method: 'POST',
      body: JSON.stringify({ subjects }),
    });
  },

  updateLobby: (lobbyId: string, updates: Partial<Pick<Lobby, 'user_count'>>): Promise<Lobby> => {
    return fetchAPI(`/api/lobbies/${lobbyId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  getLobbyById: (lobbyId: string): Promise<Lobby | null> => {
    return fetchAPI(`/api/lobbies/${lobbyId}`);
  },
};

// Message service for frontend
export const messageService = {
  // Get messages for a room (simplified for demo)
  async getMessages(roomId: string): Promise<Message[]> {
    // In a real implementation, this would fetch from a database
    // For now, we'll keep it simple and return an empty array
    console.warn(`getMessages for ${roomId} is not implemented on the backend yet.`);
    return Promise.resolve([]);
  },
  
  // Send a message via Socket.IO
  async sendMessage(roomId: string, text: string, userId: string, username: string): Promise<Message> {
    const message: Message = {
      id: Date.now().toString(),
      room_id: roomId,
      text,
      user_id: userId,
      username,
      timestamp: new Date()
    };
    
    // Emit to Socket.IO server
    socket.emit('send_message', {
      roomId,
      text,
      userId,
      username,
      timestamp: message.timestamp
    });
    
    return Promise.resolve(message);
  }
};