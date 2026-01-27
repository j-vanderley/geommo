// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDAOXqJ_jPqSRrgnUjn_ip3l8fz8CFcYUc",
  authDomain: "gamenana.firebaseapp.com",
  projectId: "gamenana",
  storageBucket: "gamenana.firebasestorage.app",
  messagingSenderId: "25873003290",
  appId: "1:25873003290:web:c9d6b90ed658c6c5e632a3"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

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
