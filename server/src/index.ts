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
import { NPCManager } from './game/npc';
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
const npcManager = new NPCManager();
const worldManager = new WorldManager(playerManager, npcManager);

// Safe zones - city teleport locations where PvP is disabled
const SAFE_ZONES = [
  { name: 'Paris', lat: 48.8566, lng: 2.3522 },
  { name: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
  { name: 'Berlin', lat: 52.5200, lng: 13.4050 },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { name: 'Dubai', lat: 25.2048, lng: 55.2708 },
  { name: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729 },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'Cairo', lat: 30.0444, lng: 31.2357 },
  { name: 'San Francisco', lat: 37.7749, lng: -122.4194 },
  { name: 'Chicago', lat: 41.8781, lng: -87.6298 },
  { name: 'Miami', lat: 25.7617, lng: -80.1918 },
  { name: 'Toronto', lat: 43.6532, lng: -79.3832 },
  { name: 'Vancouver', lat: 49.2827, lng: -123.1207 },
  { name: 'Mexico City', lat: 19.4326, lng: -99.1332 },
  { name: 'Buenos Aires', lat: -34.6037, lng: -58.3816 },
  { name: 'Rome', lat: 41.9028, lng: 12.4964 },
  { name: 'Madrid', lat: 40.4168, lng: -3.7038 },
  { name: 'Amsterdam', lat: 52.3676, lng: 4.9041 },
  { name: 'Barcelona', lat: 41.3851, lng: 2.1734 },
  { name: 'Vienna', lat: 48.2082, lng: 16.3738 },
  { name: 'Prague', lat: 50.0755, lng: 14.4378 },
  { name: 'Seoul', lat: 37.5665, lng: 126.9780 },
  { name: 'Beijing', lat: 39.9042, lng: 116.4074 },
  { name: 'Shanghai', lat: 31.2304, lng: 121.4737 },
  { name: 'Hong Kong', lat: 22.3193, lng: 114.1694 },
  { name: 'Bangkok', lat: 13.7563, lng: 100.5018 },
  { name: 'Moscow', lat: 55.7558, lng: 37.6173 },
  { name: 'Melbourne', lat: -37.8136, lng: 144.9631 },
  { name: 'Brisbane', lat: -27.4698, lng: 153.0251 },
  { name: 'Auckland', lat: -36.8509, lng: 174.7645 },
  { name: 'Cape Town', lat: -33.9249, lng: 18.4241 },
  { name: 'Lagos', lat: 6.5244, lng: 3.3792 },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
  { name: 'London', lat: 51.5074, lng: -0.1278 },
  { name: 'New York', lat: 40.758896, lng: -73.985130 }
];
const SAFE_ZONE_RADIUS = 0.01; // ~1km radius - large safe zone around each city

// Helper to check if a position is in a safe zone
// Accounts for longitude compression at different latitudes
function isInSafeZone(lat: number, lng: number): string | null {
  for (const zone of SAFE_ZONES) {
    const latDiff = lat - zone.lat;
    // Adjust longitude difference by cosine of average latitude
    const avgLat = (lat + zone.lat) / 2;
    const lngDiff = (lng - zone.lng) * Math.cos(avgLat * Math.PI / 180);
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    if (distance < SAFE_ZONE_RADIUS) {
      return zone.name;
    }
  }
  return null;
}

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

