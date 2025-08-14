import { v4 as uuidv4 } from 'uuid';
import { getModels, ILobby, IMessage } from './models';
import { connectMongoose } from './client';

// Get models
const { Lobby, Message } = getModels();

// Ensure MongoDB connection is established
let isConnected = false;

const ensureConnection = async () => {
  if (!isConnected) {
    try {
      await connectMongoose();
      isConnected = true;
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw new Error('Database connection failed');
    }
  }
};

// Lobby Services
export const lobbyService = {
  // Find lobbies that match the given subjects
  async findMatchingLobbies(subjects: string[]) {
    try {
      await ensureConnection();
      
      // Clean up inactive lobbies (older than 24 hours)
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      await Lobby.deleteMany({ last_activity: { $lt: oneDayAgo } });
      
      // Find lobbies with matching subjects that aren't full
      const lobbies = await Lobby.find({
        subjects: { $in: subjects },
        is_full: false
      }).sort({ created_at: -1 });
      
      return lobbies;
    } catch (error) {
      console.error('Error finding matching lobbies:', error);
      return [];
    }
  },
  
  // Create a new lobby
  async createLobby(subjects: string[]) {
    try {
      await ensureConnection();
      
      const newLobby = new Lobby({
        id: uuidv4(),
        subjects,
        user_count: 1,
        last_activity: new Date(),
        is_full: false
      });
      
      await newLobby.save();
      return newLobby;
    } catch (error) {
      console.error('Error creating lobby:', error);
      throw error;
    }
  },
  
  // Get a lobby by ID
  async getLobbyById(lobbyId: string) {
    try {
      await ensureConnection();
      return await Lobby.findOne({ id: lobbyId });
    } catch (error) {
      console.error(`Error getting lobby ${lobbyId}:`, error);
      return null;
    }
  },
  
  // Update a lobby
  async updateLobby(lobbyId: string, updates: Partial<ILobby>) {
    try {
      await ensureConnection();
      return await Lobby.findOneAndUpdate(
        { id: lobbyId },
        { $set: { ...updates, last_activity: new Date() } },
        { new: true }
      );
    } catch (error) {
      console.error(`Error updating lobby ${lobbyId}:`, error);
      return null;
    }
  },
  
  // Delete a lobby
  async deleteLobby(lobbyId: string) {
    try {
      await ensureConnection();
      return await Lobby.findOneAndDelete({ id: lobbyId });
    } catch (error) {
      console.error(`Error deleting lobby ${lobbyId}:`, error);
      return null;
    }
  }
};

// Message Services
export const messageService = {
  // Get messages for a room
  async getMessages(roomId: string, limit = 100) {
    try {
      await ensureConnection();
      return await Message.find({ room_id: roomId })
        .sort({ timestamp: 1 })
        .limit(limit);
    } catch (error) {
      console.error(`Error getting messages for room ${roomId}:`, error);
      return [];
    }
  },
  
  // Create a new message
  async createMessage(messageData: {
    room_id: string;
    text: string;
    user_id: string;
    username: string;
  }) {
    try {
      await ensureConnection();
      
      const newMessage = new Message({
        id: uuidv4(),
        ...messageData,
        timestamp: new Date()
      });
      
      await newMessage.save();
      return newMessage;
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }
};