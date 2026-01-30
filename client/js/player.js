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
    // Clean up old self player if reconnecting with a new socket ID
    if (this.selfSocketId && this.selfSocketId !== player.id) {
      console.log(`Reconnect detected: cleaning up old player ${this.selfSocketId}`);
      // Remove old self from players map and map markers
      this.players.delete(this.selfSocketId);
      this.mapManager.removePlayer(this.selfSocketId);
    }

    this.selfPlayer = player;
    this.selfSocketId = player.id;
    this.players.set(player.id, player);

    // Create marker
    this.mapManager.createPlayerMarker(player, true);

    // Update UI
    const avatarText = player.avatar?.text || player.flag || ':-)';
    document.getElementById('player-name').textContent = `${avatarText} ${player.username}`;
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

    // Don't process if this is removing our own old socket (reconnect case)
    // The server already handles this, we just need to clean up locally
    const isSelfOldConnection = (playerId !== this.selfSocketId && player.odId === this.selfPlayer?.odId);

    this.players.delete(playerId);
    this.mapManager.removePlayer(playerId);
    this.updatePlayerList();

    // Show system message (but not for our own old connection)
    if (window.chatManager && !isSelfOldConnection) {
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
      const avatarText = player.avatar?.text || player.flag || ':-)';
      li.textContent = `${avatarText} ${player.username}`;
      li.dataset.playerId = id;
      // Apply player's color if available
      if (player.avatar?.color) {
        li.style.color = player.avatar.color;
      }

      if (id === this.selfSocketId) {
        li.classList.add('self');
      } else {
        // Add attack indicator if in combat mode
        li.classList.add('attackable');
      }

      // Click handler - attack if combat mode, otherwise center
      li.addEventListener('click', (e) => {
        if (id === this.selfSocketId) {
          this.mapManager.centerOn(player.position);
          return;
        }

        // Check if in combat mode (has weapon selected)
        const skillsManager = this.mapManager.skillsManager;
        if (skillsManager && skillsManager.selectedCombatItem && window.game) {
          // Attack the player
          window.game.attackPlayer(id);
        } else {
          // Just center on player
          this.mapManager.centerOn(player.position);
        }
      });

      list.appendChild(li);
    });
  }

  // Show chat bubble for a player
  showChatBubble(playerId, message) {
    this.mapManager.showChatBubble(playerId, message);
  }

  // Update self player's avatar
  updateSelfAvatar(avatar) {
    if (!this.selfPlayer) return;

    this.selfPlayer.avatar = avatar;
    this.selfPlayer.flag = avatar.text; // Keep flag for compatibility

    // Update the marker on the map
    this.mapManager.updatePlayerAvatar(this.selfSocketId, avatar);

    // Update UI
    document.getElementById('player-name').textContent = `${avatar.text} ${this.selfPlayer.username}`;

    // Update player list
    this.updatePlayerList();
  }

  // Update another player's avatar
  updatePlayerAvatar(playerId, avatar) {
    const player = this.players.get(playerId);
    if (!player) return;

    player.avatar = avatar;
    player.flag = avatar.text; // Keep flag for compatibility
    this.mapManager.updatePlayerAvatar(playerId, avatar);
    this.updatePlayerList();
  }

  // Update another player's name
  updatePlayerName(playerId, username) {
    const player = this.players.get(playerId);
    if (!player) return;

    player.username = username;

    // Update name label in 3D view
    if (this.mapManager.map3d) {
      this.mapManager.map3d.updatePlayerName(playerId, username);
    }

    this.updatePlayerList();
  }

  // Update another player's equipment (cosmetic items)
  updatePlayerEquipment(playerId, equipment) {
    const player = this.players.get(playerId);
    if (!player) return;

    player.equipment = equipment;

    // Update 3D appearance
    if (this.mapManager.map3d) {
      this.mapManager.map3d.updatePlayerEquipment(playerId, equipment);
    }
  }

  // Legacy: Update self player's flag (for backward compatibility)
  updateSelfFlag(flag) {
    this.updateSelfAvatar({ text: flag, color: '#ffb000' });
  }

  // Legacy: Update another player's flag (for backward compatibility)
  updatePlayerFlag(playerId, flag) {
    this.updatePlayerAvatar(playerId, { text: flag, color: '#ffb000' });
  }
}

// Export for use in other modules
window.PlayerManager = PlayerManager;
