import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dog-sitting';

/**
 * Connect to MongoDB database
 * Creates geospatial indexes for location-based queries
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');
    
    // Create indexes after connection
    await createIndexes();
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

/**
 * Create database indexes for optimized queries
 */
const createIndexes = async (): Promise<void> => {
  try {
    const db = mongoose.connection.db;
    if (!db) return;

    // These indexes will be created automatically by Mongoose schema definitions
    console.log('✅ Database indexes ready');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
};

/**
 * Disconnect from MongoDB
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('📴 Disconnected from MongoDB');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('📴 MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err);
});

export default connectDatabase;
