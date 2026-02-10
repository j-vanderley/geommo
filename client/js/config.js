// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBCMmtz8XrQADg0-p5u8IbD4s6aemJjadU",
  authDomain: "gamenana.firebaseapp.com",
  projectId: "gamenana",
  storageBucket: "gamenana.firebasestorage.app",
  messagingSenderId: "25873003290",
  appId: "1:25873003290:web:c9d6b90ed658c6c5e632a3"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Avatar examples (4 characters max)
const AVATAR_EXAMPLES = [
  '>:-)', ':-)', ';-)', ':-P', ':-D', ':-O', 'X-D', '^_^',
  '-_-', 'O_O', '>_<', 'T_T', ':3', ':D', '<3', '!!!',
  '???', '...', 'lol', 'gg', 'hi', 'brb', 'afk', 'wtf',
  '(:', '):', '><', '^^', 'uwu', 'owo', ':^)', '8-)',
];

// UI Theme options
const UI_THEMES = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'OSRS-inspired warm tones',
    colors: {
      primary: '#ffb000',
      secondary: '#ff981f',
      background: 'rgba(0, 0, 0, 0.85)',
      panel: '#494034',
      border: '#5d5447',
      text: '#ffff00',
      textMuted: '#ff981f'
    },
    font: '"Courier New", monospace',
    panelRadius: '4px'
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Sleek dark mode',
    colors: {
      primary: '#60a5fa',
      secondary: '#93c5fd',
      background: 'rgba(15, 23, 42, 0.92)',
      panel: '#1e293b',
      border: '#334155',
      text: '#f1f5f9',
      textMuted: '#94a3b8'
    },
    font: '"Segoe UI", system-ui, sans-serif',
    panelRadius: '8px'
  },
  {
    id: 'cyber',
    name: 'Cyber',
    description: 'Neon futuristic',
    colors: {
      primary: '#00ff88',
      secondary: '#00ffff',
      background: 'rgba(0, 10, 20, 0.9)',
      panel: '#0a1628',
      border: '#00ff8855',
      text: '#00ff88',
      textMuted: '#00aa66'
    },
    font: '"Orbitron", "Courier New", monospace',
    panelRadius: '2px'
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Natural earth tones',
    colors: {
      primary: '#86efac',
      secondary: '#a3e635',
      background: 'rgba(20, 30, 20, 0.88)',
      panel: '#1a2e1a',
      border: '#3d5a3d',
      text: '#d9f99d',
      textMuted: '#86efac'
    },
    font: 'Georgia, serif',
    panelRadius: '12px'
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Deep sea blues',
    colors: {
      primary: '#38bdf8',
      secondary: '#22d3ee',
      background: 'rgba(8, 20, 40, 0.9)',
      panel: '#0c1929',
      border: '#1e3a5f',
      text: '#e0f2fe',
      textMuted: '#7dd3fc'
    },
    font: '"Trebuchet MS", sans-serif',
    panelRadius: '6px'
  }
];

// Major cities for fast travel
const MAJOR_CITIES = [
  // Americas
  { name: 'New York', lat: 40.758896, lng: -73.985130 },
  { name: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
  { name: 'San Francisco', lat: 37.7749, lng: -122.4194 },
  { name: 'Chicago', lat: 41.8781, lng: -87.6298 },
  { name: 'Miami', lat: 25.7617, lng: -80.1918 },
  { name: 'Toronto', lat: 43.6532, lng: -79.3832 },
  { name: 'Vancouver', lat: 49.2827, lng: -123.1207 },
  { name: 'Mexico City', lat: 19.4326, lng: -99.1332 },
  { name: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729 },
  { name: 'Buenos Aires', lat: -34.6037, lng: -58.3816 },
  // Europe
  { name: 'London', lat: 51.5074, lng: -0.1278 },
  { name: 'Paris', lat: 48.8566, lng: 2.3522 },
  { name: 'Berlin', lat: 52.5200, lng: 13.4050 },
  { name: 'Rome', lat: 41.9028, lng: 12.4964 },
  { name: 'Madrid', lat: 40.4168, lng: -3.7038 },
  { name: 'Amsterdam', lat: 52.3676, lng: 4.9041 },
  { name: 'Barcelona', lat: 41.3851, lng: 2.1734 },
  { name: 'Vienna', lat: 48.2082, lng: 16.3738 },
  { name: 'Prague', lat: 50.0755, lng: 14.4378 },
  { name: 'Moscow', lat: 55.7558, lng: 37.6173 },
  // Asia
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
  { name: 'Seoul', lat: 37.5665, lng: 126.9780 },
  { name: 'Beijing', lat: 39.9042, lng: 116.4074 },
  { name: 'Shanghai', lat: 31.2304, lng: 121.4737 },
  { name: 'Hong Kong', lat: 22.3193, lng: 114.1694 },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { name: 'Bangkok', lat: 13.7563, lng: 100.5018 },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'Dubai', lat: 25.2048, lng: 55.2708 },
  // Oceania
  { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
  { name: 'Melbourne', lat: -37.8136, lng: 144.9631 },
  { name: 'Brisbane', lat: -27.4698, lng: 153.0251 },
  { name: 'Auckland', lat: -36.8509, lng: 174.7645 },
  // Africa
  { name: 'Cairo', lat: 30.0444, lng: 31.2357 },
  { name: 'Cape Town', lat: -33.9249, lng: 18.4241 },
  { name: 'Lagos', lat: 6.5244, lng: 3.3792 },
];

// Game Configuration
const GAME_CONFIG = {
  // Default spawn location (NYC Times Square)
  defaultPosition: { lat: 40.758896, lng: -73.985130 },

  // Movement speed (pixels per frame, affects animation)
  moveSpeed: 5,

  // Chat bubble duration (ms)
  chatBubbleDuration: 5000,

  // Local chat radius (meters)
  localChatRadius: 100,

  // Map settings
  map: {
    defaultZoom: 18,
    minZoom: 15,
    maxZoom: 20
  },

  // Minimap settings
  minimap: {
    zoom: 12  // Zoomed out more for better overview
  },

  // Server URL (empty for same origin)
  serverUrl: '',

  // 3D View settings
  view3d: {
    enabled: true,                  // Enable 3D view (set false for 2D fallback)
    tileZoom: 16,                   // OSM zoom level (lower = larger tiles, 16 is good balance)
    tilesPerSide: 11,               // 11x11 grid of tiles around player (larger view)
    worldScale: 8000,               // Scale factor for lat/lng to world units
    cameraDistance: 80,             // Default camera distance from player
    cameraPitch: 0.7,               // Camera tilt angle (~40 degrees)
    cameraRotateSpeed: 0.005,       // Mouse drag rotation speed
    cameraZoomSpeed: 5,             // Scroll wheel zoom speed
    cameraMinDistance: 20,          // Minimum zoom distance
    cameraMaxDistance: 300,         // Maximum zoom distance
    playerSpriteSize: 4,            // Size of player sprites in world units
    fogNear: 80,                    // Fog starts fading in (closer = thicker)
    fogFar: 220,                    // Fog fully opaque (closer = stronger horizon blend)
    fogColor: 0xB0D4E8,             // Light sky blue fog color
  }
};
