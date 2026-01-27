// Main Game Entry Point
class GeoMMO {
  constructor() {
    this.socket = null;
    this.mapManager = null;
    this.playerManager = null;
    this.chatManager = null;
    this.user = null;
    this.selectedFlag = null;
  }

  async init() {
    // Set up login button
    document.getElementById('login-btn').addEventListener('click', () => {
      this.login();
    });

    // Set up flag grid
    this.setupFlagSelector();

    // Check if already logged in
    firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {
        this.user = user;
        // Check if user already has a saved flag
        const savedFlag = localStorage.getItem(`flag_${user.uid}`);
        if (savedFlag) {
          this.selectedFlag = savedFlag;
          await this.startGame();
        } else {
          this.showFlagSelector();
        }
      }
    });
  }

  setupFlagSelector() {
    const grid = document.getElementById('flag-grid');
    COUNTRY_FLAGS.forEach(flag => {
      const option = document.createElement('div');
      option.className = 'flag-option';
      option.textContent = flag.emoji;
      option.title = flag.name;
      option.addEventListener('click', () => this.selectFlag(flag));
      grid.appendChild(option);
    });
  }

  showFlagSelector() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('flag-screen').classList.remove('hidden');
  }

  async selectFlag(flag) {
    this.selectedFlag = flag.emoji;
    // Save to localStorage
    localStorage.setItem(`flag_${this.user.uid}`, flag.emoji);
    await this.startGame();
  }

  async login() {
    const provider = new firebase.auth.GoogleAuthProvider();

    try {
      const result = await firebase.auth().signInWithPopup(provider);
      this.user = result.user;

      // Check if user already has a saved flag
      const savedFlag = localStorage.getItem(`flag_${this.user.uid}`);
      if (savedFlag) {
        this.selectedFlag = savedFlag;
        await this.startGame();
      } else {
        this.showFlagSelector();
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    }
  }

  async startGame() {
    // Show game screen
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('flag-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');

    // Initialize map
    this.mapManager = new MapManager();
    await this.mapManager.init();

    // Initialize player manager
    this.playerManager = new PlayerManager(this.mapManager);

    // Initialize chat manager
    this.chatManager = new ChatManager(this.playerManager);
    window.chatManager = this.chatManager; // Global reference for system messages

    // Connect to server
    await this.connectToServer();

    // Set up movement handler
    this.mapManager.onMove((position) => {
      this.handleMove(position);
    });

    // Set up chat handler
    this.chatManager.onSend((message, type) => {
      this.handleChat(message, type);
    });
  }

  async connectToServer() {
    const serverUrl = GAME_CONFIG.serverUrl || window.location.origin;

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling']
    });

    // Connection events
    this.socket.on('connect', async () => {
      console.log('Connected to server');

      // Authenticate with Firebase token
      const token = await this.user.getIdToken();
      this.socket.emit('player:authenticate', {
        token,
        flag: this.selectedFlag
      });
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.chatManager.addSystemMessage('Disconnected from server');
    });

    // Auth events
    this.socket.on('auth:success', (data) => {
      console.log('Authentication successful:', data.player);
      this.playerManager.setSelf(data.player);
      this.chatManager.addSystemMessage('Welcome to GeoMMO!');
    });

    this.socket.on('auth:error', (data) => {
      console.error('Authentication failed:', data.message);
      alert('Authentication failed. Please refresh and try again.');
    });

    // World state
    this.socket.on('world:state', (state) => {
      console.log('Received world state:', state);
      this.playerManager.loadWorldState(state);
    });

    // Player events
    this.socket.on('player:joined', (player) => {
      console.log('Player joined:', player);
      this.playerManager.addPlayer(player);
    });

    this.socket.on('player:left', (data) => {
      console.log('Player left:', data.id);
      this.playerManager.removePlayer(data.id);
    });

    this.socket.on('player:moved', (data) => {
      this.playerManager.updatePosition(data.id, data.position);
    });

    // Chat events
    this.socket.on('chat:message', (data) => {
      this.chatManager.addMessage(data);
    });
  }

  handleMove(position) {
    if (!this.socket || !this.socket.connected) return;

    // Update local position immediately
    this.playerManager.updateSelfPosition(position);

    // Send to server
    this.socket.emit('player:move', {
      lat: position.lat,
      lng: position.lng
    });
  }

  handleChat(message, type) {
    if (!this.socket || !this.socket.connected) return;

    this.socket.emit('chat:send', { message, type });
  }
}

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const game = new GeoMMO();
  game.init();
});
