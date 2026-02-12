import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import { Message } from '../models/Message';
import { User, IUser } from '../models/User';
import mongoose from 'mongoose';

// Socket with authenticated user
interface AuthenticatedSocket extends Socket {
  user?: IUser;
}

// Online users map (userId -> socketId)
const onlineUsers = new Map<string, string>();

/**
 * Initialize Socket.io chat handler
 */
export const initializeChatHandler = (io: Server): void => {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const user = await verifyToken(token);
      
      if (!user) {
        return next(new Error('Invalid token'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    const user = socket.user!;
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
    socket.on('conversation:join', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${user.name} joined conversation: ${conversationId}`);
    });

    // Handle leaving a conversation
    socket.on('conversation:leave', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${user.name} left conversation: ${conversationId}`);
    });

    // Handle sending a message
    socket.on('message:send', async (data: { receiverId: string; content: string }) => {
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
        const message = new Message({
          senderId: user._id,
          receiverId: new mongoose.Types.ObjectId(receiverId),
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
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('typing:start', (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('typing:started', {
        userId: user._id.toString(),
        name: user.name,
      });
    });

    socket.on('typing:stop', (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('typing:stopped', {
        userId: user._id.toString(),
      });
    });

    // Handle marking messages as read
    socket.on('messages:read', async (data: { conversationId: string }) => {
      try {
        await Message.updateMany(
          {
            conversationId: data.conversationId,
            receiverId: user._id,
            isRead: false,
          },
          {
            $set: {
              isRead: true,
              readAt: new Date(),
            },
          }
        );

        // Notify other participants
        socket.to(`conversation:${data.conversationId}`).emit('messages:marked-read', {
          conversationId: data.conversationId,
          userId: user._id.toString(),
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle location update (for map markers)
    socket.on('location:update', async (data: { longitude: number; latitude: number }) => {
      try {
        await User.findByIdAndUpdate(user._id, {
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
      } catch (error) {
        console.error('Error updating location:', error);
      }
    });

    // Handle availability toggle (for sitters)
    socket.on('availability:toggle', async (data: { isAvailable: boolean; message?: string }) => {
      try {
        await User.findByIdAndUpdate(user._id, {
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
      } catch (error) {
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

/**
 * Get socket ID for a user
 */
export const getSocketIdForUser = (userId: string): string | undefined => {
  return onlineUsers.get(userId);
};

/**
 * Check if user is online
 */
export const isUserOnline = (userId: string): boolean => {
  return onlineUsers.has(userId);
};

/**
 * Get all online user IDs
 */
export const getOnlineUserIds = (): string[] => {
  return Array.from(onlineUsers.keys());
};

export default initializeChatHandler;
