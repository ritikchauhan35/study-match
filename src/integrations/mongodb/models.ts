import mongoose, { Schema, Document } from 'mongoose';
import { connectMongoose } from './client';

// Define interfaces for our document types
export interface ILobby extends Document {
  id: string;
  created_at: Date;
  subjects: string[];
  user_count: number;
  last_activity: Date;
  is_full: boolean;
}

export interface IMessage extends Document {
  id: string;
  room_id: string;
  text: string;
  user_id: string;
  username: string;
  timestamp: Date;
}

// Define schemas
const lobbySchema = new Schema<ILobby>({
  id: { type: String, required: true, unique: true },
  created_at: { type: Date, default: Date.now },
  subjects: [{ type: String, required: true }],
  user_count: { type: Number, default: 1 },
  last_activity: { type: Date, default: Date.now },
  is_full: { type: Boolean, default: false }
});

const messageSchema = new Schema<IMessage>({
  id: { type: String, required: true, unique: true },
  room_id: { type: String, required: true },
  text: { type: String, required: true },
  user_id: { type: String, required: true },
  username: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

// Ensure mongoose is connected before creating models
connectMongoose().catch(err => console.error('Failed to connect to MongoDB:', err));

// Create models - use a function to ensure models are created after connection
let _Lobby: mongoose.Model<ILobby>;
let _Message: mongoose.Model<IMessage>;

export const getModels = () => {
  if (!_Lobby) {
    _Lobby = mongoose.models.Lobby || mongoose.model<ILobby>('Lobby', lobbySchema);
  }
  if (!_Message) {
    _Message = mongoose.models.Message || mongoose.model<IMessage>('Message', messageSchema);
  }
  return { Lobby: _Lobby, Message: _Message };
};

// For backward compatibility
export const Lobby = mongoose.models.Lobby || mongoose.model<ILobby>('Lobby', lobbySchema);
export const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', messageSchema);