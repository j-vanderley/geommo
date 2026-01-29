import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Firestore } from '@google-cloud/firestore';
import * as admin from 'firebase-admin';
import path from 'path';

import { PlayerManager } from './game/player';
import { ChatManager } from './game/chat';
import { WorldManager } from './game/world';
import { ClientToServerEvents, ServerToClientEvents } from './types';

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

// Initialize Firestore
const db = new Firestore();

// Initialize managers
const playerManager = new PlayerManager(db);
const chatManager = new ChatManager(playerManager);
const worldManager = new WorldManager(playerManager);

// Express app
const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from client directory
// In production (Docker): /app/client, in dev: ../../client
const clientPath = process.env.NODE_ENV === 'production'
  ? path.join(__dirname, '../../client')
  : path.join(__dirname, '../../client');
app.use(express.static(clientPath));

// Health check endpoint for Cloud Run
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', players: playerManager.getAllPlayers().length });
});

// Create HTTP server
const httpServer = createServer(app);

// Socket.io server
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Authentication
  socket.on('player:authenticate', async (data) => {
    try {
      let odId: string;
      let username: string;

      if (data.authType === 'wallet') {
        // Wallet-based authentication (Phantom)
        if (!data.walletAddress) {
          socket.emit('auth:error', { message: 'Wallet address required' });
          return;
        }
        odId = data.walletAddress;
        username = data.username || `${data.walletAddress.slice(0, 4)}...${data.walletAddress.slice(-4)}`;
      } else {
        // Firebase token authentication
        if (!data.token) {
          socket.emit('auth:error', { message: 'Token required' });
          return;
        }
        const decodedToken = await admin.auth().verifyIdToken(data.token);
        odId = decodedToken.uid;
        username = decodedToken.name || decodedToken.email || `Player_${odId.slice(0, 6)}`;
      }

      // Check for existing connection with same odId (prevents duplicates on reconnect)
      const existingSocketId = playerManager.findExistingConnection(odId, socket.id);
      if (existingSocketId) {
        console.log(`Removing duplicate connection for ${odId}: ${existingSocketId}`);
        playerManager.removePlayer(existingSocketId);
        // Notify all clients to remove the old player
        io.emit('player:left', { id: existingSocketId });
      }

      // Add player to the game
      const player = await playerManager.addPlayer(socket.id, odId, username, data.flag, data.avatar);

      // Send success response
      socket.emit('auth:success', { player });

      // Send current world state to the new player
      socket.emit('world:state', worldManager.getWorldState());

      // Broadcast new player to all other players
      socket.broadcast.emit('player:joined', player);

      console.log(`Player authenticated: ${username} (${odId}) via ${data.authType}`);
    } catch (error) {
      console.error('Authentication error:', error);
      socket.emit('auth:error', { message: 'Authentication failed' });
    }
  });

  // Player movement
  socket.on('player:move', async (data) => {
    const player = await playerManager.updatePosition(socket.id, {
      lat: data.lat,
      lng: data.lng
    });

    if (player) {
      // Broadcast position to all other players
      socket.broadcast.emit('player:moved', {
        id: socket.id,
        position: player.position
      });
    }
  });

  // Update flag (legacy)
  socket.on('player:updateFlag', async (data) => {
    const player = await playerManager.updateFlag(socket.id, data.flag);

    if (player) {
      // Broadcast flag change to all other players
      socket.broadcast.emit('player:flagUpdated', {
        id: socket.id,
        flag: player.flag
      });
    }
  });

  // Update avatar
  socket.on('player:updateAvatar', async (data) => {
    const player = await playerManager.updateAvatar(socket.id, data.avatar);

    if (player) {
      // Broadcast avatar change to all other players
      socket.broadcast.emit('player:avatarUpdated', {
        id: socket.id,
        avatar: player.avatar!
      });
    }
  });

  // Chat messages
  socket.on('chat:send', (data) => {
    const player = playerManager.getPlayer(socket.id);
    if (!player) return;

    const message = chatManager.createMessage(
      socket.id,
      player.username,
      data.message,
      data.type,
      player.position
    );

    // Get recipients based on message type
    const recipients = chatManager.getRecipients(message);

    // Send to all recipients
    recipients.forEach(recipientId => {
      io.to(recipientId).emit('chat:message', message);
    });
  });

  // Disconnection
  socket.on('disconnect', () => {
    const player = playerManager.removePlayer(socket.id);
    if (player) {
      // Broadcast player leaving to all other players
      socket.broadcast.emit('player:left', { id: socket.id });
      console.log(`Player disconnected: ${player.username}`);
    }
  });
});

// Start server
const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
  console.log(`GeoMMO server running on port ${PORT}`);
});
