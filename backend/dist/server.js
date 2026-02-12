"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const express4_1 = require("@apollo/server/express4");
const database_1 = require("./config/database");
const apollo_1 = require("./config/apollo");
const auth_1 = require("./middleware/auth");
const upload_1 = require("./middleware/upload");
const chatHandler_1 = require("./socket/chatHandler");
// Load environment variables
dotenv_1.default.config();
const PORT = process.env.PORT || 4000;
async function startServer() {
    // Create Express app
    const app = (0, express_1.default)();
    // Create HTTP server
    const httpServer = http_1.default.createServer(app);
    // Initialize Socket.io
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || '*',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });
    // Initialize chat handler
    (0, chatHandler_1.initializeChatHandler)(io);
    // Connect to database
    await (0, database_1.connectDatabase)();
    // Create Apollo Server
    const { server } = await (0, apollo_1.createApolloServer)(httpServer);
    // Middleware
    app.use((0, cors_1.default)({
        origin: process.env.FRONTEND_URL || '*',
        credentials: true,
    }));
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true }));
    // Serve uploaded files
    app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    // File upload endpoints
    app.post('/upload/profile', auth_1.authMiddleware, (req, res) => {
        (0, upload_1.uploadProfilePicture)(req, res, (err) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            const fileUrl = (0, upload_1.getFileUrl)(req.file.filename, baseUrl);
            res.json({ url: fileUrl, filename: req.file.filename });
        });
    });
    app.post('/upload/dog', auth_1.authMiddleware, (req, res) => {
        (0, upload_1.uploadDogPhoto)(req, res, (err) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            const fileUrl = (0, upload_1.getFileUrl)(req.file.filename, baseUrl);
            res.json({ url: fileUrl, filename: req.file.filename });
        });
    });
    // GraphQL endpoint
    app.use('/graphql', express_1.default.json(), (0, express4_1.expressMiddleware)(server, {
        context: apollo_1.createContext,
    }));
    // Start server
    httpServer.listen(PORT, () => {
        console.log(`
🚀 Server ready!
   
📍 GraphQL:    http://localhost:${PORT}/graphql
📍 WebSocket:  ws://localhost:${PORT}/graphql
📍 Health:     http://localhost:${PORT}/health
📍 Uploads:    http://localhost:${PORT}/uploads

🐕 Dog Sitting Platform Backend is running!
    `);
    });
}
// Start the server
startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
//# sourceMappingURL=server.js.map