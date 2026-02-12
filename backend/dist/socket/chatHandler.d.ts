import { Server } from 'socket.io';
/**
 * Initialize Socket.io chat handler
 */
export declare const initializeChatHandler: (io: Server) => void;
/**
 * Get socket ID for a user
 */
export declare const getSocketIdForUser: (userId: string) => string | undefined;
/**
 * Check if user is online
 */
export declare const isUserOnline: (userId: string) => boolean;
/**
 * Get all online user IDs
 */
export declare const getOnlineUserIds: () => string[];
export default initializeChatHandler;
//# sourceMappingURL=chatHandler.d.ts.map