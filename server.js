const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        // IMPORTANT: In production, change '*' to your actual GitHub Pages URL
        // Example: origin: "https://broofnotascammer.github.io"
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 10000;

// Server's Game State (in-memory, not persistent)
// Key: socket.id (unique ID for each connection)
// Value: { id: string, name: string, score: number }
let players = {}; 

/**
 * Generates a sorted array of players for the leaderboard.
 * @returns {Array<Object>} Sorted list of players by score (highest first).
 */
function getLeaderboard() {
    const leaderboard = Object.values(players);
    leaderboard.sort((a, b) => b.score - a.score);
    return leaderboard;
}

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Initialize player if new
    if (!players[socket.id]) {
        players[socket.id] = {
            id: socket.id,
            name: `Player_${socket.id.substring(0, 4)}`, // Default temporary name
            score: 0
        };
    }
    
    // Send current leaderboard to the newly connected client
    socket.emit('leaderboardUpdate', getLeaderboard());

    // When a client clicks the game area
    socket.on('clickPoint', () => {
        if (players[socket.id]) {
            players[socket.id].score += 1; // Increment score
            console.log(`${players[socket.id].name} scored! Total score: ${players[socket.id].score}`);
            // Broadcast the updated leaderboard to all connected clients
            io.emit('leaderboardUpdate', getLeaderboard());
        }
    });

    // When a player sends their name (this is why we kept it from the last update)
    socket.on('setName', (newName) => {
        if (players[socket.id] && typeof newName === 'string' && newName.trim().length > 0) {
            const cleanName = newName.trim().substring(0, 15); // Max 15 chars
            if (players[socket.id].name !== cleanName) { // Only update if name actually changed
                players[socket.id].name = cleanName;
                console.log(`Player ${socket.id} set name to: ${cleanName}`);
                io.emit('leaderboardUpdate', getLeaderboard()); // Broadcast updated leaderboard
            }
        }
    });

    // When a client disconnects
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Remove player from the list when they disconnect
        delete players[socket.id];
        // Broadcast the updated leaderboard to remaining clients
        io.emit('leaderboardUpdate', getLeaderboard());
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