// Socket.io server with Cloud Run-friendly settings
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  // Keep connections alive on Cloud Run
  pingTimeout: 60000,      // 60 seconds before considering connection dead
  pingInterval: 25000,     // Send ping every 25 seconds
  upgradeTimeout: 30000,   // 30 seconds to upgrade connection
  transports: ['websocket', 'polling'], // Prefer WebSocket
  allowUpgrades: true
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

  // Update display name
  socket.on('player:updateName', async (data) => {
    const player = await playerManager.updateUsername(socket.id, data.username);

    if (player) {
      // Broadcast name change to all other players
      socket.broadcast.emit('player:nameUpdated', {
        id: socket.id,
        username: player.username
      });
    }
  });

  // Update equipment (cosmetic items)
  socket.on('player:updateEquipment', async (data) => {
    const player = await playerManager.updateEquipment(socket.id, data.equipment);

    if (player) {
      // Broadcast equipment change to all other players
      socket.broadcast.emit('player:equipmentUpdated', {
        id: socket.id,
        equipment: player.equipment!
      });
    }
  });

  // Set home position
  socket.on('player:setHome', async (data) => {
    const player = await playerManager.updateHomePosition(socket.id, data.position);

    if (player) {
      // Confirm home position was set
      socket.emit('player:homeUpdated', {
        position: player.homePosition!
      });
      console.log(`Player ${player.username} set home to ${data.position.lat.toFixed(4)}, ${data.position.lng.toFixed(4)}`);
    }
  });

  // Combat attack
  socket.on('combat:attack', (data) => {
    const attacker = playerManager.getPlayer(socket.id);
    const target = playerManager.getPlayer(data.targetId);

    if (!attacker || !target) return;

    // Check if attacker is in a safe zone
    const attackerSafeZone = isInSafeZone(attacker.position.lat, attacker.position.lng);
    if (attackerSafeZone) {
      socket.emit('combat:blocked', {
        reason: `You cannot attack from ${attackerSafeZone} safe zone`
      });
      return;
    }

    // Check if target is in a safe zone
    const targetSafeZone = isInSafeZone(target.position.lat, target.position.lng);
    if (targetSafeZone) {
      socket.emit('combat:blocked', {
        reason: `${target.username} is protected in ${targetSafeZone} safe zone`
      });
      return;
    }

    // Notify the target they were attacked
    io.to(data.targetId).emit('combat:attacked', {
      attackerId: socket.id,
      attackerName: attacker.username,
      damage: data.damage,
      itemKey: data.itemKey
    });

    // Notify the attacker their attack hit
    socket.emit('combat:hit', {
      targetId: data.targetId,
      damage: data.damage,
      targetHealth: 0 // Client manages health
    });

    console.log(`Combat: ${attacker.username} attacked ${target.username} for ${data.damage} damage`);
  });

  // Player combat stats update
  socket.on('player:updateCombatStats', (data) => {
    const player = playerManager.getPlayer(socket.id);
    if (player) {
      player.health = data.health;
      player.maxHealth = data.maxHealth;
      player.combatLevel = data.combatLevel;
    }
  });

  // NPC Attack - Server calculates damage and updates NPC health
  socket.on('npc:attack', (data) => {
    const player = playerManager.getPlayer(socket.id);
    if (!player) return;

    const npc = npcManager.getNPC(data.npcId);
    if (!npc) {
      console.log(`NPC attack failed: NPC ${data.npcId} not found`);
      return;
    }

    // Calculate hit based on accuracy (server-side)
    const hitRoll = Math.random() * 100;
    const didHit = hitRoll < data.accuracy;

    // Calculate damage (0 to maxHit if hit, 0 if miss)
    const damage = didHit ? Math.floor(Math.random() * (data.maxHit + 1)) : 0;

    // Apply damage to NPC
    const newHealth = npcManager.damageNPC(data.npcId, damage);

    // Send result to attacker
    socket.emit('npc:attackResult', {
      npcId: data.npcId,
      damage,
      didHit,
      npcHealth: newHealth,
      npcMaxHealth: npc.maxHealth
    });

    // Broadcast NPC health to all nearby players
    io.emit('npc:healthUpdate', {
      npcId: data.npcId,
      health: newHealth,
      maxHealth: npc.maxHealth
    });

    // Check if NPC is defeated
    if (newHealth <= 0) {
      // Calculate drops
      const drops: string[] = [];
      if (npc.drops && npc.drops.length > 0 && npc.dropChance) {
        if (Math.random() < npc.dropChance) {
          // Random drop from available drops
          const randomDrop = npc.drops[Math.floor(Math.random() * npc.drops.length)];
          drops.push(randomDrop);
        }
      }

      socket.emit('npc:defeated', {
        npcId: data.npcId,
        npcName: npc.name,
        drops
      });

      console.log(`NPC ${npc.name} defeated by ${player.username}! Drops: ${drops.join(', ') || 'none'}`);

      // Respawn NPC after delay
      const respawnTime = npc.isTraining ? 30000 : (npc.isBattleOnly ? 60000 : 120000);
      setTimeout(() => {
        npcManager.resetNPCHealth(data.npcId);
        io.emit('npc:respawned', { npcId: data.npcId });
        io.emit('npc:healthUpdate', {
          npcId: data.npcId,
          health: npc.maxHealth,
          maxHealth: npc.maxHealth
        });
        console.log(`NPC ${npc.name} respawned`);
      }, respawnTime);
    }
  });

  // PvP Attack - Server calculates damage and manages health
  socket.on('pvp:attack', (data) => {
    const attacker = playerManager.getPlayer(socket.id);
    const target = playerManager.getPlayer(data.targetId);

    if (!attacker || !target) return;

    // Check safe zones
    const attackerSafeZone = isInSafeZone(attacker.position.lat, attacker.position.lng);
    if (attackerSafeZone) {
      socket.emit('combat:blocked', { reason: `You cannot attack from ${attackerSafeZone} safe zone` });
      return;
    }

    const targetSafeZone = isInSafeZone(target.position.lat, target.position.lng);
    if (targetSafeZone) {
      socket.emit('combat:blocked', { reason: `${target.username} is protected in ${targetSafeZone} safe zone` });
      return;
    }

    // Calculate hit based on accuracy (server-side)
    const hitRoll = Math.random() * 100;
    const didHit = hitRoll < data.accuracy;

    // Calculate damage
    const damage = didHit ? Math.floor(Math.random() * (data.maxHit + 1)) : 0;

    // Apply damage to target
    const targetHealth = Math.max(0, (target.health || 100) - damage);
    target.health = targetHealth;
    const targetMaxHealth = target.maxHealth || 100;

    // Send result to attacker
    socket.emit('pvp:attackResult', {
      targetId: data.targetId,
      damage,
      didHit,
      targetHealth,
      targetMaxHealth
    });

    // Notify target they were damaged
    io.to(data.targetId).emit('pvp:damaged', {
      attackerId: socket.id,
      attackerName: attacker.username,
      damage,
      health: targetHealth,
      maxHealth: targetMaxHealth
    });

    // Broadcast combat effect to ALL players so they can see the fight
    io.emit('pvp:combatEffect', {
      attackerId: socket.id,
      attackerName: attacker.username,
      targetId: data.targetId,
      targetName: target.username,
      itemKey: data.itemKey,
      damage,
      didHit
    });

    // Broadcast health update
    io.emit('player:healthUpdated', {
      id: data.targetId,
      health: targetHealth,
      maxHealth: targetMaxHealth
    });

    // Check if target is defeated
    if (targetHealth <= 0) {
      io.to(data.targetId).emit('pvp:defeated', {
        killerId: socket.id,
        killerName: attacker.username
      });

      // Reset target health after short delay (respawn)
      setTimeout(() => {
        target.health = target.maxHealth || 100;
        io.emit('player:healthUpdated', {
          id: data.targetId,
          health: target.health,
          maxHealth: target.maxHealth || 100
        });
      }, 5000);

      console.log(`PvP: ${attacker.username} defeated ${target.username}!`);
    } else {
      console.log(`PvP: ${attacker.username} hit ${target.username} for ${damage} damage (${targetHealth}/${targetMaxHealth} HP)`);
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
  console.log(`Geommo server running on port ${PORT}`);
});
