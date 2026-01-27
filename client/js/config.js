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

// Available country flags for player avatars
const COUNTRY_FLAGS = [
  { code: 'us', emoji: '🇺🇸', name: 'United States' },
  { code: 'gb', emoji: '🇬🇧', name: 'United Kingdom' },
  { code: 'ca', emoji: '🇨🇦', name: 'Canada' },
  { code: 'au', emoji: '🇦🇺', name: 'Australia' },
  { code: 'de', emoji: '🇩🇪', name: 'Germany' },
  { code: 'fr', emoji: '🇫🇷', name: 'France' },
  { code: 'jp', emoji: '🇯🇵', name: 'Japan' },
  { code: 'kr', emoji: '🇰🇷', name: 'South Korea' },
  { code: 'cn', emoji: '🇨🇳', name: 'China' },
  { code: 'in', emoji: '🇮🇳', name: 'India' },
  { code: 'br', emoji: '🇧🇷', name: 'Brazil' },
  { code: 'mx', emoji: '🇲🇽', name: 'Mexico' },
  { code: 'es', emoji: '🇪🇸', name: 'Spain' },
  { code: 'it', emoji: '🇮🇹', name: 'Italy' },
  { code: 'nl', emoji: '🇳🇱', name: 'Netherlands' },
  { code: 'se', emoji: '🇸🇪', name: 'Sweden' },
  { code: 'no', emoji: '🇳🇴', name: 'Norway' },
  { code: 'fi', emoji: '🇫🇮', name: 'Finland' },
  { code: 'pl', emoji: '🇵🇱', name: 'Poland' },
  { code: 'ru', emoji: '🇷🇺', name: 'Russia' },
  { code: 'ua', emoji: '🇺🇦', name: 'Ukraine' },
  { code: 'tr', emoji: '🇹🇷', name: 'Turkey' },
  { code: 'za', emoji: '🇿🇦', name: 'South Africa' },
  { code: 'ng', emoji: '🇳🇬', name: 'Nigeria' },
  { code: 'eg', emoji: '🇪🇬', name: 'Egypt' },
  { code: 'sa', emoji: '🇸🇦', name: 'Saudi Arabia' },
  { code: 'ae', emoji: '🇦🇪', name: 'UAE' },
  { code: 'il', emoji: '🇮🇱', name: 'Israel' },
  { code: 'th', emoji: '🇹🇭', name: 'Thailand' },
  { code: 'vn', emoji: '🇻🇳', name: 'Vietnam' },
  { code: 'ph', emoji: '🇵🇭', name: 'Philippines' },
  { code: 'id', emoji: '🇮🇩', name: 'Indonesia' },
  { code: 'my', emoji: '🇲🇾', name: 'Malaysia' },
  { code: 'sg', emoji: '🇸🇬', name: 'Singapore' },
  { code: 'nz', emoji: '🇳🇿', name: 'New Zealand' },
  { code: 'ar', emoji: '🇦🇷', name: 'Argentina' },
  { code: 'cl', emoji: '🇨🇱', name: 'Chile' },
  { code: 'co', emoji: '🇨🇴', name: 'Colombia' },
  { code: 'pt', emoji: '🇵🇹', name: 'Portugal' },
  { code: 'ie', emoji: '🇮🇪', name: 'Ireland' },
];

// Major cities for fast travel
const MAJOR_CITIES = [
  { name: 'New York', lat: 40.758896, lng: -73.985130 },
  { name: 'London', lat: 51.5074, lng: -0.1278 },
  { name: 'Paris', lat: 48.8566, lng: 2.3522 },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
  { name: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
  { name: 'Dubai', lat: 25.2048, lng: 55.2708 },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { name: 'Hong Kong', lat: 22.3193, lng: 114.1694 },
  { name: 'Berlin', lat: 52.5200, lng: 13.4050 },
  { name: 'Rome', lat: 41.9028, lng: 12.4964 },
  { name: 'Moscow', lat: 55.7558, lng: 37.6173 },
  { name: 'Cairo', lat: 30.0444, lng: 31.2357 },
  { name: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729 },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'Toronto', lat: 43.6532, lng: -79.3832 },
  { name: 'Seoul', lat: 37.5665, lng: 126.9780 },
  { name: 'Bangkok', lat: 13.7563, lng: 100.5018 },
  { name: 'Amsterdam', lat: 52.3676, lng: 4.9041 },
  { name: 'San Francisco', lat: 37.7749, lng: -122.4194 },
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
    zoom: 14
  },

  // Server URL (empty for same origin)
  serverUrl: '',

  // 3D View settings
  view3d: {
    enabled: true,                  // Enable 3D view (set false for 2D fallback)
    tileZoom: 16,                   // OSM zoom level (lower = larger tiles, 16 is good balance)
    tilesPerSide: 7,                // 7x7 grid of tiles around player
    worldScale: 8000,               // Scale factor for lat/lng to world units
    cameraDistance: 60,             // Default camera distance from player
    cameraPitch: 0.7,               // Camera tilt angle (~40 degrees)
    cameraRotateSpeed: 0.005,       // Mouse drag rotation speed
    cameraZoomSpeed: 5,             // Scroll wheel zoom speed
    cameraMinDistance: 20,          // Minimum zoom distance
    cameraMaxDistance: 200,         // Maximum zoom distance
    playerSpriteSize: 4,            // Size of player sprites in world units
  }
};
