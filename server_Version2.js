const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*", // Set to your frontend origin in production
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Leaderboard state: { socketId: { name?: string, score: number } }
let leaderboard = {};

function getSortedLeaderboard() {
    // Return an array of { id, score } sorted by score descending
    return Object.entries(leaderboard)
        .map(([id, data]) => ({ id, score: data.score }))
        .sort((a, b) => b.score - a.score);
}

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    // Initialize user score
    leaderboard[socket.id] = { score: 0 };

    // Send current leaderboard to this user
    socket.emit('leaderboardUpdate', getSortedLeaderboard());

    // Broadcast new user to all clients
    io.emit('leaderboardUpdate', getSortedLeaderboard());

    // Handle click event
    socket.on('clickPoint', () => {
        if (leaderboard[socket.id]) {
            leaderboard[socket.id].score += 1;
            // Send updated leaderboard to all clients
            io.emit('leaderboardUpdate', getSortedLeaderboard());
        }
    });

    // Optionally handle resetting scores (if you want this feature)
    socket.on('resetScore', () => {
        if (leaderboard[socket.id]) {
            leaderboard[socket.id].score = 0;
            io.emit('leaderboardUpdate', getSortedLeaderboard());
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        delete leaderboard[socket.id];
        io.emit('leaderboardUpdate', getSortedLeaderboard());
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Leaderboard server running on http://0.0.0.0:${PORT}`);
});