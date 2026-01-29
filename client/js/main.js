// Main Game Entry Point
class GeoMMO {
  constructor() {
    this.socket = null;
    this.mapManager = null;
    this.playerManager = null;
    this.chatManager = null;
    this.user = null;
    this.selectedAvatar = null; // { text: ':-)', color: '#ffb000' }
    this.authType = null; // 'firebase' or 'wallet'
    this.walletAddress = null;
    this.walletUsername = null;
  }

  async init() {
    // Set up Google login button
    document.getElementById('login-btn').addEventListener('click', () => {
      this.login();
    });

    // Set up email login buttons
    document.getElementById('email-login-btn').addEventListener('click', () => {
      this.emailLogin();
    });

    document.getElementById('email-register-btn').addEventListener('click', () => {
      this.emailRegister();
    });

    // Email form enter key
    document.getElementById('password-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.emailLogin();
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

    // Set up avatar customization
    this.setupAvatarSelector();

    // Check if already logged in with Firebase
    firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {
        this.user = user;
        this.authType = 'firebase';
        const savedAvatar = localStorage.getItem(`avatar_${user.uid}`);
        if (savedAvatar) {
          this.selectedAvatar = JSON.parse(savedAvatar);
          await this.startGame();
        } else {
          this.showAvatarSelector();
        }
      } else {
        // Check for saved wallet session
        const savedWallet = localStorage.getItem('wallet_address');
        const savedUsername = localStorage.getItem('wallet_username');
        if (savedWallet && savedUsername) {
          this.walletAddress = savedWallet;
          this.walletUsername = savedUsername;
          this.authType = 'wallet';
          const savedAvatar = localStorage.getItem(`avatar_${savedWallet}`);
          if (savedAvatar) {
            this.selectedAvatar = JSON.parse(savedAvatar);
            await this.startGame();
          } else {
            this.showAvatarSelector();
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

    // Check for saved avatar
    const savedAvatar = localStorage.getItem(`avatar_${this.walletAddress}`);
    if (savedAvatar) {
      this.selectedAvatar = JSON.parse(savedAvatar);
      await this.startGame();
    } else {
      this.showAvatarSelector();
    }
  }

  setupAvatarSelector() {
    const examplesGrid = document.getElementById('avatar-examples');
    const colorPicker = document.getElementById('color-picker');
    const colorHex = document.getElementById('color-hex');
    const themeOptions = document.getElementById('theme-options');
    const avatarInput = document.getElementById('avatar-input');
    const submitBtn = document.getElementById('avatar-submit-btn');

    // Current selection state - load saved UI theme if available
    const savedUITheme = localStorage.getItem('ui_theme') || 'classic';
    this.avatarSelection = {
      text: ':-)',
      color: '#ffb000',
      uiTheme: savedUITheme
    };

    // Populate avatar examples
    AVATAR_EXAMPLES.forEach(example => {
      const option = document.createElement('div');
      option.className = 'avatar-example';
      option.textContent = example;
      option.addEventListener('click', () => {
        avatarInput.value = example;
        this.updateAvatarPreview();
      });
      examplesGrid.appendChild(option);
    });

    // Color picker handler
    colorPicker.addEventListener('input', (e) => {
      this.avatarSelection.color = e.target.value;
      colorHex.textContent = e.target.value;
      this.updateAvatarPreview();
    });

    // Populate UI theme options
    UI_THEMES.forEach((theme, index) => {
      const option = document.createElement('div');
      const isSelected = theme.id === savedUITheme;
      option.className = 'theme-option' + (isSelected ? ' selected' : '');
      option.innerHTML = `
        <div class="theme-preview" style="background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.panel} 100%);"></div>
        <div class="theme-name">${theme.name}</div>
      `;
      option.addEventListener('click', () => {
        document.querySelectorAll('.theme-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        this.avatarSelection.uiTheme = theme.id;
        this.applyUITheme(theme.id);
      });
      themeOptions.appendChild(option);
    });

    // Input change handler
    avatarInput.addEventListener('input', () => this.updateAvatarPreview());

    // Submit button
    submitBtn.addEventListener('click', () => this.submitAvatar());

    // Initial preview
    this.updateAvatarPreview();
  }

  updateAvatarPreview() {
    const avatarInput = document.getElementById('avatar-input');
    const previewText = document.getElementById('preview-text');
    const previewCircle = document.getElementById('preview-circle');

    const text = avatarInput.value || ':-)';
    this.avatarSelection.text = text.slice(0, 4);

    previewText.textContent = this.avatarSelection.text;
    previewCircle.style.borderColor = this.avatarSelection.color;
    previewCircle.style.color = this.avatarSelection.color;
    previewCircle.style.boxShadow = `0 0 15px ${this.avatarSelection.color}`;
  }

  async submitAvatar() {
    const text = this.avatarSelection.text || ':-)';
    const color = this.avatarSelection.color || '#ffb000';
    const uiTheme = this.avatarSelection.uiTheme || 'classic';

    this.selectedAvatar = { text, color };

    // Save to localStorage
    localStorage.setItem(`avatar_${this.getUserId()}`, JSON.stringify(this.selectedAvatar));

    // Apply UI theme (stored separately from avatar)
    this.applyUITheme(uiTheme);

    // If already in game, update avatar on server
    if (this.socket && this.socket.connected) {
      this.socket.emit('player:updateAvatar', { avatar: this.selectedAvatar });
      document.getElementById('avatar-screen').classList.add('hidden');
      document.getElementById('game-screen').classList.remove('hidden');
      // Update local player display
      if (this.playerManager && this.playerManager.selfPlayer) {
        this.playerManager.updateSelfAvatar(this.selectedAvatar);
      }
    } else {
      await this.startGame();
    }
  }

  applyUITheme(themeId) {
    // Remove existing UI theme classes
    document.body.className = document.body.className.replace(/ui-\w+/g, '');
    // Add new UI theme class
    document.body.classList.add(`ui-${themeId}`);

    // Save to localStorage
    localStorage.setItem('ui_theme', themeId);
  }

  showAvatarSelector() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('username-screen').classList.add('hidden');
    document.getElementById('avatar-screen').classList.remove('hidden');
  }

  getUserId() {
    if (this.authType === 'firebase') {
      return this.user.uid;
    } else {
      return this.walletAddress;
    }
  }

  showChangeAvatarScreen() {
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('avatar-screen').classList.remove('hidden');

    // Pre-fill current avatar if exists
    if (this.selectedAvatar) {
      document.getElementById('avatar-input').value = this.selectedAvatar.text;
      document.getElementById('color-picker').value = this.selectedAvatar.color || '#ffb000';
      document.getElementById('color-hex').textContent = this.selectedAvatar.color || '#ffb000';

      this.avatarSelection = {
        text: this.selectedAvatar.text,
        color: this.selectedAvatar.color || '#ffb000',
        uiTheme: localStorage.getItem('ui_theme') || 'classic'
      };
      this.updateAvatarPreview();

      // Select the current UI theme
      const savedTheme = localStorage.getItem('ui_theme') || 'classic';
      document.querySelectorAll('.theme-option').forEach((opt, index) => {
        opt.classList.remove('selected');
        if (UI_THEMES[index]?.id === savedTheme) {
          opt.classList.add('selected');
        }
      });
    }
  }

  rgbToHex(rgb) {
    if (rgb.startsWith('#')) return rgb;
    const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!match) return rgb;
    return '#' + [match[1], match[2], match[3]].map(x => {
      const hex = parseInt(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  async login() {
    const provider = new firebase.auth.GoogleAuthProvider();

    try {
      const result = await firebase.auth().signInWithPopup(provider);
      this.user = result.user;
      this.authType = 'firebase';

      // Check if user already has a saved avatar
      const savedAvatar = localStorage.getItem(`avatar_${this.user.uid}`);
      if (savedAvatar) {
        this.selectedAvatar = JSON.parse(savedAvatar);
        await this.startGame();
      } else {
        this.showAvatarSelector();
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    }
  }

  async emailLogin() {
    const email = document.getElementById('email-input').value.trim();
    const password = document.getElementById('password-input').value;
    const errorEl = document.getElementById('login-error');

    errorEl.textContent = '';

    if (!email || !password) {
      errorEl.textContent = 'Please enter email and password';
      return;
    }

    try {
      const result = await firebase.auth().signInWithEmailAndPassword(email, password);
      this.user = result.user;
      this.authType = 'firebase';

      const savedAvatar = localStorage.getItem(`avatar_${this.user.uid}`);
      if (savedAvatar) {
        this.selectedAvatar = JSON.parse(savedAvatar);
        await this.startGame();
      } else {
        this.showAvatarSelector();
      }
    } catch (error) {
      console.error('Email login error:', error);
      errorEl.textContent = this.getAuthErrorMessage(error.code);
    }
  }

  async emailRegister() {
    const email = document.getElementById('email-input').value.trim();
    const password = document.getElementById('password-input').value;
    const errorEl = document.getElementById('login-error');

    errorEl.textContent = '';

    if (!email || !password) {
      errorEl.textContent = 'Please enter email and password';
      return;
    }

    if (password.length < 6) {
      errorEl.textContent = 'Password must be at least 6 characters';
      return;
    }

    try {
      const result = await firebase.auth().createUserWithEmailAndPassword(email, password);
      this.user = result.user;
      this.authType = 'firebase';
      this.showAvatarSelector();
    } catch (error) {
      console.error('Registration error:', error);
      errorEl.textContent = this.getAuthErrorMessage(error.code);
    }
  }

  getAuthErrorMessage(code) {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'Email already registered. Try signing in.';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/user-not-found':
        return 'No account found with this email';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/weak-password':
        return 'Password is too weak';
      case 'auth/invalid-credential':
        return 'Invalid email or password';
      default:
        return 'Authentication failed. Please try again.';
    }
  }

  async startGame() {
    // Show game screen
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('username-screen').classList.add('hidden');
    document.getElementById('avatar-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');

    // Apply saved UI theme
    const savedUITheme = localStorage.getItem('ui_theme') || 'classic';
    this.applyUITheme(savedUITheme);

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

    // Set up change avatar button
    document.getElementById('change-flag-btn').addEventListener('click', () => {
      this.showChangeAvatarScreen();
    });

    // Set up fast travel
    this.setupFastTravel();

    // Set up info panel toggle
    this.setupInfoPanel();

    // Set up players panel minimize
    this.setupPlayersPanel();
  }

  setupPlayersPanel() {
    const panel = document.getElementById('players-panel');
    const header = panel.querySelector('.panel-header');

    header.addEventListener('click', () => {
      panel.classList.toggle('minimized');
    });
  }

  setupInfoPanel() {
    const infoButton = document.getElementById('info-button');
    const infoToggle = document.getElementById('info-toggle');
    const infoPanel = document.getElementById('info-panel');
    const infoClose = document.getElementById('info-close');

    infoToggle.addEventListener('click', () => {
      infoButton.classList.add('hidden');
      infoPanel.classList.remove('hidden');
    });

    infoClose.addEventListener('click', () => {
      infoPanel.classList.add('hidden');
      infoButton.classList.remove('hidden');
    });
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

    // Tell the map to update for new location (must happen before player position update)
    if (this.mapManager.map3d) {
      // Use setCenter which properly clears old tiles and updates center
      this.mapManager.map3d.tileManager.setCenter(lat, lng);
      this.mapManager.map3d.setCenter(lat, lng);
      this.mapManager.map3d.tileManager.updateTiles(lat, lng);
    }

    // Update local player position
    this.playerManager.updateSelfPosition(position);

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
          avatar: this.selectedAvatar,
          authType: 'firebase'
        });
      } else {
        // Authenticate with wallet
        this.socket.emit('player:authenticate', {
          walletAddress: this.walletAddress,
          username: this.walletUsername,
          avatar: this.selectedAvatar,
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

      // Sync avatar from server (server has the authoritative copy from Firestore)
      if (data.player.avatar) {
        this.selectedAvatar = data.player.avatar;
        // Update localStorage to match server
        localStorage.setItem(`avatar_${this.getUserId()}`, JSON.stringify(this.selectedAvatar));
      }

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

    this.socket.on('player:avatarUpdated', (data) => {
      this.playerManager.updatePlayerAvatar(data.id, data.avatar);
    });

    // Legacy support for flag updates
    this.socket.on('player:flagUpdated', (data) => {
      this.playerManager.updatePlayerAvatar(data.id, { text: data.flag, color: '#ffb000' });
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
