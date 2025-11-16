import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { initializeSocket } from './sockets/notification.socket.js';

const PORT = process.env.PORT || 8000; // Backend port (Frontend is 3000)

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.IO with CORS
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Initialize notification socket handler
initializeSocket(io);

// Socket.IO connection handler
io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    // Handle user joining specific room based on role and ID
    socket.on('join', (data) => {
        const { userId, userType, qrSessionId } = data;

        // CUSTOMER join với qrSessionId
        if (userType === 'CUSTOMER' && qrSessionId) {
            const room = `QR_SESSION_${qrSessionId}`;
            socket.join(room);
            console.log(`👤 Customer joined room: ${room} (socket: ${socket.id})`);

            // Also join the general CUSTOMER room
            socket.join('CUSTOMER');
            console.log(`👥 Customer also joined general room: CUSTOMER`);
        }
        // STAFF/ADMIN join với userId
        else if (userId && userType) {
            const room = `${userType}_${userId}`;
            socket.join(room);
            console.log(`👤 User ${userId} (${userType}) joined room: ${room}`);

            // Also join the general type room (e.g., all STAFF)
            socket.join(userType);
            console.log(`👥 User ${userId} also joined general room: ${userType}`);
        }
    });

    // Handle leaving room
    socket.on('leave', (data) => {
        const { userId, userType, qrSessionId } = data;

        // CUSTOMER leave với qrSessionId
        if (userType === 'CUSTOMER' && qrSessionId) {
            const room = `QR_SESSION_${qrSessionId}`;
            socket.leave(room);
            socket.leave('CUSTOMER');
            console.log(`👋 Customer left rooms: ${room}, CUSTOMER`);
        }
        // STAFF/ADMIN leave với userId
        else if (userId && userType) {
            const room = `${userType}_${userId}`;
            socket.leave(room);
            socket.leave(userType);
            console.log(`👋 User ${userId} left rooms: ${room}, ${userType}`);
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
    });
});

// Export io for use in other modules
export { io };

// Start server
server.listen(PORT, () => {
    const serverUrl = process.env.BACKEND_URL || `http://localhost:${PORT}`;
    console.log(`🚀 Server running on ${serverUrl}`);
    console.log(`🔌 Socket.IO ready for connections`);
});
