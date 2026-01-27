// Main Game Entry Point
class GeoMMO {
  constructor() {
    this.socket = null;
    this.mapManager = null;
    this.playerManager = null;
    this.chatManager = null;
    this.user = null;
    this.selectedFlag = null;
    this.authType = null; // 'firebase' or 'wallet'
    this.walletAddress = null;
    this.walletUsername = null;
  }

  async init() {
    // Set up Google login button
    document.getElementById('login-btn').addEventListener('click', () => {
      this.login();
    });

    // Set up Phantom login button
    document.getElementById('phantom-login-btn').addEventListener('click', () => {
      this.connectPhantom();
    });

    // Set up username submit button
    document.getElementById('username-submit-btn').addEventListener('click', () => {
      this.submitUsername();
    });

    // Username input enter key
    document.getElementById('username-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.submitUsername();
    });

    // Set up flag grid
    this.setupFlagSelector();

    // Check if already logged in with Firebase
    firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {
        this.user = user;
        this.authType = 'firebase';
        const savedFlag = localStorage.getItem(`flag_${user.uid}`);
        if (savedFlag) {
          this.selectedFlag = savedFlag;
          await this.startGame();
        } else {
          this.showFlagSelector();
        }
      } else {
        // Check for saved wallet session
        const savedWallet = localStorage.getItem('wallet_address');
        const savedUsername = localStorage.getItem('wallet_username');
        if (savedWallet && savedUsername) {
          this.walletAddress = savedWallet;
          this.walletUsername = savedUsername;
          this.authType = 'wallet';
          const savedFlag = localStorage.getItem(`flag_${savedWallet}`);
          if (savedFlag) {
            this.selectedFlag = savedFlag;
            await this.startGame();
          } else {
            this.showFlagSelector();
          }
        }
      }
    });
  }

  // Phantom Wallet Connection
  async connectPhantom() {
    try {
      // Check if Phantom is installed
      const provider = window.phantom?.solana;

      if (!provider?.isPhantom) {
        window.open('https://phantom.app/', '_blank');
        alert('Please install Phantom wallet to continue');
        return;
      }

      // Connect to Phantom
      const response = await provider.connect();
      this.walletAddress = response.publicKey.toString();

      // Show username selection screen
      document.getElementById('login-screen').classList.add('hidden');
      document.getElementById('username-screen').classList.remove('hidden');
      document.getElementById('wallet-address-display').textContent =
        `Wallet: ${this.walletAddress.slice(0, 4)}...${this.walletAddress.slice(-4)}`;

      // Pre-fill with saved username if exists
      const savedUsername = localStorage.getItem('wallet_username');
      if (savedUsername) {
        document.getElementById('username-input').value = savedUsername;
      }
    } catch (error) {
      console.error('Phantom connection error:', error);
      alert('Failed to connect wallet. Please try again.');
    }
  }

  async submitUsername() {
    const input = document.getElementById('username-input');
    let username = input.value.trim();

    if (!username) {
      // Use shortened wallet address as default
      username = `${this.walletAddress.slice(0, 4)}...${this.walletAddress.slice(-4)}`;
    }

    // Validate username (alphanumeric, 3-20 chars)
    if (username.length < 3) {
      alert('Username must be at least 3 characters');
      return;
    }

    this.walletUsername = username;
    this.authType = 'wallet';

    // Save to localStorage
    localStorage.setItem('wallet_address', this.walletAddress);
    localStorage.setItem('wallet_username', this.walletUsername);

    // Check for saved flag
    const savedFlag = localStorage.getItem(`flag_${this.walletAddress}`);
    if (savedFlag) {
      this.selectedFlag = savedFlag;
      await this.startGame();
    } else {
      this.showFlagSelector();
    }
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
    document.getElementById('username-screen').classList.add('hidden');
    document.getElementById('flag-screen').classList.remove('hidden');
  }

  getUserId() {
    if (this.authType === 'firebase') {
      return this.user.uid;
    } else {
      return this.walletAddress;
    }
  }

  async selectFlag(flag) {
    this.selectedFlag = flag.emoji;
    // Save to localStorage
    localStorage.setItem(`flag_${this.getUserId()}`, flag.emoji);

    // If already in game, update flag on server
    if (this.socket && this.socket.connected) {
      this.socket.emit('player:updateFlag', { flag: flag.emoji });
      document.getElementById('flag-screen').classList.add('hidden');
      document.getElementById('game-screen').classList.remove('hidden');
      // Update local player display
      if (this.playerManager && this.playerManager.selfPlayer) {
        this.playerManager.updateSelfFlag(flag.emoji);
      }
    } else {
      await this.startGame();
    }
  }

  showChangeFlagScreen() {
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('flag-screen').classList.remove('hidden');
  }

  async login() {
    const provider = new firebase.auth.GoogleAuthProvider();

    try {
      const result = await firebase.auth().signInWithPopup(provider);
      this.user = result.user;
      this.authType = 'firebase';

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
    document.getElementById('username-screen').classList.add('hidden');
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

    // Set up change flag button
    document.getElementById('change-flag-btn').addEventListener('click', () => {
      this.showChangeFlagScreen();
    });

    // Set up fast travel
    this.setupFastTravel();
  }

  setupFastTravel() {
    const select = document.getElementById('city-select');
    const travelBtn = document.getElementById('travel-btn');

    // Populate city dropdown
    MAJOR_CITIES.forEach(city => {
      const option = document.createElement('option');
      option.value = JSON.stringify({ lat: city.lat, lng: city.lng });
      option.textContent = city.name;
      select.appendChild(option);
    });

    // Handle travel button click
    travelBtn.addEventListener('click', () => {
      const selected = select.value;
      if (!selected) return;

      const { lat, lng } = JSON.parse(selected);
      this.fastTravelTo(lat, lng);
    });

    // Also allow double-click/enter on select
    select.addEventListener('change', () => {
      // Optional: auto-travel on selection
    });
  }

  fastTravelTo(lat, lng) {
    if (!this.socket || !this.socket.connected) return;

    // Update position
    const position = { lat, lng };

    // Update local player position
    this.playerManager.updateSelfPosition(position);

    // Tell the map to update tiles for new location
    if (this.mapManager.map3d) {
      this.mapManager.map3d.setCenter(lat, lng);
      this.mapManager.map3d.tileManager.centerLat = lat;
      this.mapManager.map3d.tileManager.centerLng = lng;
      this.mapManager.map3d.tileManager.tiles.clear(); // Clear old tiles
      this.mapManager.map3d.tileManager.updateTiles(lat, lng);
    }

    // Send to server
    this.socket.emit('player:move', { lat, lng });

    // Show system message
    const cityName = MAJOR_CITIES.find(c => c.lat === lat && c.lng === lng)?.name || 'Unknown';
    this.chatManager.addSystemMessage(`Teleported to ${cityName}!`);
  }

  async connectToServer() {
    const serverUrl = GAME_CONFIG.serverUrl || window.location.origin;

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling']
    });

    // Connection events
    this.socket.on('connect', async () => {
      console.log('Connected to server');

      if (this.authType === 'firebase') {
        // Authenticate with Firebase token
        const token = await this.user.getIdToken();
        this.socket.emit('player:authenticate', {
          token,
          flag: this.selectedFlag,
          authType: 'firebase'
        });
      } else {
        // Authenticate with wallet
        this.socket.emit('player:authenticate', {
          walletAddress: this.walletAddress,
          username: this.walletUsername,
          flag: this.selectedFlag,
          authType: 'wallet'
        });
      }
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

    this.socket.on('player:flagUpdated', (data) => {
      this.playerManager.updatePlayerFlag(data.id, data.flag);
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
