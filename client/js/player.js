// Player Manager - Handles player state and rendering
class PlayerManager {
  constructor(mapManager) {
    this.mapManager = mapManager;
    this.players = new Map(); // socketId -> player data
    this.selfPlayer = null;
    this.selfSocketId = null;
  }

  // Set the local player
  setSelf(player) {
    this.selfPlayer = player;
    this.selfSocketId = player.id;
    this.players.set(player.id, player);

    // Create marker
    this.mapManager.createPlayerMarker(player, true);

    // Update UI
    document.getElementById('player-name').textContent = `${player.flag || '🏳️'} ${player.username}`;
    this.updatePlayerList();
  }

  // Add a new player
  addPlayer(player) {
    if (this.players.has(player.id)) return;

    this.players.set(player.id, player);
    this.mapManager.createPlayerMarker(player, false);
    this.updatePlayerList();

    // Show system message
    if (window.chatManager) {
      window.chatManager.addSystemMessage(`${player.username} joined the game`);
    }
  }

  // Remove a player
  removePlayer(playerId) {
    const player = this.players.get(playerId);
    if (!player) return;

    this.players.delete(playerId);
    this.mapManager.removePlayer(playerId);
    this.updatePlayerList();

    // Show system message
    if (window.chatManager) {
      window.chatManager.addSystemMessage(`${player.username} left the game`);
    }
  }

  // Update player position
  updatePosition(playerId, position) {
    const player = this.players.get(playerId);
    if (!player) return;

    player.position = position;
    this.mapManager.updatePlayerPosition(playerId, position);
  }

  // Update self position (from local movement)
  updateSelfPosition(position) {
    if (!this.selfPlayer) return;

    this.selfPlayer.position = position;
    this.mapManager.updateSelfPosition(position);
  }

  // Load initial world state
  loadWorldState(state) {
    state.players.forEach(player => {
      if (player.id !== this.selfSocketId) {
        this.addPlayer(player);
      }
    });
  }

  // Get player by ID
  getPlayer(playerId) {
    return this.players.get(playerId);
  }

  // Get self player
  getSelf() {
    return this.selfPlayer;
  }

  // Update the player list UI
  updatePlayerList() {
    const list = document.getElementById('player-list');
    const count = document.getElementById('player-count');

    list.innerHTML = '';
    count.textContent = this.players.size;

    this.players.forEach((player, id) => {
      const li = document.createElement('li');
      li.textContent = `${player.flag || '🏳️'} ${player.username}`;
      li.dataset.playerId = id;

      if (id === this.selfSocketId) {
        li.classList.add('self');
      }

      // Click to center on player
      li.addEventListener('click', () => {
        this.mapManager.centerOn(player.position);
      });

      list.appendChild(li);
    });
  }

  // Show chat bubble for a player
  showChatBubble(playerId, message) {
    this.mapManager.showChatBubble(playerId, message);
  }

  // Update self player's flag
  updateSelfFlag(flag) {
    if (!this.selfPlayer) return;

    this.selfPlayer.flag = flag;

    // Update the marker on the map
    this.mapManager.updatePlayerFlag(this.selfSocketId, flag);

    // Update UI
    document.getElementById('player-name').textContent = `${flag} ${this.selfPlayer.username}`;

    // Update player list
    this.updatePlayerList();
  }

  // Update another player's flag
  updatePlayerFlag(playerId, flag) {
    const player = this.players.get(playerId);
    if (!player) return;

    player.flag = flag;
    this.mapManager.updatePlayerFlag(playerId, flag);
    this.updatePlayerList();
  }
}

// Export for use in other modules
window.PlayerManager = PlayerManager;
