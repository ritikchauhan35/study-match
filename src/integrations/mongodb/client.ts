import { MongoClient, ServerApiVersion } from 'mongodb';
import mongoose from 'mongoose';
import { generateUserId, getUserId } from '../user/userUtils';

// MongoDB connection string from environment variable
const MONGODB_URI = import.meta.env.VITE_MONGODB_URI || "mongodb://localhost:27017/study_buddy";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Connect to MongoDB
export const connectToMongoDB = async () => {
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas");
    return client;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
};

// Connect to MongoDB using Mongoose (for schema-based operations)
export const connectMongoose = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB with Mongoose");
  } catch (error) {
    console.error("Error connecting to MongoDB with Mongoose:", error);
    throw error;
  }
};

// Get the MongoDB database instance
export const getDb = () => {
  return client.db("study_buddy");
};

// Close the MongoDB connection
export const closeMongoDB = async () => {
  await client.close();
  console.log("MongoDB connection closed");
};

// Export the MongoDB client for direct use if needed
export { client as mongoClient };