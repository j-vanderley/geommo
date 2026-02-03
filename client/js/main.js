// Main Game Entry Point
class Geommo {
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

    // Set up forgot password button
    document.getElementById('forgot-password-btn').addEventListener('click', () => {
      this.forgotPassword();
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

    // Check if already logged in with Firebase (but don't auto-login)
    firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {
        // Store user info but don't auto-login - show continue button instead
        this.user = user;
        this.authType = 'firebase';
        this.showContinueOption(user.displayName || user.email || 'your account');
      } else {
        // Check for saved wallet session
        const savedWallet = localStorage.getItem('wallet_address');
        const savedUsername = localStorage.getItem('wallet_username');
        if (savedWallet && savedUsername) {
          this.walletAddress = savedWallet;
          this.walletUsername = savedUsername;
          this.authType = 'wallet';
          this.showContinueOption(savedUsername);
        }
      }
    });
  }

  // Show continue option for returning users
  showContinueOption(username) {
    const continueSection = document.getElementById('continue-section');
    const continueBtn = document.getElementById('continue-btn');
    const continueUser = document.getElementById('continue-username');

    if (continueSection && continueBtn && continueUser) {
      continueUser.textContent = username;
      continueSection.classList.remove('hidden');

      continueBtn.addEventListener('click', async () => {
        const savedAvatar = localStorage.getItem(`avatar_${this.getUserId()}`);
        if (savedAvatar) {
          this.selectedAvatar = JSON.parse(savedAvatar);
          await this.startGame();
        } else {
          this.showAvatarSelector();
        }
      });
    }
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
    const errorEl = document.getElementById('login-error');
    errorEl.textContent = '';

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
      errorEl.textContent = this.getAuthErrorMessage(error.code);
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
      case 'auth/popup-closed-by-user':
        return 'Sign-in popup was closed';
      case 'auth/popup-blocked':
        return 'Sign-in popup was blocked. Allow popups and try again.';
      case 'auth/cancelled-popup-request':
        return 'Sign-in was cancelled';
      case 'auth/network-request-failed':
        return 'Network error. Check your connection.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please wait and try again.';
      case 'auth/operation-not-allowed':
        return 'This sign-in method is not enabled.';
      case 'auth/credential-already-in-use':
        return 'This account is already linked to another user.';
      case 'auth/provider-already-linked':
        return 'This provider is already linked to your account.';
      case 'auth/requires-recent-login':
        return 'Please log out and log back in to perform this action.';
      default:
        return `Authentication failed: ${code || 'Unknown error'}`;
    }
  }

  async forgotPassword() {
    const email = document.getElementById('email-input').value.trim();
    const errorEl = document.getElementById('login-error');
    const successEl = document.getElementById('login-success');

    errorEl.textContent = '';
    successEl.textContent = '';

    if (!email) {
      errorEl.textContent = 'Please enter your email address';
      return;
    }

    try {
      await firebase.auth().sendPasswordResetEmail(email);
      successEl.textContent = 'Password reset email sent! Check your inbox.';
    } catch (error) {
      console.error('Password reset error:', error);
      errorEl.textContent = this.getAuthErrorMessage(error.code);
    }
  }

  // Account Settings Modal
  setupAccountSettings() {
    const modal = document.getElementById('account-modal');
    const openBtn = document.getElementById('account-settings-btn');
    const closeBtn = document.getElementById('account-modal-close');
    const linkEmailBtn = document.getElementById('link-email-btn');
    const linkGoogleBtn = document.getElementById('link-google-btn');
    const changePasswordBtn = document.getElementById('change-password-btn');

    openBtn.addEventListener('click', () => {
      this.updateAccountModal();
      modal.classList.remove('hidden');
    });

    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });

    linkEmailBtn.addEventListener('click', () => this.linkEmailAccount());
    linkGoogleBtn.addEventListener('click', () => this.linkGoogleAccount());
    changePasswordBtn.addEventListener('click', () => this.changePassword());

    // Change name button
    const changeNameBtn = document.getElementById('change-name-btn');
    changeNameBtn.addEventListener('click', () => this.changeDisplayName());
  }

  updateAccountModal() {
    const user = firebase.auth().currentUser;
    const emailEl = document.getElementById('account-email');
    const providersEl = document.getElementById('account-providers');
    const linkEmailSection = document.getElementById('link-email-section');
    const linkGoogleSection = document.getElementById('link-google-section');

    // Clear previous messages
    document.getElementById('link-error').textContent = '';
    document.getElementById('link-success').textContent = '';
    document.getElementById('password-error').textContent = '';
    document.getElementById('password-success').textContent = '';

    if (!user) {
      emailEl.textContent = 'Not signed in';
      providersEl.textContent = 'Linked: None';
      linkEmailSection.classList.add('hidden');
      linkGoogleSection.classList.add('hidden');
      return;
    }

    // Get linked providers
    const providers = user.providerData.map(p => {
      switch (p.providerId) {
        case 'password': return 'Email';
        case 'google.com': return 'Google';
        default: return p.providerId;
      }
    });

    emailEl.textContent = user.email ? `Email: ${user.email}` : 'No email linked';
    providersEl.textContent = `Linked: ${providers.length > 0 ? providers.join(', ') : 'None'}`;

    // Show/hide link sections based on what's already linked
    const hasEmail = providers.includes('Email');
    const hasGoogle = providers.includes('Google');

    linkEmailSection.classList.toggle('hidden', hasEmail);
    linkGoogleSection.classList.toggle('hidden', hasGoogle);

    // Only show change password if email is linked
    document.getElementById('change-password-section').classList.toggle('hidden', !hasEmail);
  }

  async linkEmailAccount() {
    const email = document.getElementById('link-email-input').value.trim();
    const password = document.getElementById('link-password-input').value;
    const errorEl = document.getElementById('link-error');
    const successEl = document.getElementById('link-success');

    errorEl.textContent = '';
    successEl.textContent = '';

    if (!email || !password) {
      errorEl.textContent = 'Please enter email and password';
      return;
    }

    if (password.length < 6) {
      errorEl.textContent = 'Password must be at least 6 characters';
      return;
    }

    try {
      const credential = firebase.auth.EmailAuthProvider.credential(email, password);
      await firebase.auth().currentUser.linkWithCredential(credential);
      successEl.textContent = 'Email account linked successfully!';
      this.updateAccountModal();
    } catch (error) {
      console.error('Link email error:', error);
      errorEl.textContent = this.getAuthErrorMessage(error.code);
    }
  }

  async linkGoogleAccount() {
    const errorEl = document.getElementById('link-error');
    const successEl = document.getElementById('link-success');

    errorEl.textContent = '';
    successEl.textContent = '';

    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      await firebase.auth().currentUser.linkWithPopup(provider);
      successEl.textContent = 'Google account linked successfully!';
      this.updateAccountModal();
    } catch (error) {
      console.error('Link Google error:', error);
      errorEl.textContent = this.getAuthErrorMessage(error.code);
    }
  }

  async changePassword() {
    const newPassword = document.getElementById('new-password-input').value;
    const errorEl = document.getElementById('password-error');
    const successEl = document.getElementById('password-success');

    errorEl.textContent = '';
    successEl.textContent = '';

    if (!newPassword) {
      errorEl.textContent = 'Please enter a new password';
      return;
    }

    if (newPassword.length < 6) {
      errorEl.textContent = 'Password must be at least 6 characters';
      return;
    }

    try {
      await firebase.auth().currentUser.updatePassword(newPassword);
      successEl.textContent = 'Password updated successfully!';
      document.getElementById('new-password-input').value = '';
    } catch (error) {
      console.error('Change password error:', error);
      errorEl.textContent = this.getAuthErrorMessage(error.code);
    }
  }

  async changeDisplayName() {
    const newName = document.getElementById('change-name-input').value.trim();
    const errorEl = document.getElementById('name-error');
    const successEl = document.getElementById('name-success');

    errorEl.textContent = '';
    successEl.textContent = '';

    if (!newName) {
      errorEl.textContent = 'Please enter a display name';
      return;
    }

    if (newName.length < 2) {
      errorEl.textContent = 'Name must be at least 2 characters';
      return;
    }

    if (newName.length > 20) {
      errorEl.textContent = 'Name must be 20 characters or less';
      return;
    }

    try {
      // Update on server
      if (this.socket && this.socket.connected) {
        this.socket.emit('player:updateName', { username: newName });
      }

      // Update local display
      if (this.playerManager && this.playerManager.selfPlayer) {
        this.playerManager.selfPlayer.username = newName;
        const avatarText = this.playerManager.selfPlayer.avatar?.text || ':-)';
        document.getElementById('player-name').textContent = `${avatarText} ${newName}`;
        this.playerManager.updatePlayerList();

        // Update name label in 3D view
        if (this.mapManager && this.mapManager.map3d) {
          this.mapManager.map3d.updatePlayerName(this.playerManager.selfSocketId, newName);
        }
      }

      // Update local storage for wallet users
      if (this.authType === 'wallet') {
        this.walletUsername = newName;
        localStorage.setItem('wallet_username', newName);
      }

      successEl.textContent = 'Name updated successfully!';
      document.getElementById('change-name-input').value = '';
    } catch (error) {
      console.error('Change name error:', error);
      errorEl.textContent = 'Failed to update name. Please try again.';
    }
  }

  async logout() {
    try {
      // Disconnect socket
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }

      // Sign out from Firebase if using Firebase auth
      if (this.authType === 'firebase') {
        await firebase.auth().signOut();
      }

      // Clear wallet session if using wallet auth
      if (this.authType === 'wallet') {
        localStorage.removeItem('wallet_address');
        localStorage.removeItem('wallet_username');
        this.walletAddress = null;
        this.walletUsername = null;
      }

      // Reset state
      this.user = null;
      this.authType = null;
      this.selectedAvatar = null;

      // Show login screen
      document.getElementById('game-screen').classList.add('hidden');
      document.getElementById('avatar-screen').classList.add('hidden');
      document.getElementById('username-screen').classList.add('hidden');
      document.getElementById('login-screen').classList.remove('hidden');

      // Clear login form
      document.getElementById('email-input').value = '';
      document.getElementById('password-input').value = '';
      document.getElementById('login-error').textContent = '';
      document.getElementById('login-success').textContent = '';

      // Reload page to reset all state cleanly
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async startGame() {
    // Show loading screen first
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('username-screen').classList.add('hidden');
    document.getElementById('avatar-screen').classList.add('hidden');
    document.getElementById('loading-screen').classList.remove('hidden');

    // Update loading text
    const loadingText = document.querySelector('.loading-text');
    if (loadingText) loadingText.textContent = 'Initializing world...';

    // Apply saved UI theme
    const savedUITheme = localStorage.getItem('ui_theme') || 'classic';
    this.applyUITheme(savedUITheme);

    // Small delay to show loading screen
    await new Promise(resolve => setTimeout(resolve, 300));

    // Initialize map
    if (loadingText) loadingText.textContent = 'Loading map tiles...';
    this.mapManager = new MapManager();
    await this.mapManager.init();

    // Wait for tiles to load
    if (loadingText) loadingText.textContent = 'Preparing environment...';
    await new Promise(resolve => setTimeout(resolve, 500));

    // Initialize player manager
    this.playerManager = new PlayerManager(this.mapManager);
    window.playerManager = this.playerManager; // Expose globally for equipment rendering

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

    // Set up logout button
    document.getElementById('logout-btn').addEventListener('click', () => {
      this.logout();
    });

    // Set up fast travel
    this.setupFastTravel();

    // Set up info panel toggle
    this.setupInfoPanel();

    // Set up players panel minimize
    this.setupPlayersPanel();

    // Set up account settings modal
    this.setupAccountSettings();

    // Set up map mode toggle
    this.setupMapToggle();

    // Show game screen and fade out loading screen
    document.getElementById('game-screen').classList.remove('hidden');

    // Wait a bit for rendering to complete then fade out loading screen
    await new Promise(resolve => setTimeout(resolve, 800));
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.classList.add('fade-out');

    // Remove loading screen from DOM after animation
    setTimeout(() => {
      loadingScreen.classList.add('hidden');
      loadingScreen.classList.remove('fade-out');
    }, 800);
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

  setupMapToggle() {
    const blendSlider = document.getElementById('map-blend-slider');
    if (!blendSlider) return;

    // Initialize slider from saved value
    setTimeout(() => {
      if (this.mapManager?.map3d?.tileManager) {
        const currentBlend = Math.round(this.mapManager.map3d.tileManager.satelliteBlend * 100);
        blendSlider.value = currentBlend;
      }
    }, 1000);

    // Blend slider - 0 = streets, 100 = satellite
    blendSlider.addEventListener('input', (e) => {
      const blend = parseInt(e.target.value) / 100;
      if (this.mapManager?.map3d?.tileManager) {
        this.mapManager.map3d.tileManager.setSatelliteBlend(blend);
      }
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

    const position = { lat, lng };

    // Use the map3d fast travel which resets the coordinate system
    // This handles: center update, tiles, player position, camera, NPCs
    if (this.mapManager.map3d) {
      this.mapManager.map3d.fastTravelTo(lat, lng);
    }

    // Update self player data
    if (this.playerManager.selfPlayer) {
      this.playerManager.selfPlayer.position = position;
    }

    // Update UI elements only (don't re-update 3D position)
    if (this.mapManager.minimap) {
      this.mapManager.minimap.setCenter(position);
    }
    document.getElementById('player-coords').textContent =
      `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`;
    if (this.mapManager.weatherManager) {
      this.mapManager.weatherManager.fetchWeather(position.lat, position.lng);
    }
    if (this.mapManager.skillsManager) {
      this.mapManager.skillsManager.setPlayerPosition(position);
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

      // Sync username from server (server has the authoritative copy from Firestore)
      // This ensures display name persists across sessions
      if (data.player.username && this.authType === 'wallet') {
        this.walletUsername = data.player.username;
        localStorage.setItem('wallet_username', data.player.username);
      }

      // Set user ID for skills/inventory (per-account storage)
      if (this.mapManager.skillsManager) {
        this.mapManager.skillsManager.setUserId(this.getUserId());
        // Check if player should receive test items
        this.mapManager.skillsManager.setUsername(data.player.username);
      }

      this.playerManager.setSelf(data.player);

      // Apply any locally equipped gear to the player's 3D appearance
      // This syncs localStorage equipment with the 3D sprite after it's created
      if (this.mapManager.skillsManager) {
        setTimeout(() => {
          this.mapManager.skillsManager.updatePlayerEquipment();
        }, 100);
      }

      // Immediately update position to ensure character is visible
      // This triggers proper camera positioning and coordinate display
      if (data.player.position) {
        this.playerManager.updateSelfPosition(data.player.position);
      }

      this.chatManager.addSystemMessage('Welcome to Geommo!');
    });

    this.socket.on('auth:error', (data) => {
      console.error('Authentication failed:', data.message);
      alert('Authentication failed. Please refresh and try again.');
    });

    // World state
    this.socket.on('world:state', (state) => {
      console.log('Received world state:', state);
      this.playerManager.loadWorldState(state);

      // Load NPCs from server
      if (state.npcs && this.mapManager.skillsManager) {
        this.mapManager.skillsManager.loadNPCsFromServer(state.npcs);
      }
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

    this.socket.on('player:nameUpdated', (data) => {
      this.playerManager.updatePlayerName(data.id, data.username);
    });

    // Equipment updates (cosmetic items)
    this.socket.on('player:equipmentUpdated', (data) => {
      this.playerManager.updatePlayerEquipment(data.id, data.equipment);
    });

    // Legacy support for flag updates
    this.socket.on('player:flagUpdated', (data) => {
      this.playerManager.updatePlayerAvatar(data.id, { text: data.flag, color: '#ffb000' });
    });

    // Chat events
    this.socket.on('chat:message', (data) => {
      this.chatManager.addMessage(data);
    });

    // Combat events
    this.socket.on('combat:attacked', (data) => {
      // We were attacked!
      if (this.mapManager.skillsManager) {
        const died = this.mapManager.skillsManager.takeDamage(data.damage);
        const itemName = this.mapManager.skillsManager.itemTypes[data.itemKey]?.name || 'unknown weapon';

        if (window.chatManager) {
          window.chatManager.addLogMessage(
            `⚔️ ${data.attackerName} hit you with ${itemName} for ${data.damage} damage!`,
            'error'
          );
        }
      }
    });

    this.socket.on('combat:hit', (data) => {
      // Our attack hit
      const target = this.playerManager.getPlayer(data.targetId);
      if (target && window.chatManager) {
        window.chatManager.addLogMessage(
          `⚔️ You hit ${target.username} for ${data.damage} damage!`,
          'item'
        );
      }
    });

    this.socket.on('combat:died', (data) => {
      // Someone died
      if (window.chatManager) {
        window.chatManager.addLogMessage(
          `💀 Player was defeated by ${data.killerName}!`,
          'error'
        );
      }
    });
  }

  // Attack a player
  attackPlayer(targetId) {
    if (!this.socket || !this.socket.connected) return;
    if (!this.mapManager.skillsManager) return;

    const skillsManager = this.mapManager.skillsManager;

    // Check if we have a weapon selected and can attack
    if (!skillsManager.attackPlayer(targetId)) {
      return; // Attack failed (no weapon, no ammo, etc.)
    }

    const damage = skillsManager.getCombatDamage(skillsManager.selectedCombatItem);
    const itemKey = skillsManager.selectedCombatItem;

    // Send attack to server
    this.socket.emit('combat:attack', {
      targetId,
      itemKey,
      damage
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
  const game = new Geommo();
  window.game = game; // Expose globally for combat system
  game.init();
});
