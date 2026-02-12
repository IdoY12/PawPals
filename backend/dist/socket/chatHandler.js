"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOnlineUserIds = exports.isUserOnline = exports.getSocketIdForUser = exports.initializeChatHandler = void 0;
const jwt_1 = require("../utils/jwt");
const Message_1 = require("../models/Message");
const User_1 = require("../models/User");
const mongoose_1 = __importDefault(require("mongoose"));
// Online users map (userId -> socketId)
const onlineUsers = new Map();
/**
 * Initialize Socket.io chat handler
 */
const initializeChatHandler = (io) => {
    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication required'));
            }
            const user = await (0, jwt_1.verifyToken)(token);
            if (!user) {
                return next(new Error('Invalid token'));
            }
            socket.user = user;
            next();
        }
        catch (error) {
            next(new Error('Authentication failed'));
        }
    });
    // Connection handler
    io.on('connection', (socket) => {
        const user = socket.user;
        console.log(`User connected: ${user.name} (${user._id})`);
        // Add user to online users
        onlineUsers.set(user._id.toString(), socket.id);
        // Join user's personal room for direct messages
        socket.join(`user:${user._id}`);
        // Broadcast user online status
        socket.broadcast.emit('user:online', {
            userId: user._id.toString(),
            name: user.name,
        });
        // Send list of online users to the connected user
        socket.emit('users:online', Array.from(onlineUsers.keys()));
        // Handle joining a conversation
        socket.on('conversation:join', (conversationId) => {
            socket.join(`conversation:${conversationId}`);
            console.log(`User ${user.name} joined conversation: ${conversationId}`);
        });
        // Handle leaving a conversation
        socket.on('conversation:leave', (conversationId) => {
            socket.leave(`conversation:${conversationId}`);
            console.log(`User ${user.name} left conversation: ${conversationId}`);
        });
        // Handle sending a message
        socket.on('message:send', async (data) => {
            try {
                const { receiverId, content } = data;
                if (!content.trim()) {
                    socket.emit('error', { message: 'Message content cannot be empty' });
                    return;
                }
                // Generate conversation ID
                const sortedIds = [user._id.toString(), receiverId].sort();
                const conversationId = sortedIds.join('_');
                // Create and save message
                const message = new Message_1.Message({
                    senderId: user._id,
                    receiverId: new mongoose_1.default.Types.ObjectId(receiverId),
                    conversationId,
                    content: content.trim(),
                    isRead: false,
                });
                await message.save();
                // Populate sender info
                const populatedMessage = {
                    id: message._id.toString(),
                    senderId: message.senderId.toString(),
                    receiverId: message.receiverId.toString(),
                    conversationId: message.conversationId,
                    content: message.content,
                    isRead: message.isRead,
                    createdAt: message.createdAt.toISOString(),
                    sender: {
                        id: user._id.toString(),
                        name: user.name,
                        profilePicture: user.profilePicture,
                    },
                };
                // Emit to conversation room
                io.to(`conversation:${conversationId}`).emit('message:new', populatedMessage);
                // Emit to receiver's personal room (for notifications)
                io.to(`user:${receiverId}`).emit('message:received', populatedMessage);
                // Confirm message sent to sender
                socket.emit('message:sent', populatedMessage);
            }
            catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });
        // Handle typing indicator
        socket.on('typing:start', (data) => {
            socket.to(`conversation:${data.conversationId}`).emit('typing:started', {
                userId: user._id.toString(),
                name: user.name,
            });
        });
        socket.on('typing:stop', (data) => {
            socket.to(`conversation:${data.conversationId}`).emit('typing:stopped', {
                userId: user._id.toString(),
            });
        });
        // Handle marking messages as read
        socket.on('messages:read', async (data) => {
            try {
                await Message_1.Message.updateMany({
                    conversationId: data.conversationId,
                    receiverId: user._id,
                    isRead: false,
                }, {
                    $set: {
                        isRead: true,
                        readAt: new Date(),
                    },
                });
                // Notify other participants
                socket.to(`conversation:${data.conversationId}`).emit('messages:marked-read', {
                    conversationId: data.conversationId,
                    userId: user._id.toString(),
                });
            }
            catch (error) {
                console.error('Error marking messages as read:', error);
            }
        });
        // Handle location update (for map markers)
        socket.on('location:update', async (data) => {
            try {
                await User_1.User.findByIdAndUpdate(user._id, {
                    $set: {
                        'location.coordinates': [data.longitude, data.latitude],
                    },
                });
                // Broadcast location update to nearby users
                socket.broadcast.emit('user:location-updated', {
                    userId: user._id.toString(),
                    location: {
                        coordinates: [data.longitude, data.latitude],
                    },
                });
            }
            catch (error) {
                console.error('Error updating location:', error);
            }
        });
        // Handle availability toggle (for sitters)
        socket.on('availability:toggle', async (data) => {
            try {
                await User_1.User.findByIdAndUpdate(user._id, {
                    $set: {
                        isAvailable: data.isAvailable,
                        ...(data.message && { availabilityMessage: data.message }),
                    },
                });
                // Broadcast availability change
                socket.broadcast.emit('user:availability-changed', {
                    userId: user._id.toString(),
                    isAvailable: data.isAvailable,
                    message: data.message,
                });
            }
            catch (error) {
                console.error('Error toggling availability:', error);
            }
        });
        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${user.name} (${user._id})`);
            // Remove from online users
            onlineUsers.delete(user._id.toString());
            // Broadcast user offline status
            socket.broadcast.emit('user:offline', {
                userId: user._id.toString(),
            });
        });
    });
};
exports.initializeChatHandler = initializeChatHandler;
/**
 * Get socket ID for a user
 */
const getSocketIdForUser = (userId) => {
    return onlineUsers.get(userId);
};
exports.getSocketIdForUser = getSocketIdForUser;
/**
 * Check if user is online
 */
const isUserOnline = (userId) => {
    return onlineUsers.has(userId);
};
exports.isUserOnline = isUserOnline;
/**
 * Get all online user IDs
 */
const getOnlineUserIds = () => {
    return Array.from(onlineUsers.keys());
};
exports.getOnlineUserIds = getOnlineUserIds;
exports.default = exports.initializeChatHandler;
//# sourceMappingURL=chatHandler.js.map