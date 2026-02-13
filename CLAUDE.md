# GeoMMO

A Google Maps-based MMO with OSRS-inspired UI. Players move on real Google Maps, fight NPCs/PvP, chat, and level up skills.

## Architecture

```
geommo/
├── server/src/           # Node.js/TypeScript backend
│   ├── index.ts          # Express + Socket.io server, all event handlers (~614 lines)
│   ├── game/
│   │   ├── player.ts     # PlayerManager - in-memory Map<socketId, Player>, persists to Firestore
│   │   ├── npc.ts        # NPCManager - boss/battle/training NPCs at major cities
│   │   ├── world.ts      # WorldManager - aggregates players + NPCs for world state
│   │   └── chat.ts       # ChatManager - global + local (100m radius) chat
│   └── types/index.ts    # All shared TypeScript interfaces
├── client/               # Vanilla HTML/CSS/JS frontend (no framework)
│   ├── index.html        # Main page, loads Google Maps + Firebase SDKs
│   ├── css/game.css      # OSRS-style dark UI theme
│   └── js/
│       ├── main.js       # Core game loop, Socket.io client, combat, UI (~1539 lines)
│       ├── config.js     # Firebase config, city data, game settings, UI themes
│       ├── map.js        # Google Maps setup and tile rendering
│       ├── camera.js     # 3D camera management
│       ├── player.js     # Client-side player rendering
│       ├── chat.js       # Chat UI
│       ├── skills.js     # Skill system (HP, combat levels)
│       ├── tiles.js      # Map tile rendering
│       └── weather.js    # Weather effects
├── Dockerfile            # Multi-stage build: node:20-alpine, builds TS then runs dist/
└── cloudbuild.yaml       # GCB: docker build -> push to GCR -> deploy to Cloud Run
```

## GCP Setup

- **Project:** `gamenana` (this is the active one, NOT `geommo-gamenana`)
- **Cloud Run:** service `geommo` at `https://geommo-snhc3k22za-uc.a.run.app`
  - Region: us-central1, min-instances: 1, max: 10, 512Mi/1CPU, session affinity enabled
- **Firestore:** Native mode, us-central1, database `(default)`
  - Collection: `players` (keyed by odId/Firebase UID)
  - Fields: username, position, homePosition, flag, avatar, equipment, lastSeen
- **Firebase Auth:** Google Sign-In + Phantom wallet auth
- **Firebase project:** `gamenana` (authDomain: gamenana.firebaseapp.com)

## Dev Commands

```bash
cd server
npm install          # Install deps
npm run dev          # Local dev with hot reload (ts-node-dev, port 8080)
npm run build        # Compile TypeScript to dist/
npm start            # Run compiled server

# Deploy to Cloud Run (from repo root)
gcloud builds submit --config=cloudbuild.yaml --project=gamenana
```

Open `http://localhost:8080` for local testing. Client is served as static files by Express.

## Real-time Communication

All multiplayer is via Socket.io. Events are typed in `server/src/types/index.ts`:
- **ClientToServerEvents** and **ServerToClientEvents** define all socket events
- Key patterns: `player:*`, `chat:*`, `npc:*`, `pvp:*`, `combat:*`
- Server broadcasts to all via `io.emit()`, to others via `socket.broadcast.emit()`, to specific players via `io.to(socketId).emit()`

## Game Systems

### NPCs (server/src/game/npc.ts)
- **4 Boss NPCs:** Glacius (Sydney), Voltarus (Tokyo), Nyx (London), Solara (New York) - high HP, sell auras
- **6 Battle NPC types:** Shadow Imp, Ember Sprite, Moss Golem, Crystal Wisp, Dust Devil, Frost Minion - mid-tier, drop items
- **5 Training NPC types:** Slime, Giant Rat, Fire Beetle, Cave Bat, Giant Spider - weak, for beginners
- NPCs spawn at offset positions from major cities. Respawn timers: training 30s, battle 60s, boss 120s

### PvP Combat (server/src/index.ts)
- Server-side hit calculation (accuracy roll + random damage)
- Safe zones (~1km radius) around all 35 major cities prevent PvP
- Death drops: recent attackers (60s window) receive item drops
- Health broadcast to all players, combat effects visible to spectators

### Auth
- Firebase token verification (`admin.auth().verifyIdToken`)
- Phantom wallet auth (walletAddress as odId)
- Duplicate connection detection (same odId, different socket)

## Key Conventions

- Server state is in-memory (Maps), persisted to Firestore on changes
- Client is vanilla JS (no build step), loaded via `<script>` tags
- All positions are `{ lat: number, lng: number }`
- Player IDs are socket IDs in-game, `odId` (Firebase UID or wallet address) for persistence
- The `clientPath` in index.ts resolves to `../../client` relative to dist/ (same path dev and prod since Dockerfile copies client to /app/client)

## Current State (as of Feb 2025)

Most recent work was on PvP combat:
- Auto-battle system, server-side damage calculation
- Death broadcasts, item drops for attackers
- Player health bars visible to all
- Hit effects, combat animations
- Safe zone enforcement

The game has: movement, chat (global/local), NPC combat, PvP, skills, equipment/cosmetics, fast travel to 35+ cities, weather, home system, UI themes (5 themes), minimap, 3D view.
