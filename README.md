# GeoMMO - Google Maps MMO Game

A simple chatroom-style MMO where players move around on Google Maps and chat, with OSRS-inspired interface.

## Tech Stack

- **Backend:** Node.js/TypeScript with Socket.io
- **Frontend:** HTML/CSS/JavaScript with Google Maps API
- **Database:** Firestore
- **Auth:** Firebase Authentication (Google Sign-In)
- **Hosting:** Cloud Run

## Setup

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing GCP project
3. Enable Authentication > Sign-in method > Google
4. Get your Firebase config from Project Settings > General > Your apps > Web app

### 2. Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Maps JavaScript API
3. Create an API key with appropriate restrictions

### 3. Configure the Client

Edit `client/js/config.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  // ... other config
};
```

Edit `client/index.html` and replace `YOUR_API_KEY` with your Google Maps API key.

### 4. Local Development

```bash
cd server
npm install
npm run dev
```

Open `http://localhost:8080` in multiple browser tabs to test multiplayer.

### 5. Deploy to Cloud Run

```bash
# Build and deploy
gcloud builds submit --config=cloudbuild.yaml

# Or manually:
cd server
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/geommo
gcloud run deploy geommo --image gcr.io/YOUR_PROJECT_ID/geommo --platform managed --allow-unauthenticated --min-instances 1
```

## Features

- **Google Maps Integration:** Full-screen map as game world
- **Click-to-Move:** Click anywhere to move your character
- **Global Chat:** Chat visible to all players
- **Local Chat:** Chat visible within 100m radius
- **OSRS-Style UI:** Dark themed interface with chat box, minimap, player list
- **Real-time Multiplayer:** See other players move in real-time
- **Persistent Positions:** Player positions saved in Firestore

## Project Structure

```
geommo/
├── server/
│   ├── src/
│   │   ├── index.ts          # Main server entry
│   │   ├── game/
│   │   │   ├── player.ts     # Player management
│   │   │   ├── world.ts      # World state
│   │   │   └── chat.ts       # Chat system
│   │   └── types/
│   │       └── index.ts      # TypeScript types
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── client/
│   ├── index.html
│   ├── css/
│   │   └── game.css
│   └── js/
│       ├── config.js
│       ├── main.js
│       ├── map.js
│       ├── player.js
│       └── chat.js
└── README.md
```

## Cost Estimate

- **Cloud Run:** ~$0-5/month (with 1 min instance)
- **Firestore:** Free tier covers small scale
- **Google Maps API:** $200 free credit/month
- **Total:** ~$5-15/month for small player base
