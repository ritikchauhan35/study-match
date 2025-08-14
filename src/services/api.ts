// Frontend API service layer
// This file provides an abstraction layer between frontend components and backend services

import { socket } from '@/lib/socket';

// Types
interface Lobby {
  id: string;
  created_at: Date;
  subjects: string[];
  user_count: number;
  last_activity: Date;
  is_full: boolean;
}

interface Message {
  id: string;
  room_id: string;
  text: string;
  user_id: string;
  username: string;
  timestamp: Date;
}

// In-memory store for demo purposes (no DB)
const lobbyStore = new Map<string, Lobby>();

// Helper to create a new lobby object
function createLobbyObj(id: string, subjects: string[], userCount = 1): Lobby {
  return {
    id,
    created_at: new Date(),
    subjects,
    user_count: userCount,
    last_activity: new Date(),
    is_full: userCount >= 4, // arbitrary capacity for demo
  };
}

// Lobby service for frontend (simplified for demo)
export const lobbyService = {
  // Find lobbies that match the given subjects
  async findMatchingLobbies(subjects: string[]): Promise<Lobby[]> {
    // Return lobbies with overlapping subjects and not full
    const results: Lobby[] = [];
    lobbyStore.forEach((lobby) => {
      const hasOverlap = lobby.subjects.some((s) => subjects.includes(s));
      if (hasOverlap && !lobby.is_full) results.push(lobby);
    });
    // Sort by most recent activity
    results.sort((a, b) => b.last_activity.getTime() - a.last_activity.getTime());
    return Promise.resolve(results);
  },
  
  // Create a new lobby
  async createLobby(subjects: string[]): Promise<Lobby> {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const lobby = createLobbyObj(id, subjects, 1);
    lobbyStore.set(id, lobby);
    return Promise.resolve(lobby);
  },
  
  // Join a lobby
  async joinLobby(lobbyId: string): Promise<Lobby> {
    socket.emit('join_room', lobbyId);
    const existing = lobbyStore.get(lobbyId);
    const updated = existing
      ? { ...existing, user_count: existing.user_count + 1, last_activity: new Date(), is_full: existing.user_count + 1 >= 4 }
      : createLobbyObj(lobbyId, [], 1);
    lobbyStore.set(lobbyId, updated);
    return Promise.resolve(updated);
  },
  
  // Leave a lobby
  async leaveLobby(lobbyId: string): Promise<void> {
    socket.emit('leave_room', lobbyId);
    const existing = lobbyStore.get(lobbyId);
    if (existing) {
      const newCount = Math.max(0, existing.user_count - 1);
      const updated = { ...existing, user_count: newCount, is_full: newCount >= 4, last_activity: new Date() };
      lobbyStore.set(lobbyId, updated);
    }
    return Promise.resolve();
  },

  // Update a lobby
  async updateLobby(lobbyId: string, updates: Partial<Lobby>): Promise<Lobby> {
    socket.emit('update_lobby', { lobbyId, updates });
    const existing = lobbyStore.get(lobbyId) || createLobbyObj(lobbyId, updates.subjects || []);
    const merged: Lobby = {
      ...existing,
      ...updates,
      last_activity: updates.last_activity || new Date(),
      is_full: typeof updates.user_count === 'number' ? updates.user_count >= 4 : existing.is_full,
    };
    lobbyStore.set(lobbyId, merged);
    return Promise.resolve(merged);
  },

  // Get a lobby by ID
  async getLobbyById(lobbyId: string): Promise<Lobby | null> {
    return Promise.resolve(lobbyStore.get(lobbyId) || null);
  },

  // Delete a lobby
  async deleteLobby(lobbyId: string): Promise<boolean> {
    return Promise.resolve(lobbyStore.delete(lobbyId));
  }
};

// Message service for frontend
export const messageService = {
  // Get messages for a room (simplified for demo)
  async getMessages(roomId: string): Promise<Message[]> {
    // For demo purposes, return empty array
    // In a real implementation, this would fetch from MongoDB
    return Promise.resolve([]);
  },
  
  // Send a message
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