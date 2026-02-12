"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDatabase = exports.connectDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dog-sitting';
/**
 * Connect to MongoDB database
 * Creates geospatial indexes for location-based queries
 */
const connectDatabase = async () => {
    try {
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB successfully');
        // Create indexes after connection
        await createIndexes();
    }
    catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};
exports.connectDatabase = connectDatabase;
/**
 * Create database indexes for optimized queries
 */
const createIndexes = async () => {
    try {
        const db = mongoose_1.default.connection.db;
        if (!db)
            return;
        // These indexes will be created automatically by Mongoose schema definitions
        console.log('✅ Database indexes ready');
    }
    catch (error) {
        console.error('Error creating indexes:', error);
    }
};
/**
 * Disconnect from MongoDB
 */
const disconnectDatabase = async () => {
    try {
        await mongoose_1.default.disconnect();
        console.log('📴 Disconnected from MongoDB');
    }
    catch (error) {
        console.error('Error disconnecting from MongoDB:', error);
    }
};
exports.disconnectDatabase = disconnectDatabase;
// Handle connection events
mongoose_1.default.connection.on('disconnected', () => {
    console.log('📴 MongoDB disconnected');
});
mongoose_1.default.connection.on('error', (err) => {
    console.error('MongoDB error:', err);
});
exports.default = exports.connectDatabase;
//# sourceMappingURL=database.js.map