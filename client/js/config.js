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
  serverUrl: ''
};
