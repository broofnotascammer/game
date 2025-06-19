// This is your "Whiteboard" code!

// 1. Get the tools we need
const express = require('express');
const http = require('http');
const { Server } = require('socket.io'); // This is the main Socket.IO server tool

// 2. Set up a very basic web server (Socket.IO needs this)
const app = express();
const server = http.createServer(app);

// 3. Create our Socket.IO "Whiteboard" (the real-time part)
const io = new Server(server, {
    cors: {
        // IMPORTANT: In a real app, change '*' to your actual GitHub Pages URL
        // Example: origin: "https://yourusername.github.io"
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

// 4. Tell the server what port (door number) to listen on
// Render will automatically give us a PORT, usually 10000
const PORT = process.env.PORT || 3000; // Use Render's PORT, or 3000 if testing locally

// --- Our Game State (What's on the Whiteboard) ---
let players = {}; // This will store information about all connected players (their ID, position, color)

// 5. What happens when a new player connects to our "Whiteboard"
io.on('connection', (socket) => {
    console.log(`A player connected! Their ID is: ${socket.id}`);

    // Create a new player and give them a random starting spot and color
    players[socket.id] = {
        x: Math.floor(Math.random() * 600), // Random X position (max 600)
        y: Math.floor(Math.random() * 400), // Random Y position (max 400)
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`, // Random hex color
        id: socket.id // Store their unique ID
    };
    
    // Send the new player the current list of all players
    socket.emit('currentPlayers', players);

    // Tell everyone ELSE that a new player has joined
    socket.broadcast.emit('newPlayer', players[socket.id]);

    // 6. What happens when a player moves their dot
    socket.on('playerMovement', (movementData) => {
        // Update this player's position on our "Whiteboard"
        if (players[socket.id]) { // Make sure the player still exists
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            
            // Tell everyone ELSE (except the player who just moved) that this player moved
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    // 7. What happens when a player disconnects
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        // Remove them from our "Whiteboard" list
        delete players[socket.id];
        // Tell everyone ELSE that this player left
        io.emit('playerDisconnected', socket.id);
    });
});

// 8. Start the server (open the "door")
server.listen(PORT, '0.0.0.0', () => { // Listen on 0.0.0.0 so Render can access it
    console.log(`Game server running on http://0.0.0.0:${PORT}`);
});