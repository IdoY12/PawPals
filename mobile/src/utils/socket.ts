import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:4000';

let socket: Socket | null = null;
let connectionErrorLogged = false;

/**
 * Initialize socket connection with authentication.
 * Failures are handled silently so the app stays usable without a backend.
 */
export const initializeSocket = async (): Promise<Socket> => {
  if (socket?.connected) {
    return socket;
  }

  const token = await AsyncStorage.getItem('@dog_sitting_token');

  socket = io(API_URL, {
    auth: {
      token,
    },
    transports: ['websocket'],
    timeout: 8000,
    reconnection: true,
    reconnectionAttempts: 3,
    reconnectionDelay: 3000,
    reconnectionDelayMax: 10000,
  });

  socket.on('connect', () => {
    connectionErrorLogged = false; // reset so we log again if it drops later
    if (__DEV__) console.log('Socket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    if (__DEV__) console.log('Socket disconnected:', reason);
  });

  // Only log the first connection error; suppress subsequent ones to
  // avoid spamming red error toasts while the backend is offline.
  socket.on('connect_error', (_error) => {
    if (!connectionErrorLogged) {
      connectionErrorLogged = true;
      if (__DEV__) console.log('Socket: backend unreachable – chat will reconnect automatically.');
    }
  });

  return socket;
};

/**
 * Get existing socket instance
 */
export const getSocket = (): Socket | null => {
  return socket;
};

/**
 * Disconnect socket
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Join a conversation room
 */
export const joinConversation = (conversationId: string): void => {
  if (socket?.connected) {
    socket.emit('conversation:join', conversationId);
  }
};

/**
 * Leave a conversation room
 */
export const leaveConversation = (conversationId: string): void => {
  if (socket?.connected) {
    socket.emit('conversation:leave', conversationId);
  }
};

/**
 * Send a message via socket
 */
export const sendMessage = (receiverId: string, content: string): void => {
  if (socket?.connected) {
    socket.emit('message:send', { receiverId, content });
  }
};

/**
 * Start typing indicator
 */
export const startTyping = (conversationId: string): void => {
  if (socket?.connected) {
    socket.emit('typing:start', { conversationId });
  }
};

/**
 * Stop typing indicator
 */
export const stopTyping = (conversationId: string): void => {
  if (socket?.connected) {
    socket.emit('typing:stop', { conversationId });
  }
};

/**
 * Mark messages as read
 */
export const markMessagesRead = (conversationId: string): void => {
  if (socket?.connected) {
    socket.emit('messages:read', { conversationId });
  }
};

/**
 * Update user location
 */
export const updateLocation = (longitude: number, latitude: number): void => {
  if (socket?.connected) {
    socket.emit('location:update', { longitude, latitude });
  }
};

/**
 * Toggle availability (for sitters)
 */
export const toggleAvailability = (isAvailable: boolean, message?: string): void => {
  if (socket?.connected) {
    socket.emit('availability:toggle', { isAvailable, message });
  }
};

export default {
  initializeSocket,
  getSocket,
  disconnectSocket,
  joinConversation,
  leaveConversation,
  sendMessage,
  startTyping,
  stopTyping,
  markMessagesRead,
  updateLocation,
  toggleAvailability,
};
