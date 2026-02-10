// Skills & Inventory System
class SkillsManager {
  constructor() {
    // User ID for per-account storage
    this.userId = null;

    // Skills - one for each weather type + HP skill + Teleportation
    this.skills = {
      hitpoints: { name: 'Hitpoints', xp: 0, icon: '❤️', isCombat: true },
      teleportation: { name: 'Teleportation', xp: 0, icon: '🌀', isTeleport: true },
      sunbathing: { name: 'Sunbathing', weather: 'clear', xp: 0, icon: '☀️' },
      cloudgazing: { name: 'Cloud Gazing', weather: 'cloudy', xp: 0, icon: '☁️' },
      mistwalking: { name: 'Mist Walking', weather: 'fog', xp: 0, icon: '🌫️' },
      raindancing: { name: 'Rain Dancing', weather: 'rain', xp: 0, icon: '🌧️' },
      snowdrifting: { name: 'Snow Drifting', weather: 'snow', xp: 0, icon: '❄️' },
      stormchasing: { name: 'Storm Chasing', weather: 'storm', xp: 0, icon: '⛈️' }
    };

    // Teleport animation state
    this.teleportAnimating = false;

    // Items that can be collected
    // accuracyBonus: added to hit chance (base 50% + skill level + accuracyBonus)
    this.itemTypes = {
      sunstone: { name: 'Sunstone', weather: 'clear', icon: '🌟', rarity: 'uncommon', sellValue: 2, accuracyBonus: 5 },
      cloudwisp: { name: 'Cloud Wisp', weather: 'cloudy', icon: '💨', rarity: 'common', sellValue: 1, accuracyBonus: 0 },
      mistessence: { name: 'Mist Essence', weather: 'fog', icon: '🫧', rarity: 'rare', sellValue: 5, accuracyBonus: 10 },
      raindrop: { name: 'Raindrop Crystal', weather: 'rain', icon: '💧', rarity: 'common', sellValue: 1, accuracyBonus: 0 },
      snowflake: { name: 'Eternal Snowflake', weather: 'snow', icon: '❆', rarity: 'uncommon', sellValue: 2, accuracyBonus: 5 },
      lightningshard: { name: 'Lightning Shard', weather: 'storm', icon: '⚡', rarity: 'rare', sellValue: 5, accuracyBonus: 10 },
      // Currency
      light: { name: 'Light', icon: '✨', rarity: 'legendary', isCurrency: true },
      // Battle NPC drops - rare items only obtainable from combat
      shadow_essence: { name: 'Shadow Essence', icon: '🌑', rarity: 'rare', sellValue: 15, droppedBy: 'Shadow Imp', accuracyBonus: 12 },
      dark_fragment: { name: 'Dark Fragment', icon: '🖤', rarity: 'epic', sellValue: 30, droppedBy: 'Shadow Imp', accuracyBonus: 20 },
      ember_shard: { name: 'Ember Shard', icon: '🔶', rarity: 'rare', sellValue: 15, droppedBy: 'Ember Sprite', accuracyBonus: 12 },
      flame_core: { name: 'Flame Core', icon: '💛', rarity: 'epic', sellValue: 30, droppedBy: 'Ember Sprite', accuracyBonus: 20 },
      ancient_bark: { name: 'Ancient Bark', icon: '🪵', rarity: 'rare', sellValue: 12, droppedBy: 'Moss Golem', accuracyBonus: 8 },
      living_vine: { name: 'Living Vine', icon: '🌱', rarity: 'epic', sellValue: 25, droppedBy: 'Moss Golem', accuracyBonus: 15 },
      crystal_shard: { name: 'Crystal Shard', icon: '💠', rarity: 'rare', sellValue: 20, droppedBy: 'Crystal Wisp', accuracyBonus: 15 },
      prismatic_gem: { name: 'Prismatic Gem', icon: '💎', rarity: 'legendary', sellValue: 50, droppedBy: 'Crystal Wisp', accuracyBonus: 25 },
      wind_fragment: { name: 'Wind Fragment', icon: '🍃', rarity: 'rare', sellValue: 15, droppedBy: 'Dust Devil', accuracyBonus: 12 },
      storm_dust: { name: 'Storm Dust', icon: '🌫️', rarity: 'epic', sellValue: 28, droppedBy: 'Dust Devil', accuracyBonus: 18 },
      frost_shard: { name: 'Frost Shard', icon: '🧊', rarity: 'rare', sellValue: 15, droppedBy: 'Frost Minion', accuracyBonus: 12 },
      frozen_heart: { name: 'Frozen Heart', icon: '💙', rarity: 'epic', sellValue: 35, droppedBy: 'Frost Minion', accuracyBonus: 22 },
      // Consumables - can be used from inventory
      health_pack: { name: 'Health Pack', icon: '🩹', rarity: 'common', sellValue: 5, healAmount: 50, isConsumable: true, buyPrice: 10 },
      super_health_pack: { name: 'Super Health Pack', icon: '💊', rarity: 'uncommon', sellValue: 15, healAmount: 150, isConsumable: true, buyPrice: 25 },
      mega_health_pack: { name: 'Mega Health Pack', icon: '❤️‍🩹', rarity: 'rare', sellValue: 40, healAmount: 400, isConsumable: true, buyPrice: 60 }
    };

    // Equipment items (wearable/visible gear) - sellValue is 50% of price
    this.equipmentTypes = {
      // Skins (change base body appearance)
      skin_snowball: { name: 'Snowball', type: 'skin', icon: '⚪', color: '#ffffff', price: 50, sellValue: 25, particle: 'snow', isEquipment: true },
      skin_lightning: { name: 'Lightning Ball', type: 'skin', icon: '⚡', color: '#ffff00', price: 75, sellValue: 37, particle: 'spark', isEquipment: true },
      skin_flame: { name: 'Flame Spirit', type: 'skin', icon: '🔥', color: '#ff4400', price: 75, sellValue: 37, particle: 'fire', isEquipment: true },
      skin_void: { name: 'Void Walker', type: 'skin', icon: '🌑', color: '#330066', price: 100, sellValue: 50, particle: 'void', isEquipment: true },
      // Hats (head-worn items) - dropBonus increases ammo drop chance
      hat_ice_tiara: { name: 'Ice Tiara', type: 'hat', icon: '👑', color: '#88ddff', price: 30, sellValue: 15, dropBonus: 5, isEquipment: true },
      hat_storm_crown: { name: 'Storm Crown', type: 'hat', icon: '⚜️', color: '#9966ff', price: 40, sellValue: 20, dropBonus: 8, isEquipment: true },
      hat_sun_halo: { name: 'Sun Halo', type: 'hat', icon: '☀️', color: '#ffcc00', price: 35, sellValue: 17, dropBonus: 6, isEquipment: true },
      hat_mist_hood: { name: 'Mist Hood', type: 'hat', icon: '🎭', color: '#aabbcc', price: 25, sellValue: 12, dropBonus: 4, isEquipment: true },
      // Held items (objects held by character) - accuracyBonus increases hit chance
      held_lightning_bolt: { name: 'Lightning Bolt', type: 'held', icon: '🗡️', color: '#ffff00', price: 45, sellValue: 22, accuracyBonus: 5, isEquipment: true },
      held_frost_staff: { name: 'Frost Staff', type: 'held', icon: '🪄', color: '#88ddff', price: 40, sellValue: 20, accuracyBonus: 4, isEquipment: true },
      held_sun_orb: { name: 'Sun Orb', type: 'held', icon: '🔮', color: '#ffaa00', price: 35, sellValue: 17, accuracyBonus: 3, isEquipment: true },
      held_void_blade: { name: 'Void Blade', type: 'held', icon: '⚔️', color: '#660099', price: 60, sellValue: 30, accuracyBonus: 7, isEquipment: true },
      // Auras (particle effects around character)
      aura_frost: { name: 'Frost Aura', type: 'aura', icon: '❄️', color: '#88ddff', price: 80, sellValue: 40, particle: 'frost', isEquipment: true },
      aura_fire: { name: 'Fire Aura', type: 'aura', icon: '🔥', color: '#ff4400', price: 80, sellValue: 40, particle: 'fire', isEquipment: true },
      aura_lightning: { name: 'Lightning Aura', type: 'aura', icon: '⚡', color: '#ffff00', price: 100, sellValue: 50, particle: 'lightning', isEquipment: true },
      aura_void: { name: 'Void Aura', type: 'aura', icon: '🌀', color: '#660099', price: 120, sellValue: 60, particle: 'void', isEquipment: true },
      aura_holy: { name: 'Holy Aura', type: 'aura', icon: '✨', color: '#ffffaa', price: 150, sellValue: 75, particle: 'holy', isEquipment: true }
    };

    // Equipped gear slots
    this.equippedGear = {
      skin: null,
      hat: null,
      held: null,
      aura: null
    };

    // Light currency balance
    this.lightBalance = 0;

    // Active trade screen
    this.activeTradeScreen = null;
    this.tradeOffer = { items: [], lightOffer: 0 };

    // Inventory - 24 slots, each slot can hold one item type
    // Format: [{ itemKey, count }, null, null, ...]
    this.inventorySlots = new Array(24).fill(null);

    // Bank - 100 slots for storage at home (like OSRS bank)
    // Format: [{ itemKey, count }, null, null, ...]
    this.bankSlots = new Array(100).fill(null);
    this.bankOpen = false;

    // Dropped items on the ground (client-side only)
    // Format: [{ id, itemKey, position: {lat, lng}, worldPos: {x,z}, createdAt, sprite }]
    this.droppedItems = [];
    this.droppedItemId = 0;

    // XP table (OSRS-style exponential)
    this.xpTable = this.generateXPTable(99);

    // Timers
    this.xpInterval = null;
    this.itemCheckInterval = null;
    this.droppedItemCheckInterval = null;
    this.currentWeather = 'clear';

    // UI elements
    this.panel = null;
    this.activeTab = 'skills';
    this.tooltip = null;

    // References to game objects (set by map.js)
    this.map3d = null;
    this.playerPosition = null;

    // Config for dropped items
    this.dropConfig = {
      despawnTime: 60000,      // 60 seconds to despawn
      maxDistance: 0.003,      // Max lat/lng distance before despawn (~300m)
      pickupDistance: 0.0002,  // Distance to pick up item (~20m) - easier pickup
      dropRadius: 0.0015       // Radius around player for drops (~150m)
    };

    // Home location
    this.homePosition = null;

    // Combat system
    this.selectedCombatItem = null;
    this.combatHealth = 100;  // Will be recalculated based on HP level
    this.maxCombatHealth = 100;  // Will be recalculated based on HP level
    this.inCombat = false;
    this.combatTarget = null;

    // NPC Merchants (Legendary Bosses) - received from server only
    this.npcs = [];
    this.activeNPCDialog = null;
    this.activeNPCMenu = null;
    this.npcCombatTarget = null;
    this.npcsInitialized = false;

    // Game tick system (600ms ticks for future features)
    this.TICK_DURATION = 600; // 0.6 seconds per tick
    this.COMBAT_TICKS = 4; // 4 ticks = 2.4 seconds between attacks
    this.gameTickInterval = null;
    this.gameTick = 0;
    this.combatTurnTick = 0;
    this.isPlayerTurn = true;

    // Combat distance settings (in lat/lng units)
    this.COMBAT_MAX_DISTANCE = 0.001; // ~100m - max distance before NPC follows
    this.COMBAT_FOLLOW_DISTANCE = 0.0005; // ~50m - NPC follows to this distance
    this.COMBAT_ESCAPE_DISTANCE = 0.002; // ~200m - escape combat if beyond this

    // Don't load here - wait for setUserId to be called with user's ID
  }

  // Generate XP table for levels 1-99
  generateXPTable(maxLevel) {
    const table = [0];
    let total = 0;
    for (let level = 1; level < maxLevel; level++) {
      const xpForLevel = Math.floor(level + 300 * Math.pow(2, level / 7));
      total += xpForLevel / 4;
      table.push(Math.floor(total));
    }
    return table;
  }

  // Get level from XP
  getLevel(xp) {
    for (let level = this.xpTable.length - 1; level >= 0; level--) {
      if (xp >= this.xpTable[level]) {
        return level + 1;
      }
    }
    return 1;
  }

  // Get XP needed for next level
  getXPForNextLevel(currentXP) {
    const currentLevel = this.getLevel(currentXP);
    if (currentLevel >= 99) return 0;
    return this.xpTable[currentLevel] - currentXP;
  }

  // Get progress to next level (0-1)
  getLevelProgress(xp) {
    const level = this.getLevel(xp);
    if (level >= 99) return 1;
    const currentLevelXP = this.xpTable[level - 1];
    const nextLevelXP = this.xpTable[level];
    return (xp - currentLevelXP) / (nextLevelXP - currentLevelXP);
  }

  // Get total XP required for a specific level
  getXPForLevel(level) {
    if (level <= 1) return 0;
    if (level > 99) return this.xpTable[98]; // Max level XP
    return this.xpTable[level - 1];
  }

  // Get HP level from hitpoints skill
  getHPLevel() {
    return this.getLevel(this.skills.hitpoints.xp);
  }

  // Calculate max HP based on hitpoints skill level (level * 100)
  calculateMaxHP() {
    return this.getHPLevel() * 100;
  }

  // Recalculate and update max HP
  updateMaxHP() {
    const newMaxHP = this.calculateMaxHP();
    const wasAtMax = this.combatHealth >= this.maxCombatHealth;
    this.maxCombatHealth = newMaxHP;

    // If player was at full HP, keep them at full HP
    if (wasAtMax) {
      this.combatHealth = this.maxCombatHealth;
    }
    // Make sure current HP doesn't exceed max
    if (this.combatHealth > this.maxCombatHealth) {
      this.combatHealth = this.maxCombatHealth;
    }
  }

  // Add HP XP from combat
  addHPXP(amount) {
    const oldLevel = this.getHPLevel();
    this.skills.hitpoints.xp += amount;
    const newLevel = this.getHPLevel();

    // Check for level up
    if (newLevel > oldLevel) {
      if (window.chatManager) {
        window.chatManager.addLogMessage(`❤️ Hitpoints leveled up! (${newLevel})`, 'levelup');
      }
      this.updateMaxHP();
      this.syncCombatStatsToServer();
    }
  }

  // Sync combat stats to server for PvP
  syncCombatStatsToServer() {
    if (window.game && window.game.socket && window.game.socket.connected) {
      window.game.socket.emit('player:updateCombatStats', {
        health: this.combatHealth,
        maxHealth: this.maxCombatHealth,
        combatLevel: this.getHPLevel()
      });
    }
  }

  // Get Teleportation level
  getTeleportationLevel() {
    return this.getLevel(this.skills.teleportation.xp);
  }

  // Add Teleportation XP (scales with destination level requirement)
  addTeleportXP(levelReq) {
    const oldLevel = this.getTeleportationLevel();
    // XP scales with level requirement: base 10 + levelReq * 5
    const xpGain = 10 + levelReq * 5;
    this.skills.teleportation.xp += xpGain;
    const newLevel = this.getTeleportationLevel();

    // Show XP gain
    if (window.chatManager) {
      window.chatManager.addLogMessage(`🌀 +${xpGain} Teleportation XP`, 'xp');
    }

    // Check for level up
    if (newLevel > oldLevel) {
      if (window.chatManager) {
        window.chatManager.addLogMessage(`🌀 Teleportation leveled up! (${newLevel})`, 'levelup');
      }
    }

    this.save();
    this.renderSkills();

    this.renderSkills();
  }

  // Initialize UI
  init() {
    this.createPanel();
    this.createTooltip();
    this.updateUI();

    // Start dropped item check interval
    this.droppedItemCheckInterval = setInterval(() => {
      this.updateDroppedItems();
    }, 1000);

    // Start game tick system (600ms ticks)
    this.startGameTick();

    return this;
  }

  // Start the game tick system
  startGameTick() {
    if (this.gameTickInterval) return;

    this.gameTickInterval = setInterval(() => {
      this.gameTick++;
      this.onGameTick();
    }, this.TICK_DURATION);
  }

  // Called every game tick (600ms)
  onGameTick() {
    // Handle combat turns and NPC following
    if (this.inCombat && this.npcCombatTarget) {
      const npc = this.npcs.find(n => n.id === this.npcCombatTarget);

      // Check distance from NPC - NPC always pursues, no escape
      if (npc && npc.position && this.playerPosition) {
        const distance = this.getDistance(this.playerPosition, npc.position);

        // If player runs beyond max distance, NPC follows
        if (distance > this.COMBAT_MAX_DISTANCE) {
          this.npcFollowPlayer(npc);
        }
      }

      this.combatTurnTick++;

      // Every 4 ticks (2.4 seconds), process a combat turn
      if (this.combatTurnTick >= this.COMBAT_TICKS) {
        this.combatTurnTick = 0;
        this.processCombatTurn();
      }
    }
  }

  // NPC follows the player when they try to run
  npcFollowPlayer(npc) {
    if (!npc || !npc.position || !this.playerPosition) return;

    // Calculate direction from NPC to player
    const dx = this.playerPosition.lng - npc.position.lng;
    const dy = this.playerPosition.lat - npc.position.lat;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return;

    // Move NPC towards player, stopping at follow distance
    const targetDistance = this.COMBAT_FOLLOW_DISTANCE;
    const moveDistance = distance - targetDistance;

    if (moveDistance > 0) {
      const normalizedX = dx / distance;
      const normalizedY = dy / distance;

      // Update NPC position
      const newPosition = {
        lat: npc.position.lat + normalizedY * moveDistance,
        lng: npc.position.lng + normalizedX * moveDistance
      };

      npc.position.lat = newPosition.lat;
      npc.position.lng = newPosition.lng;

      // Update NPC position in 3D view
      if (this.map3d) {
        this.map3d.moveNPCToPosition(npc.id, newPosition);
      }

      if (window.chatManager) {
        window.chatManager.addLogMessage(`⚔️ ${npc.name} pursues you!`, 'combat');
      }
    }
  }

  // Create the skills/inventory panel
  createPanel() {
    this.panel = document.createElement('div');
    this.panel.id = 'skills-panel';
    this.panel.className = 'ui-panel';
    this.panel.innerHTML = `
      <div class="panel-header">
        <div class="skills-tabs">
          <button class="skills-tab" data-tab="home" title="Home">🏠</button>
          <button class="skills-tab active" data-tab="skills" title="Skills">⭐</button>
          <button class="skills-tab" data-tab="inventory" title="Inventory">📦</button>
          <button class="skills-tab" data-tab="combat" title="Combat">⚔️</button>
          <button class="skills-tab" data-tab="equipment" title="Equipment">🛡️</button>
          <button class="skills-tab" data-tab="teleports" title="Teleports">🌍</button>
        </div>
      </div>
      <div id="home-content" class="home-content hidden"></div>
      <div id="skills-content" class="skills-content"></div>
      <div id="inventory-content" class="inventory-content hidden"></div>
      <div id="combat-content" class="combat-content hidden"></div>
      <div id="equipment-content" class="equipment-content hidden"></div>
      <div id="teleports-content" class="teleports-content hidden"></div>
    `;

    // Add to UI overlay
    const uiOverlay = document.getElementById('ui-overlay');
    if (uiOverlay) {
      uiOverlay.appendChild(this.panel);
    }

    // Tab switching
    this.panel.querySelectorAll('.skills-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchTab(tab.dataset.tab);
      });
    });
  }

  // Create tooltip element
  createTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.id = 'skill-tooltip';
    this.tooltip.className = 'skill-tooltip hidden';
    document.body.appendChild(this.tooltip);
  }

  // Show tooltip
  showTooltip(skill, element) {
    const level = this.getLevel(skill.xp);
    const progress = this.getLevelProgress(skill.xp);
    const xpToNext = this.getXPForNextLevel(skill.xp);

    this.tooltip.innerHTML = `
      <div class="tooltip-header">${skill.icon} ${skill.name}</div>
      <div class="tooltip-level">Level ${level}</div>
      <div class="tooltip-xp">XP: ${Math.floor(skill.xp).toLocaleString()}</div>
      <div class="tooltip-progress-bar">
        <div class="tooltip-progress-fill" style="width: ${progress * 100}%"></div>
      </div>
      <div class="tooltip-next">${xpToNext > 0 ? `${xpToNext.toLocaleString()} XP to next level` : 'MAX LEVEL'}</div>
    `;

    const rect = element.getBoundingClientRect();
    this.tooltip.style.left = `${rect.left}px`;
    this.tooltip.style.top = `${rect.bottom + 5}px`;
    this.tooltip.classList.remove('hidden');
  }

  // Hide tooltip
  hideTooltip() {
    this.tooltip.classList.add('hidden');
  }

  // Switch between tabs
  switchTab(tabName) {
    this.activeTab = tabName;

    // Update tab buttons
    this.panel.querySelectorAll('.skills-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Update content visibility
    document.getElementById('home-content').classList.toggle('hidden', tabName !== 'home');
    document.getElementById('skills-content').classList.toggle('hidden', tabName !== 'skills');
    document.getElementById('inventory-content').classList.toggle('hidden', tabName !== 'inventory');
    document.getElementById('combat-content').classList.toggle('hidden', tabName !== 'combat');
    document.getElementById('equipment-content').classList.toggle('hidden', tabName !== 'equipment');
    document.getElementById('teleports-content').classList.toggle('hidden', tabName !== 'teleports');

    this.updateUI();
  }

  // Update UI display
  updateUI() {
    if (this.activeTab === 'skills') {
      this.renderSkills();
    } else if (this.activeTab === 'inventory') {
      this.renderInventory();
    } else if (this.activeTab === 'home') {
      this.renderHome();
    } else if (this.activeTab === 'combat') {
      this.renderCombat();
    } else if (this.activeTab === 'equipment') {
      this.renderEquipment();
    } else if (this.activeTab === 'teleports') {
      this.renderTeleports();
    }
  }

  // Render skills tab as grid (same layout as inventory)
  renderSkills() {
    const container = document.getElementById('skills-content');
    if (!container) return;

    const skillEntries = Object.entries(this.skills);

    // Calculate total level
    let totalLevel = 0;
    for (const [key, skill] of skillEntries) {
      totalLevel += this.getLevel(skill.xp);
    }

    let html = `
      <div class="skills-panel-header">
        <span class="skills-total-label">Total Level</span>
        <span class="skills-total-value">${totalLevel}</span>
      </div>
      <div class="skills-list">
    `;

    // Render each skill as a detailed row
    for (const [key, skill] of skillEntries) {
      const level = this.getLevel(skill.xp);
      const isActive = this.getSkillForWeather(this.currentWeather) === key;
      const xpForCurrentLevel = this.getXPForLevel(level);
      const xpForNextLevel = this.getXPForLevel(level + 1);
      const currentXP = skill.xp - xpForCurrentLevel;
      const neededXP = xpForNextLevel - xpForCurrentLevel;
      const progress = Math.min(100, (currentXP / neededXP) * 100);

      // Skill type badge
      let typeBadge = '';
      if (skill.isCombat) {
        typeBadge = '<span class="skill-type-badge combat">Combat</span>';
      } else if (skill.isTeleport) {
        typeBadge = '<span class="skill-type-badge utility">Utility</span>';
      } else if (skill.weather) {
        typeBadge = `<span class="skill-type-badge weather">${this.getWeatherEmoji(skill.weather)}</span>`;
      }

      html += `
        <div class="skill-row ${isActive ? 'active' : ''}" data-skill="${key}">
          <div class="skill-row-icon">${skill.icon}</div>
          <div class="skill-row-info">
            <div class="skill-row-header">
              <span class="skill-row-name">${skill.name}</span>
              ${typeBadge}
            </div>
            <div class="skill-row-progress">
              <div class="skill-progress-bar">
                <div class="skill-progress-fill" style="width: ${progress}%"></div>
              </div>
              <span class="skill-row-xp">${currentXP}/${neededXP} XP</span>
            </div>
          </div>
          <div class="skill-row-level">${level}</div>
        </div>
      `;
    }

    html += '</div>';
    container.innerHTML = html;

    // Add hover listeners for tooltips
    container.querySelectorAll('.skill-row[data-skill]').forEach(row => {
      const skillKey = row.dataset.skill;
      const skill = this.skills[skillKey];

      row.addEventListener('mouseenter', () => this.showTooltip(skill, row));
      row.addEventListener('mouseleave', () => this.hideTooltip());
    });
  }

  // Get weather emoji for skill badge
  getWeatherEmoji(weather) {
    const emojis = {
      clear: '☀️',
      cloudy: '☁️',
      fog: '🌫️',
      rain: '🌧️',
      snow: '❄️',
      storm: '⛈️'
    };
    return emojis[weather] || '🌤️';
  }

  // Render inventory tab
  renderInventory() {
    const container = document.getElementById('inventory-content');
    if (!container) return;

    // Light balance display at top
    let html = `
      <div class="inventory-light-balance">
        <span class="light-icon">✨</span>
        <span class="light-amount">${this.lightBalance}</span>
        <span class="light-label">Light</span>
      </div>
    `;

    html += '<div class="inventory-grid">';

    for (let i = 0; i < 24; i++) {
      const slot = this.inventorySlots[i];
      const hasItem = slot && slot.count > 0;
      const item = hasItem ? this.getItemType(slot.itemKey) : null;
      const isEquipment = hasItem && this.isEquipmentItem(slot.itemKey);

      html += `
        <div class="inventory-slot ${hasItem ? 'has-item' : ''} ${isEquipment ? 'equipment-item' : ''}"
             data-slot="${i}"
             ${hasItem ? `title="${item.name}${isEquipment ? ' (Equipment)' : ''}"` : ''}
             draggable="${hasItem}">
          ${hasItem ? `<span class="item-icon" ${isEquipment ? `style="color: ${item.color}"` : ''}>${item.icon}</span>` : ''}
          ${hasItem ? `<span class="item-count">${slot.count}</span>` : ''}
          ${isEquipment ? '<span class="equipment-badge">E</span>' : ''}
        </div>
      `;
    }

    html += '</div>';
    container.innerHTML = html;

    // Set up drag and drop
    this.setupDragAndDrop();

    // Set up click handlers for context menu
    this.setupInventoryClickHandlers();
  }

  // Set up click handlers for inventory items
  setupInventoryClickHandlers() {
    const slots = document.querySelectorAll('.inventory-slot.has-item');
    slots.forEach(slot => {
      slot.addEventListener('click', (e) => {
        const slotIndex = parseInt(slot.dataset.slot);
        this.showItemContextMenu(slotIndex, e);
      });
    });
  }

  // Set up drag and drop for inventory
  setupDragAndDrop() {
    const slots = document.querySelectorAll('.inventory-slot');
    let draggedSlot = null;

    slots.forEach(slot => {
      slot.addEventListener('dragstart', (e) => {
        if (!slot.classList.contains('has-item')) {
          e.preventDefault();
          return;
        }
        draggedSlot = parseInt(slot.dataset.slot);
        slot.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });

      slot.addEventListener('dragend', () => {
        slot.classList.remove('dragging');
        draggedSlot = null;
      });

      slot.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        slot.classList.add('drag-over');
      });

      slot.addEventListener('dragleave', () => {
        slot.classList.remove('drag-over');
      });

      slot.addEventListener('drop', (e) => {
        e.preventDefault();
        slot.classList.remove('drag-over');

        const targetSlot = parseInt(slot.dataset.slot);
        if (draggedSlot !== null && draggedSlot !== targetSlot) {
          this.swapSlots(draggedSlot, targetSlot);
        }
      });
    });
  }

  // Swap two inventory slots
  swapSlots(from, to) {
    const temp = this.inventorySlots[to];
    this.inventorySlots[to] = this.inventorySlots[from];
    this.inventorySlots[from] = temp;
    this.renderInventory();
    this.save();
  }

  // ============== BANK SYSTEM ==============

  // Deposit item from inventory to bank
  depositToBank(inventorySlot, count = null) {
    const invSlot = this.inventorySlots[inventorySlot];
    if (!invSlot || invSlot.count <= 0) return false;

    const depositCount = count || invSlot.count; // Deposit all if count not specified
    const actualCount = Math.min(depositCount, invSlot.count);

    // Find existing stack in bank or empty slot
    let bankSlotIndex = this.bankSlots.findIndex(
      s => s && s.itemKey === invSlot.itemKey
    );

    if (bankSlotIndex === -1) {
      // Find empty slot
      bankSlotIndex = this.bankSlots.findIndex(s => s === null);
      if (bankSlotIndex === -1) {
        if (window.chatManager) {
          window.chatManager.addLogMessage('❌ Bank is full!', 'error');
        }
        return false;
      }
      this.bankSlots[bankSlotIndex] = { itemKey: invSlot.itemKey, count: 0 };
    }

    // Transfer items
    this.bankSlots[bankSlotIndex].count += actualCount;
    invSlot.count -= actualCount;

    if (invSlot.count <= 0) {
      this.inventorySlots[inventorySlot] = null;
    }

    this.save();
    this.renderBank();
    this.renderInventory();

    const item = this.getItemType(invSlot.itemKey);
    if (window.chatManager && item) {
      window.chatManager.addLogMessage(`📥 Deposited ${actualCount}x ${item.icon} ${item.name}`, 'info');
    }

    return true;
  }

  // Deposit all inventory items to bank
  depositAllToBank() {
    let deposited = 0;
    for (let i = 0; i < this.inventorySlots.length; i++) {
      if (this.inventorySlots[i] && this.inventorySlots[i].count > 0) {
        if (this.depositToBank(i)) {
          deposited++;
        }
      }
    }
    if (deposited > 0 && window.chatManager) {
      window.chatManager.addLogMessage(`📥 Deposited all items to bank`, 'info');
    }
  }

  // Withdraw item from bank to inventory
  withdrawFromBank(bankSlot, count = null) {
    const slot = this.bankSlots[bankSlot];
    if (!slot || slot.count <= 0) return false;

    const withdrawCount = count || slot.count; // Withdraw all if count not specified
    const actualCount = Math.min(withdrawCount, slot.count);

    // Find existing stack in inventory or empty slot
    let invSlotIndex = this.inventorySlots.findIndex(
      s => s && s.itemKey === slot.itemKey
    );

    if (invSlotIndex === -1) {
      // Find empty slot
      invSlotIndex = this.inventorySlots.findIndex(s => s === null);
      if (invSlotIndex === -1) {
        if (window.chatManager) {
          window.chatManager.addLogMessage('❌ Inventory is full!', 'error');
        }
        return false;
      }
      this.inventorySlots[invSlotIndex] = { itemKey: slot.itemKey, count: 0 };
    }

    // Transfer items
    this.inventorySlots[invSlotIndex].count += actualCount;
    slot.count -= actualCount;

    if (slot.count <= 0) {
      this.bankSlots[bankSlot] = null;
    }

    this.save();
    this.renderBank();
    this.renderInventory();

    const item = this.getItemType(slot.itemKey);
    if (window.chatManager && item) {
      window.chatManager.addLogMessage(`📤 Withdrew ${actualCount}x ${item.icon} ${item.name}`, 'info');
    }

    return true;
  }

  // Get bank item count
  getBankItemCount() {
    return this.bankSlots.filter(s => s && s.count > 0).length;
  }

  // Open bank interface
  openBank() {
    if (!this.isNearHome()) {
      if (window.chatManager) {
        window.chatManager.addLogMessage('❌ You must be at your home to access the bank!', 'error');
      }
      return;
    }

    this.bankOpen = true;
    this.showBankScreen();
  }

  // Close bank interface
  closeBank() {
    this.bankOpen = false;
    const screen = document.querySelector('.bank-screen');
    if (screen) screen.remove();
  }

  // Show home choice dialog (Bank or Shop)
  showHomeChoice() {
    if (!this.isNearHome()) {
      if (window.chatManager) {
        window.chatManager.addLogMessage('❌ You must be at your home to access this!', 'error');
      }
      return;
    }

    // Close any existing dialog
    this.closeHomeChoice();

    const dialog = document.createElement('div');
    dialog.className = 'home-choice-dialog';
    dialog.innerHTML = `
      <div class="home-choice-overlay"></div>
      <div class="home-choice-content">
        <div class="home-choice-header">
          <span class="home-choice-icon">🏠</span>
          <h3>Home</h3>
        </div>
        <div class="home-choice-buttons">
          <button class="home-choice-btn bank-choice" id="choice-bank-btn">
            <span class="choice-icon">🏦</span>
            <span class="choice-label">Bank</span>
            <span class="choice-desc">${this.getBankItemCount()}/100 items</span>
          </button>
          <button class="home-choice-btn shop-choice" id="choice-shop-btn">
            <span class="choice-icon">🏪</span>
            <span class="choice-label">Shop</span>
            <span class="choice-desc">Buy & Sell</span>
          </button>
        </div>
        <button class="home-choice-close">✕</button>
      </div>
    `;

    document.body.appendChild(dialog);
    this.activeHomeChoice = dialog;

    // Event handlers
    dialog.querySelector('.home-choice-overlay')?.addEventListener('click', () => this.closeHomeChoice());
    dialog.querySelector('.home-choice-close')?.addEventListener('click', () => this.closeHomeChoice());

    dialog.querySelector('#choice-bank-btn')?.addEventListener('click', () => {
      this.closeHomeChoice();
      this.openBank();
    });

    dialog.querySelector('#choice-shop-btn')?.addEventListener('click', () => {
      this.closeHomeChoice();
      this.showHomeShop();
    });
  }

  // Close home choice dialog
  closeHomeChoice() {
    if (this.activeHomeChoice) {
      this.activeHomeChoice.remove();
      this.activeHomeChoice = null;
    }
  }

  // Show bank screen UI
  showBankScreen() {
    // Remove existing
    this.closeBank();
    this.bankOpen = true;

    const screen = document.createElement('div');
    screen.className = 'bank-screen';
    screen.innerHTML = `
      <div class="bank-overlay"></div>
      <div class="bank-content">
        <div class="bank-header">
          <h3>🏦 Bank</h3>
          <span class="bank-slots-used">${this.getBankItemCount()}/100 slots</span>
          <button class="bank-close-btn">✕</button>
        </div>
        <div class="bank-body">
          <div class="bank-section">
            <div class="bank-section-header">
              <h4>Bank Storage</h4>
              <button class="osrs-btn small-btn" id="deposit-all-btn">Deposit All</button>
            </div>
            <div class="bank-grid" id="bank-grid"></div>
          </div>
          <div class="bank-section inventory-section">
            <h4>Inventory</h4>
            <div class="bank-inventory-grid" id="bank-inventory-grid"></div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(screen);

    // Close button
    screen.querySelector('.bank-close-btn').addEventListener('click', () => this.closeBank());
    screen.querySelector('.bank-overlay').addEventListener('click', () => this.closeBank());

    // Deposit all button
    screen.querySelector('#deposit-all-btn').addEventListener('click', () => {
      this.depositAllToBank();
    });

    this.renderBank();
  }

  // Render bank grid
  renderBank() {
    const bankGrid = document.getElementById('bank-grid');
    const invGrid = document.getElementById('bank-inventory-grid');
    if (!bankGrid || !invGrid) return;

    // Render bank slots (100 slots, show first 50 by default)
    let bankHtml = '';
    for (let i = 0; i < 100; i++) {
      const slot = this.bankSlots[i];
      const hasItem = slot && slot.count > 0;
      const item = hasItem ? this.getItemType(slot.itemKey) : null;

      bankHtml += `
        <div class="bank-slot ${hasItem ? 'has-item' : ''}" data-bank-slot="${i}">
          ${hasItem ? `
            <span class="slot-icon">${item?.icon || '?'}</span>
            <span class="slot-count">${slot.count}</span>
          ` : ''}
        </div>
      `;
    }
    bankGrid.innerHTML = bankHtml;

    // Render inventory slots
    let invHtml = '';
    for (let i = 0; i < 24; i++) {
      const slot = this.inventorySlots[i];
      const hasItem = slot && slot.count > 0;
      const item = hasItem ? this.getItemType(slot.itemKey) : null;

      invHtml += `
        <div class="bank-inv-slot ${hasItem ? 'has-item' : ''}" data-inv-slot="${i}">
          ${hasItem ? `
            <span class="slot-icon">${item?.icon || '?'}</span>
            <span class="slot-count">${slot.count}</span>
          ` : ''}
        </div>
      `;
    }
    invGrid.innerHTML = invHtml;

    // Add click handlers for bank slots (withdraw)
    bankGrid.querySelectorAll('.bank-slot.has-item').forEach(slot => {
      slot.addEventListener('click', (e) => {
        const bankSlot = parseInt(slot.dataset.bankSlot);
        // Shift+click = withdraw all, otherwise withdraw 1
        const count = e.shiftKey ? null : 1;
        this.withdrawFromBank(bankSlot, count);
      });
    });

    // Add click handlers for inventory slots (deposit)
    invGrid.querySelectorAll('.bank-inv-slot.has-item').forEach(slot => {
      slot.addEventListener('click', (e) => {
        const invSlot = parseInt(slot.dataset.invSlot);
        // Shift+click = deposit all, otherwise deposit 1
        const count = e.shiftKey ? null : 1;
        this.depositToBank(invSlot, count);
      });
    });

    // Update slots used counter
    const slotsUsed = document.querySelector('.bank-slots-used');
    if (slotsUsed) {
      slotsUsed.textContent = `${this.getBankItemCount()}/100 slots`;
    }
  }

  // ============== END BANK SYSTEM ==============

  // Render home tab
  renderHome() {
    const container = document.getElementById('home-content');
    if (!container) return;

    const hasHome = this.homePosition !== null;
    const posText = hasHome
      ? `${this.homePosition.lat.toFixed(4)}, ${this.homePosition.lng.toFixed(4)}`
      : 'Not set';

    // Check if player is near home (within ~50 meters)
    const isNearHome = hasHome && this.isNearHome();

    // Get current player name
    const playerName = window.game?.walletUsername || window.game?.currentUser?.displayName || 'Player';

    container.innerHTML = `
      <div class="home-panel compact">
        <!-- Player Section -->
        <div class="home-section player-section">
          <h4>👤 ${playerName}</h4>
          <div class="home-buttons-grid">
            <button class="osrs-btn small-btn" id="home-change-avatar-btn">Avatar</button>
            <button class="osrs-btn small-btn" id="home-account-btn">Account</button>
            <button class="osrs-btn small-btn" id="home-info-btn">Info</button>
            <button class="osrs-btn small-btn logout-btn" id="home-logout-btn">Logout</button>
          </div>
        </div>

        <!-- Home Location Section -->
        <div class="home-section home-location-section">
          <div class="home-location-row">
            <span class="home-location-label">🏠 ${hasHome ? posText : 'Not set'}</span>
            <button class="osrs-btn tiny-btn" id="set-home-btn">${hasHome ? 'Update' : 'Set'}</button>
          </div>
          ${hasHome ? `
            <button class="osrs-btn small-btn home-tp-btn" id="teleport-home-btn">🏠 Teleport Home</button>
          ` : ''}
        </div>

        ${hasHome ? `
        <!-- Shop & Bank Compact Row -->
        <div class="home-services-row ${isNearHome ? '' : 'disabled'}">
          <button class="osrs-btn service-btn shop-service ${isNearHome ? '' : 'disabled'}" id="open-home-shop-btn" ${isNearHome ? '' : 'disabled'}>
            <span class="service-icon">🏪</span>
            <span class="service-label">Shop</span>
          </button>
          <button class="osrs-btn service-btn bank-service ${isNearHome ? '' : 'disabled'}" id="open-bank-btn" ${isNearHome ? '' : 'disabled'}>
            <span class="service-icon">🏦</span>
            <span class="service-label">Bank</span>
            <span class="service-count">${this.getBankItemCount()}/100</span>
          </button>
        </div>
        ${!isNearHome ? `<p class="home-away-msg">Go home to access services</p>` : ''}
        ` : ''}
      </div>
    `;

    // Player buttons
    document.getElementById('home-change-avatar-btn')?.addEventListener('click', () => {
      window.game?.showChangeAvatarScreen();
    });

    document.getElementById('home-account-btn')?.addEventListener('click', () => {
      document.getElementById('account-modal')?.classList.remove('hidden');
    });

    document.getElementById('home-info-btn')?.addEventListener('click', () => {
      document.getElementById('info-button')?.classList.add('hidden');
      document.getElementById('info-panel')?.classList.remove('hidden');
    });

    document.getElementById('home-logout-btn')?.addEventListener('click', () => {
      window.game?.logout();
    });

    // Set home button
    document.getElementById('set-home-btn')?.addEventListener('click', () => {
      this.setHomePosition();
    });

    // Teleport home button
    document.getElementById('teleport-home-btn')?.addEventListener('click', () => {
      this.teleportHome();
    });

    // Open home shop button
    document.getElementById('open-home-shop-btn')?.addEventListener('click', () => {
      this.showHomeShop();
    });

    // Open bank button
    document.getElementById('open-bank-btn')?.addEventListener('click', () => {
      this.openBank();
    });
  }

  // Check if player is near their home location
  isNearHome() {
    if (!this.homePosition || !this.playerPosition) return false;

    // Calculate distance (roughly 0.0005 lat/lng ≈ 50 meters)
    const latDiff = Math.abs(this.playerPosition.lat - this.homePosition.lat);
    const lngDiff = Math.abs(this.playerPosition.lng - this.homePosition.lng);
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

    return distance < 0.0005; // ~50 meters
  }

  // Set current position as home
  setHomePosition() {
    if (!this.playerPosition) return;

    this.homePosition = { ...this.playerPosition };
    this.save();
    this.renderHome();

    // Create physical home shop entity in 3D world
    if (this.map3d) {
      this.map3d.createHomeShop(this.homePosition);
    }

    // Sync home position to server for persistence across sessions
    if (window.game?.socket?.connected) {
      window.game.socket.emit('player:setHome', { position: this.homePosition });
    }

    // Update minimap home marker
    if (window.game?.mapManager) {
      window.game.mapManager.createMinimapHomeMarker(this.homePosition);
    }

    if (window.chatManager) {
      window.chatManager.addLogMessage('🏠 Home location set!', 'info');
    }
  }

  // Teleport to home position (16 game ticks = 9600ms animation)
  teleportHome() {
    if (!this.homePosition || !window.game) return;

    // Prevent teleporting while already teleporting
    if (this.teleportAnimating) {
      if (window.chatManager) {
        window.chatManager.addLogMessage('❌ Already teleporting!', 'error');
      }
      return;
    }

    // Start home teleport animation (16 game ticks = 9600ms)
    this.teleportAnimating = true;
    const animDuration = 9600; // 16 ticks * 600ms

    // Show casting message
    if (window.chatManager) {
      window.chatManager.addLogMessage('🏠 Casting Home Teleport... (this takes a while)', 'info');
    }

    // Show home teleport animation (generic/home style)
    this.showHomeTeleportAnimation(animDuration);

    // After animation, perform actual teleport
    setTimeout(() => {
      window.game.fastTravelTo(this.homePosition.lat, this.homePosition.lng);

      if (window.chatManager) {
        window.chatManager.addLogMessage('🏠 Teleported home!', 'info');
      }

      this.teleportAnimating = false;
    }, animDuration);
  }

  // Show home teleport animation (longer, generic style)
  showHomeTeleportAnimation(duration) {
    // Remove any existing animation
    const existing = document.querySelector('.teleport-animation-overlay');
    if (existing) existing.remove();

    // Create overlay with home-specific style
    const overlay = document.createElement('div');
    overlay.className = 'teleport-animation-overlay anim-home';
    overlay.innerHTML = `
      <div class="teleport-vortex home-vortex">
        <div class="teleport-ring ring-1"></div>
        <div class="teleport-ring ring-2"></div>
        <div class="teleport-ring ring-3"></div>
        <div class="home-glow"></div>
        <div class="teleport-center-icon">🏠</div>
      </div>
      <div class="teleport-particles"></div>
      <div class="teleport-text">Home Teleport</div>
      <div class="teleport-timer"></div>
      <div class="teleport-progress-bar">
        <div class="teleport-progress-fill"></div>
      </div>
    `;

    // Set home teleport color (warm golden)
    overlay.style.setProperty('--tp-color', '#ffcc44');

    document.body.appendChild(overlay);

    // Generate particles (more for longer animation)
    const particleContainer = overlay.querySelector('.teleport-particles');
    for (let i = 0; i < 80; i++) {
      const particle = document.createElement('div');
      particle.className = 'teleport-particle';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.animationDelay = `${Math.random() * 2}s`;
      particle.style.animationDuration = `${1 + Math.random() * 2}s`;
      particleContainer.appendChild(particle);
    }

    // Animate progress bar
    const progressFill = overlay.querySelector('.teleport-progress-fill');
    progressFill.style.transition = `width ${duration}ms linear`;
    requestAnimationFrame(() => {
      progressFill.style.width = '100%';
    });

    // Update countdown timer
    const timerEl = overlay.querySelector('.teleport-timer');
    let remaining = Math.ceil(duration / 1000);
    timerEl.textContent = `${remaining}s`;
    const timerInterval = setInterval(() => {
      remaining--;
      if (remaining > 0) {
        timerEl.textContent = `${remaining}s`;
      } else {
        clearInterval(timerInterval);
      }
    }, 1000);

    // Flash effect at end
    setTimeout(() => {
      overlay.classList.add('teleport-flash');
    }, duration - 300);

    // Remove overlay after animation
    setTimeout(() => {
      clearInterval(timerInterval);
      overlay.classList.add('teleport-fade-out');
      setTimeout(() => overlay.remove(), 300);
    }, duration);
  }

  // Show home shop dialog
  showHomeShop() {
    // Close any existing shop
    this.closeHomeShop();

    // Get sellable items from inventory (including equipment)
    const sellableItems = this.inventorySlots
      .filter(slot => slot && slot.count > 0)
      .map(slot => {
        // Check both itemTypes and equipmentTypes
        const item = this.itemTypes[slot.itemKey] || this.equipmentTypes[slot.itemKey];
        return item ? { ...slot, item } : null;
      })
      .filter(Boolean);

    // Build sellable items HTML
    let sellHtml = '';
    if (sellableItems.length === 0) {
      sellHtml = '<p class="shop-empty">No items to sell</p>';
    } else {
      sellHtml = '<div class="shop-sell-grid">';
      for (const slot of sellableItems) {
        const sellValue = slot.item.sellValue || 1;
        sellHtml += `
          <div class="shop-item sellable" data-item="${slot.itemKey}">
            <span class="shop-item-icon">${slot.item.icon}</span>
            <span class="shop-item-name">${slot.item.name}</span>
            <span class="shop-item-qty">x${slot.count}</span>
            <span class="shop-item-price">✨${sellValue}</span>
          </div>
        `;
      }
      sellHtml += '</div>';
    }

    // Build buyable items HTML (health packs)
    const buyableItems = [
      { key: 'health_pack', item: this.itemTypes['health_pack'] },
      { key: 'super_health_pack', item: this.itemTypes['super_health_pack'] },
      { key: 'mega_health_pack', item: this.itemTypes['mega_health_pack'] }
    ].filter(b => b.item);

    let buyHtml = '<div class="shop-buy-grid">';
    for (const buyable of buyableItems) {
      const canAfford = this.lightBalance >= buyable.item.buyPrice;
      buyHtml += `
        <div class="shop-item buyable ${canAfford ? '' : 'disabled'}" data-item="${buyable.key}">
          <span class="shop-item-icon">${buyable.item.icon}</span>
          <span class="shop-item-name">${buyable.item.name}</span>
          <span class="shop-item-heal">+${buyable.item.healAmount} HP</span>
          <span class="shop-item-price">✨${buyable.item.buyPrice}</span>
        </div>
      `;
    }
    buyHtml += '</div>';

    // Create shop dialog
    const shop = document.createElement('div');
    shop.className = 'home-shop-menu';
    shop.innerHTML = `
      <div class="npc-menu-overlay"></div>
      <div class="home-shop-content">
        <div class="shop-header">
          <span class="shop-icon">🏪</span>
          <h3>Home Shop</h3>
          <span class="shop-balance">✨ ${this.lightBalance} Light</span>
        </div>
        <div class="shop-sections">
          <div class="shop-section">
            <h4>💰 Sell Items</h4>
            ${sellHtml}
            ${sellableItems.length > 0 ? `
              <button class="osrs-btn sell-all-btn" id="sell-all-btn">Sell All Items</button>
            ` : ''}
          </div>
          <div class="shop-section">
            <h4>🛒 Buy Health Packs</h4>
            ${buyHtml}
          </div>
        </div>
        <button class="npc-menu-close">✕</button>
      </div>
    `;

    document.body.appendChild(shop);
    this.activeHomeShop = shop;

    // Event handlers
    shop.querySelector('.npc-menu-overlay')?.addEventListener('click', () => this.closeHomeShop());
    shop.querySelector('.npc-menu-close')?.addEventListener('click', () => this.closeHomeShop());

    // Sell individual items
    shop.querySelectorAll('.shop-item.sellable').forEach(el => {
      el.addEventListener('click', () => {
        const itemKey = el.dataset.item;
        this.sellItem(itemKey, 1);
        this.showHomeShop(); // Refresh
      });
    });

    // Sell all items
    shop.querySelector('#sell-all-btn')?.addEventListener('click', () => {
      this.sellAllItems();
      this.showHomeShop(); // Refresh
    });

    // Buy items
    shop.querySelectorAll('.shop-item.buyable:not(.disabled)').forEach(el => {
      el.addEventListener('click', () => {
        const itemKey = el.dataset.item;
        this.buyItem(itemKey);
        this.showHomeShop(); // Refresh
      });
    });
  }

  // Close home shop
  closeHomeShop() {
    if (this.activeHomeShop) {
      this.activeHomeShop.remove();
      this.activeHomeShop = null;
    }
  }

  // Sell a single item (including equipment)
  sellItem(itemKey, count = 1) {
    const slotIndex = this.inventorySlots.findIndex(
      s => s && s.itemKey === itemKey && s.count > 0
    );
    if (slotIndex === -1) return;

    // Check both itemTypes and equipmentTypes
    const item = this.itemTypes[itemKey] || this.equipmentTypes[itemKey];
    if (!item) return;

    const sellValue = item.sellValue || 1;
    const actualCount = Math.min(count, this.inventorySlots[slotIndex].count);
    const totalValue = sellValue * actualCount;

    this.inventorySlots[slotIndex].count -= actualCount;
    if (this.inventorySlots[slotIndex].count <= 0) {
      this.inventorySlots[slotIndex] = null;
    }

    this.lightBalance += totalValue;
    this.save();
    this.renderInventory();

    if (window.chatManager) {
      window.chatManager.addLogMessage(`💰 Sold ${item.icon} ${item.name} x${actualCount} for ✨${totalValue} Light`, 'item');
    }
  }

  // Sell all items in inventory (including equipment)
  sellAllItems() {
    let totalValue = 0;
    let itemsSold = 0;

    for (let i = 0; i < this.inventorySlots.length; i++) {
      const slot = this.inventorySlots[i];
      if (!slot || slot.count <= 0) continue;

      // Check both itemTypes and equipmentTypes
      const item = this.itemTypes[slot.itemKey] || this.equipmentTypes[slot.itemKey];
      if (!item) continue;

      // Don't sell health packs or consumables
      if (item.isConsumable) continue;

      const sellValue = item.sellValue || 1;
      totalValue += sellValue * slot.count;
      itemsSold += slot.count;
      this.inventorySlots[i] = null;
    }

    if (itemsSold > 0) {
      this.lightBalance += totalValue;
      this.save();
      this.renderInventory();

      if (window.chatManager) {
        window.chatManager.addLogMessage(`💰 Sold ${itemsSold} items for ✨${totalValue} Light!`, 'item');
      }
    }
  }

  // Buy an item
  buyItem(itemKey) {
    const item = this.itemTypes[itemKey];
    if (!item || !item.buyPrice) return;

    if (this.lightBalance < item.buyPrice) {
      if (window.chatManager) {
        window.chatManager.addLogMessage(`❌ Not enough Light! Need ✨${item.buyPrice}`, 'error');
      }
      return;
    }

    // Find empty slot or existing stack
    let slotIndex = this.inventorySlots.findIndex(
      s => s && s.itemKey === itemKey
    );

    if (slotIndex === -1) {
      slotIndex = this.inventorySlots.findIndex(s => s === null);
    }

    if (slotIndex === -1) {
      if (window.chatManager) {
        window.chatManager.addLogMessage('❌ Inventory full!', 'error');
      }
      return;
    }

    this.lightBalance -= item.buyPrice;

    if (this.inventorySlots[slotIndex] && this.inventorySlots[slotIndex].itemKey === itemKey) {
      this.inventorySlots[slotIndex].count++;
    } else {
      this.inventorySlots[slotIndex] = { itemKey, count: 1 };
    }

    this.save();
    this.renderInventory();

    if (window.chatManager) {
      window.chatManager.addLogMessage(`🛒 Bought ${item.icon} ${item.name} for ✨${item.buyPrice} Light`, 'item');
    }
  }

  // Get all ammo types that can be used for combat
  getAllAmmoTypes() {
    // Return all weather-based ammo types
    return ['sunstone', 'cloudwisp', 'mistessence', 'raindrop', 'snowflake', 'lightningshard'];
  }

  // Get safe zone locations (city teleport destinations)
  getSafeZones() {
    return this.getTeleportDestinations().map(dest => ({
      name: dest.name,
      lat: dest.lat,
      lng: dest.lng,
      radius: 0.01 // ~1km radius - large safe zone around each city
    }));
  }

  // Check if a position is in a safe zone
  isInSafeZone(lat, lng) {
    const safeZones = this.getSafeZones();
    for (const zone of safeZones) {
      const distance = this.getDistance({ lat, lng }, { lat: zone.lat, lng: zone.lng });
      if (distance < zone.radius) {
        return zone.name;
      }
    }
    return null;
  }

  // Render combat tab
  renderCombat() {
    const container = document.getElementById('combat-content');
    if (!container) return;

    // Get all ammo types and their counts
    const allAmmoTypes = this.getAllAmmoTypes();
    const combatItems = this.getCombatItems();

    // Build ammo grid showing all types (even with 0 count)
    let itemsHtml = '<div class="combat-ammo-grid">';
    for (const itemKey of allAmmoTypes) {
      const itemType = this.itemTypes[itemKey];
      if (!itemType) continue;

      // Find count in inventory
      const inventoryItem = combatItems.find(i => i.itemKey === itemKey);
      const count = inventoryItem ? inventoryItem.count : 0;
      const isSelected = this.selectedCombatItem === itemKey;
      const damage = this.getCombatDamage(itemKey);
      const isEmpty = count === 0;

      itemsHtml += `
        <div class="combat-ammo-slot ${isSelected ? 'selected' : ''} ${isEmpty ? 'empty' : ''}"
             data-item="${itemKey}"
             title="${itemType.name}${isEmpty ? ' (none)' : ''}">
          <span class="ammo-icon">${itemType.icon}</span>
          <span class="ammo-qty">${count}</span>
          <span class="ammo-dmg">${damage}</span>
        </div>
      `;
    }
    itemsHtml += '</div>';

    // Health display
    const healthPercent = (this.combatHealth / this.maxCombatHealth) * 100;

    // Check if player is in safe zone
    const safeZoneName = this.playerPosition ?
      this.isInSafeZone(this.playerPosition.lat, this.playerPosition.lng) : null;

    // Zone status display
    const zoneStatusHtml = safeZoneName ?
      `<div class="zone-status safe">🛡️ Safe Zone: ${safeZoneName}</div>` :
      `<div class="zone-status pvp">⚔️ PvP Zone - Combat Enabled</div>`;

    container.innerHTML = `
      <div class="combat-panel">
        <div class="combat-health">
          <span class="health-label">HP</span>
          <div class="health-bar">
            <div class="health-fill" style="width: ${healthPercent}%"></div>
          </div>
          <span class="health-text">${this.combatHealth}/${this.maxCombatHealth}</span>
        </div>

        <div class="combat-section">
          <h4>⚔️ Ammo</h4>
          ${itemsHtml}
        </div>

        ${this.selectedCombatItem ? `
          <div class="combat-stats">
            <div class="combat-stat">🎯 ${Math.round(this.getAccuracy(this.selectedCombatItem))}%</div>
            <div class="combat-stat">💥 ${this.getMaxHit(this.selectedCombatItem)}</div>
          </div>
        ` : ''}
        ${zoneStatusHtml}
      </div>
    `;

    // Combat item selection (only allow selecting if count > 0)
    container.querySelectorAll('.combat-ammo-slot:not(.empty)').forEach(el => {
      el.addEventListener('click', () => {
        const itemKey = el.dataset.item;
        this.selectCombatItem(itemKey);
      });
    });
  }

  // Render equipment tab
  renderEquipment() {
    const container = document.getElementById('equipment-content');
    if (!container) return;

    // Consolidated equipment slots with inline stats
    const slotTypes = ['skin', 'hat', 'held', 'aura'];
    const slotNames = { skin: 'Skin', hat: 'Hat', held: 'Held', aura: 'Aura' };
    const slotIcons = { skin: '👤', hat: '🎩', held: '🗡️', aura: '✨' };

    // Calculate total bonuses
    const totalAccuracy = this.getEquipmentAccuracyBonus();
    const totalDrop = this.getEquipmentDropBonus();

    // Build total bonuses header if any
    let totalsHtml = '';
    if (totalAccuracy > 0 || totalDrop > 0) {
      totalsHtml = '<div class="equip-totals-bar">';
      if (totalAccuracy > 0) {
        totalsHtml += `<span class="equip-stat accuracy">🎯 +${totalAccuracy}%</span>`;
      }
      if (totalDrop > 0) {
        totalsHtml += `<span class="equip-stat drop">🍀 +${totalDrop}%</span>`;
      }
      totalsHtml += '</div>';
    }

    // Build consolidated slot rows
    let slotsHtml = '<div class="equipment-list">';
    for (const slotType of slotTypes) {
      const equipped = this.equippedGear[slotType];
      const gear = equipped ? this.equipmentTypes[equipped] : null;

      // Build stats string
      let statsHtml = '';
      if (gear) {
        const stats = [];
        if (gear.particle) stats.push(`✨${gear.particle}`);
        if (gear.accuracyBonus) stats.push(`🎯+${gear.accuracyBonus}%`);
        if (gear.dropBonus) stats.push(`🍀+${gear.dropBonus}%`);
        if (stats.length > 0) {
          statsHtml = `<span class="eq-row-stats">${stats.join(' ')}</span>`;
        }
      }

      slotsHtml += `
        <div class="equip-row ${equipped ? 'equipped' : ''}" data-slot="${slotType}" title="${equipped ? 'Click to unequip' : 'Empty slot'}">
          <span class="eq-row-slot">${slotNames[slotType]}</span>
          <span class="eq-row-icon" ${gear ? `style="color: ${gear.color}"` : ''}>${gear ? gear.icon : slotIcons[slotType]}</span>
          <span class="eq-row-name">${gear ? gear.name : '—'}</span>
          ${statsHtml}
        </div>
      `;
    }
    slotsHtml += '</div>';

    // Count equipped items
    const equippedCount = slotTypes.filter(s => this.equippedGear[s]).length;

    container.innerHTML = `
      <div class="equipment-panel-consolidated">
        <div class="equipment-header">
          <span class="equipment-header-icon">🛡️</span>
          <span class="equipment-header-title">Equipment</span>
          <span class="equipment-header-count">${equippedCount}/4</span>
        </div>
        ${totalsHtml}
        ${slotsHtml}
        <div class="equipment-tip">
          <span class="tip-icon">💡</span>
          <span class="tip-text">Equip gear from inventory for combat bonuses</span>
        </div>
      </div>
    `;

    // Click handlers for unequipping gear
    container.querySelectorAll('.equip-row.equipped').forEach(el => {
      el.addEventListener('click', () => {
        const slotType = el.dataset.slot;
        this.unequipGear(slotType);
      });
    });
  }

  // Teleport destinations with level requirements and ammo costs
  // Scaling: Training (1-20), Battle NPCs (20-40), Boss (40+)
  getTeleportDestinations() {
    return [
      // === TRAINING CITIES (Level 1-20) ===
      // Beginner - cloudwisp/raindrop (common ammo)
      { name: 'Paris', lat: 48.8566, lng: 2.3522, levelReq: 1, ammoCost: 1, ammoType: 'cloudwisp', difficulty: 'Training', category: 'training' },
      { name: 'Los Angeles', lat: 34.0522, lng: -118.2437, levelReq: 1, ammoCost: 1, ammoType: 'cloudwisp', difficulty: 'Training', category: 'training' },
      { name: 'Berlin', lat: 52.5200, lng: 13.4050, levelReq: 3, ammoCost: 1, ammoType: 'raindrop', difficulty: 'Training', category: 'training' },
      { name: 'Singapore', lat: 1.3521, lng: 103.8198, levelReq: 5, ammoCost: 2, ammoType: 'cloudwisp', difficulty: 'Training', category: 'training' },
      { name: 'Dubai', lat: 25.2048, lng: 55.2708, levelReq: 7, ammoCost: 2, ammoType: 'raindrop', difficulty: 'Training', category: 'training' },
      { name: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729, levelReq: 10, ammoCost: 2, ammoType: 'cloudwisp', difficulty: 'Training', category: 'training' },
      { name: 'Mumbai', lat: 19.0760, lng: 72.8777, levelReq: 12, ammoCost: 3, ammoType: 'raindrop', difficulty: 'Training', category: 'training' },
      { name: 'Cairo', lat: 30.0444, lng: 31.2357, levelReq: 15, ammoCost: 3, ammoType: 'cloudwisp', difficulty: 'Training', category: 'training' },

      // === EXPLORATION CITIES (Level 5-25) - No NPCs ===
      { name: 'San Francisco', lat: 37.7749, lng: -122.4194, levelReq: 5, ammoCost: 2, ammoType: 'cloudwisp', difficulty: 'Exploration', category: 'explore' },
      { name: 'Chicago', lat: 41.8781, lng: -87.6298, levelReq: 8, ammoCost: 2, ammoType: 'raindrop', difficulty: 'Exploration', category: 'explore' },
      { name: 'Miami', lat: 25.7617, lng: -80.1918, levelReq: 10, ammoCost: 2, ammoType: 'sunstone', difficulty: 'Exploration', category: 'explore' },
      { name: 'Toronto', lat: 43.6532, lng: -79.3832, levelReq: 12, ammoCost: 3, ammoType: 'snowflake', difficulty: 'Exploration', category: 'explore' },
      { name: 'Vancouver', lat: 49.2827, lng: -123.1207, levelReq: 15, ammoCost: 3, ammoType: 'raindrop', difficulty: 'Exploration', category: 'explore' },
      { name: 'Mexico City', lat: 19.4326, lng: -99.1332, levelReq: 15, ammoCost: 3, ammoType: 'sunstone', difficulty: 'Exploration', category: 'explore' },
      { name: 'Buenos Aires', lat: -34.6037, lng: -58.3816, levelReq: 18, ammoCost: 3, ammoType: 'cloudwisp', difficulty: 'Exploration', category: 'explore' },
      { name: 'Rome', lat: 41.9028, lng: 12.4964, levelReq: 18, ammoCost: 3, ammoType: 'sunstone', difficulty: 'Exploration', category: 'explore' },
      { name: 'Madrid', lat: 40.4168, lng: -3.7038, levelReq: 20, ammoCost: 3, ammoType: 'sunstone', difficulty: 'Exploration', category: 'explore' },
      { name: 'Amsterdam', lat: 52.3676, lng: 4.9041, levelReq: 20, ammoCost: 3, ammoType: 'raindrop', difficulty: 'Exploration', category: 'explore' },
      { name: 'Barcelona', lat: 41.3851, lng: 2.1734, levelReq: 22, ammoCost: 4, ammoType: 'sunstone', difficulty: 'Exploration', category: 'explore' },
      { name: 'Vienna', lat: 48.2082, lng: 16.3738, levelReq: 22, ammoCost: 4, ammoType: 'snowflake', difficulty: 'Exploration', category: 'explore' },
      { name: 'Prague', lat: 50.0755, lng: 14.4378, levelReq: 25, ammoCost: 4, ammoType: 'mistessence', difficulty: 'Exploration', category: 'explore' },

      // === BATTLE NPC CITIES (Level 20-40) ===
      { name: 'Seoul', lat: 37.5665, lng: 126.9780, levelReq: 20, ammoCost: 4, ammoType: 'snowflake', difficulty: 'Battle NPCs', category: 'battle' },
      { name: 'Beijing', lat: 39.9042, lng: 116.4074, levelReq: 22, ammoCost: 4, ammoType: 'sunstone', difficulty: 'Battle NPCs', category: 'battle' },
      { name: 'Shanghai', lat: 31.2304, lng: 121.4737, levelReq: 25, ammoCost: 5, ammoType: 'snowflake', difficulty: 'Battle NPCs', category: 'battle' },
      { name: 'Hong Kong', lat: 22.3193, lng: 114.1694, levelReq: 28, ammoCost: 5, ammoType: 'mistessence', difficulty: 'Battle NPCs', category: 'battle' },
      { name: 'Bangkok', lat: 13.7563, lng: 100.5018, levelReq: 30, ammoCost: 5, ammoType: 'sunstone', difficulty: 'Battle NPCs', category: 'battle' },
      { name: 'Moscow', lat: 55.7558, lng: 37.6173, levelReq: 32, ammoCost: 6, ammoType: 'snowflake', difficulty: 'Battle NPCs', category: 'battle' },
      { name: 'Melbourne', lat: -37.8136, lng: 144.9631, levelReq: 35, ammoCost: 6, ammoType: 'mistessence', difficulty: 'Battle NPCs', category: 'battle' },
      { name: 'Brisbane', lat: -27.4698, lng: 153.0251, levelReq: 38, ammoCost: 6, ammoType: 'snowflake', difficulty: 'Battle NPCs', category: 'battle' },
      { name: 'Auckland', lat: -36.8509, lng: 174.7645, levelReq: 40, ammoCost: 7, ammoType: 'mistessence', difficulty: 'Battle NPCs', category: 'battle' },
      { name: 'Cape Town', lat: -33.9249, lng: 18.4241, levelReq: 42, ammoCost: 7, ammoType: 'lightningshard', difficulty: 'Battle NPCs', category: 'battle' },
      { name: 'Lagos', lat: 6.5244, lng: 3.3792, levelReq: 45, ammoCost: 8, ammoType: 'lightningshard', difficulty: 'Battle NPCs', category: 'battle' },

      // === BOSS CITIES (Level 40+) ===
      { name: 'Sydney', lat: -33.8688, lng: 151.2093, levelReq: 40, ammoCost: 8, ammoType: 'snowflake', difficulty: 'Boss: Glacius', boss: true, category: 'boss' },
      { name: 'Tokyo', lat: 35.6762, lng: 139.6503, levelReq: 50, ammoCost: 10, ammoType: 'lightningshard', difficulty: 'Boss: Voltarus', boss: true, category: 'boss' },
      { name: 'London', lat: 51.5074, lng: -0.1278, levelReq: 60, ammoCost: 12, ammoType: 'mistessence', difficulty: 'Boss: Nyx', boss: true, category: 'boss' },
      { name: 'New York', lat: 40.758896, lng: -73.985130, levelReq: 70, ammoCost: 15, ammoType: 'lightningshard', difficulty: 'Boss: Solara', boss: true, category: 'boss' }
    ];
  }

  // Directional teleport config: direction -> ammo type
  getDirectionalConfig() {
    return {
      N:  { label: 'N',  angle: 0,   ammoType: 'snowflake', icon: '⬆️' },
      NE: { label: 'NE', angle: 45,  ammoType: 'lightningshard', icon: '↗️' },
      E:  { label: 'E',  angle: 90,  ammoType: 'sunstone', icon: '➡️' },
      SE: { label: 'SE', angle: 135, ammoType: 'sunstone', icon: '↘️' },
      S:  { label: 'S',  angle: 180, ammoType: 'sunstone', icon: '⬇️' },
      SW: { label: 'SW', angle: 225, ammoType: 'mistessence', icon: '↙️' },
      W:  { label: 'W',  angle: 270, ammoType: 'raindrop', icon: '⬅️' },
      NW: { label: 'NW', angle: 315, ammoType: 'cloudwisp', icon: '↖️' }
    };
  }

  // Calculate ammo cost based on distance (1 ammo per 25km, minimum 1)
  getDirectionalAmmoCost(distanceKm) {
    return Math.max(1, Math.ceil(distanceKm / 25));
  }

  // Get max teleport distance based on teleport level (100km at level 1, scales up)
  getMaxTeleportDistance() {
    const level = this.getTeleportationLevel();
    // Level 1 = 100km, each level adds 100km, capped at 5000km
    return Math.min(5000, level * 100);
  }

  // Show directional teleport info modal
  showTeleportInfoModal() {
    // Remove existing
    document.querySelector('.tp-info-modal')?.remove();

    const maxDistance = this.getMaxTeleportDistance();
    const teleportLevel = this.getTeleportationLevel();

    const modal = document.createElement('div');
    modal.className = 'tp-info-modal';
    modal.innerHTML = `
      <div class="tp-info-modal-overlay"></div>
      <div class="tp-info-modal-content">
        <div class="tp-info-modal-header">
          <span>🧭 Directional Teleport Info</span>
          <button class="tp-info-modal-close">✕</button>
        </div>
        <div class="tp-info-modal-body">
          <div class="tp-info-section">
            <div class="tp-info-label">Direction → Ammo Type</div>
            <div class="tp-info-ammo-grid">
              <span>⬆️ N = ❄️ Snowflake</span>
              <span>↗️ NE = ⚡ Lightning</span>
              <span>➡️ E = ☀️ Sunstone</span>
              <span>↘️ SE = ☀️ Sunstone</span>
              <span>⬇️ S = ☀️ Sunstone</span>
              <span>↙️ SW = 🫧 Mist</span>
              <span>⬅️ W = 💧 Raindrop</span>
              <span>↖️ NW = 💨 Cloudwisp</span>
            </div>
          </div>
          <div class="tp-info-section">
            <div class="tp-info-label">Cost</div>
            <div class="tp-info-text">1 ammo per 25km</div>
          </div>
          <div class="tp-info-section">
            <div class="tp-info-label">Your Max Distance</div>
            <div class="tp-info-text">${maxDistance}km (Level ${teleportLevel})</div>
            <div class="tp-info-subtext">+100km per teleport level</div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.tp-info-modal-overlay')?.addEventListener('click', () => modal.remove());
    modal.querySelector('.tp-info-modal-close')?.addEventListener('click', () => modal.remove());
  }

  // Render teleports tab
  renderTeleports() {
    const container = document.getElementById('teleports-content');
    if (!container) return;

    // Don't allow new teleports while animating
    if (this.teleportAnimating) return;

    const destinations = this.getTeleportDestinations();
    const teleportLevel = this.getTeleportationLevel();
    const directionalConfig = this.getDirectionalConfig();
    const maxDistance = this.getMaxTeleportDistance();

    // Initialize selected distance
    if (!this.selectedTeleportDistance) this.selectedTeleportDistance = Math.min(50, maxDistance);
    if (this.selectedTeleportDistance > maxDistance) this.selectedTeleportDistance = maxDistance;

    // Preserve scroll position
    const existingList = container.querySelector('.tp-cities-list');
    const scrollTop = existingList ? existingList.scrollTop : 0;

    // Group destinations by category
    const categories = {
      training: { name: '🎯', destinations: [] },
      explore: { name: '🗺️', destinations: [] },
      battle: { name: '⚔️', destinations: [] },
      boss: { name: '👑', destinations: [] }
    };

    for (const dest of destinations) {
      const cat = dest.category || 'explore';
      if (categories[cat]) {
        categories[cat].destinations.push(dest);
      }
    }

    // Build city teleports as clickable list
    let citiesListHtml = '<div class="tp-cities-list" id="tp-cities-list">';
    for (const [catKey, category] of Object.entries(categories)) {
      if (category.destinations.length === 0) continue;
      for (const dest of category.destinations) {
        const meetsLevel = teleportLevel >= dest.levelReq;
        const ammoItem = this.itemTypes[dest.ammoType];
        const ammoCount = this.getItemCount(dest.ammoType);
        const hasAmmo = ammoCount >= dest.ammoCost;
        const canTeleport = meetsLevel && hasAmmo;

        citiesListHtml += `
          <div class="tp-city-item ${canTeleport ? 'available' : 'locked'}"
               data-lat="${dest.lat}" data-lng="${dest.lng}" data-ammo="${dest.ammoType}"
               data-cost="${dest.ammoCost}" data-levelreq="${dest.levelReq}" data-name="${dest.name}">
            <span class="tp-city-cat">${category.name}</span>
            <span class="tp-city-name">${dest.name}</span>
            <span class="tp-city-cost">${ammoItem?.icon || '?'}${dest.ammoCost}</span>
          </div>
        `;
      }
    }
    citiesListHtml += '</div>';

    let citiesHtml = `
      <div class="tp-cities-section">
        <div class="tp-section-header">
          <span>🌍 Cities</span>
          <span class="tp-level-badge">Lv.${teleportLevel}</span>
        </div>
        ${citiesListHtml}
      </div>
    `;

    // Build directional teleport - click direction to teleport
    let compassHtml = '<div class="tp-compass-grid">';
    const compassOrder = ['NW', 'N', 'NE', 'W', 'C', 'E', 'SW', 'S', 'SE'];
    for (const dir of compassOrder) {
      if (dir === 'C') {
        compassHtml += `<div class="tp-compass-center-new">🧭</div>`;
      } else {
        const config = directionalConfig[dir];
        const ammoCost = this.getDirectionalAmmoCost(this.selectedTeleportDistance);
        const ammoItem = this.itemTypes[config.ammoType];
        const ammoCount = this.getItemCount(config.ammoType);
        const canTeleport = ammoCount >= ammoCost;

        compassHtml += `
          <div class="tp-dir-btn ${canTeleport ? 'available' : 'locked'}" data-dir="${dir}" title="${dir}: ${ammoItem?.icon}${ammoCost} (have ${ammoCount})">
            <span class="tp-dir-icon">${config.icon}</span>
            <span class="tp-dir-label">${dir}</span>
          </div>
        `;
      }
    }
    compassHtml += '</div>';

    let directionalHtml = `
      <div class="tp-directional-section">
        <div class="tp-section-header">
          <span>🧭 Directional</span>
          <button class="tp-info-btn" id="tp-info-btn" title="Info">ℹ️</button>
        </div>

        <div class="tp-slider-row">
          <span class="tp-slider-label">5km</span>
          <input type="range" id="tp-distance-slider" min="5" max="${maxDistance}" step="5" value="${this.selectedTeleportDistance}" />
          <span class="tp-slider-val" id="tp-slider-val">${this.selectedTeleportDistance}km</span>
        </div>

        ${compassHtml}
      </div>
    `;

    container.innerHTML = `
      <div class="teleports-panel compact">
        ${citiesHtml}
        ${directionalHtml}
      </div>
    `;

    // Restore scroll position
    const newList = container.querySelector('#tp-cities-list');
    if (newList && scrollTop > 0) {
      newList.scrollTop = scrollTop;
    }

    // City click to teleport
    container.querySelectorAll('.tp-city-item.available').forEach(el => {
      el.addEventListener('click', () => {
        if (this.teleportAnimating) return;
        const lat = parseFloat(el.dataset.lat);
        const lng = parseFloat(el.dataset.lng);
        const ammoType = el.dataset.ammo;
        const ammoCost = parseInt(el.dataset.cost);
        const levelReq = parseInt(el.dataset.levelreq);
        const destName = el.dataset.name;
        this.teleportTo(lat, lng, ammoType, ammoCost, levelReq, destName);
      });
    });

    // Info button - opens modal
    container.querySelector('#tp-info-btn')?.addEventListener('click', () => {
      this.showTeleportInfoModal();
    });

    // Distance slider - just updates value display and re-renders compass costs
    const slider = container.querySelector('#tp-distance-slider');
    const sliderVal = container.querySelector('#tp-slider-val');
    slider?.addEventListener('input', (e) => {
      this.selectedTeleportDistance = parseInt(e.target.value);
      if (sliderVal) sliderVal.textContent = `${this.selectedTeleportDistance}km`;

      // Update compass button states
      const compassBtns = container.querySelectorAll('.tp-dir-btn');
      compassBtns.forEach(btn => {
        const dir = btn.dataset.dir;
        const config = directionalConfig[dir];
        const ammoCost = this.getDirectionalAmmoCost(this.selectedTeleportDistance);
        const ammoItem = this.itemTypes[config.ammoType];
        const ammoCount = this.getItemCount(config.ammoType);
        const canTeleport = ammoCount >= ammoCost;

        btn.className = `tp-dir-btn ${canTeleport ? 'available' : 'locked'}`;
        btn.title = `${dir}: ${ammoItem?.icon}${ammoCost} (have ${ammoCount})`;
      });
    });

    // Direction buttons - click to teleport
    container.querySelectorAll('.tp-dir-btn.available').forEach(el => {
      el.addEventListener('click', () => {
        if (this.teleportAnimating) return;
        const dir = el.dataset.dir;
        this.teleportDirectional(dir, this.selectedTeleportDistance);
      });
    });
  }

  // ========================================
  // ADMIN TOOLS - Remove this entire section to disable admin functionality
  // ========================================
  renderAdminTools() {
    const container = document.getElementById('admin-panel-content');
    if (!container) return;

    // Build ammo buttons
    const ammoTypes = this.getAllAmmoTypes();
    let adminAmmoHtml = '';
    for (const ammoKey of ammoTypes) {
      const item = this.itemTypes[ammoKey];
      if (item) {
        adminAmmoHtml += `<button class="admin-give-btn" data-item="${ammoKey}" data-amount="50">${item.icon}+50</button>`;
      }
    }

    // Build equipment buttons
    let adminEquipHtml = '';
    for (const [key, item] of Object.entries(this.equipmentTypes)) {
      adminEquipHtml += `<button class="admin-give-btn equip" data-item="${key}" data-amount="1">${item.icon}</button>`;
    }

    container.innerHTML = `
      <div class="admin-section">
        <div class="admin-section-label">Ammo</div>
        <div class="admin-btns">${adminAmmoHtml}</div>
      </div>
      <div class="admin-section">
        <div class="admin-section-label">Gear</div>
        <div class="admin-btns">${adminEquipHtml}</div>
      </div>
      <div class="admin-section">
        <div class="admin-section-label">Light</div>
        <div class="admin-btns">
          <button class="admin-give-btn light" data-light="100">+100</button>
          <button class="admin-give-btn light" data-light="1000">+1k</button>
          <button class="admin-give-btn light" data-light="10000">+10k</button>
        </div>
      </div>
      <div class="admin-section">
        <div class="admin-section-label">Health</div>
        <div class="admin-btns">
          <button class="admin-action-btn" data-action="fullheal">❤️ Heal</button>
          <button class="admin-action-btn" data-action="damage50">-50</button>
          <button class="admin-action-btn" data-action="kill">💀</button>
        </div>
      </div>
      <div class="admin-section">
        <div class="admin-section-label">Teleport</div>
        <div class="admin-btns">
          <button class="admin-action-btn" data-action="tphome">🏠</button>
          <button class="admin-action-btn" data-action="tpnyc">🗽</button>
          <button class="admin-action-btn" data-action="tptokyo">🗼</button>
        </div>
      </div>
      <div class="admin-section">
        <div class="admin-section-label">XP</div>
        <div class="admin-btns">
          <button class="admin-action-btn" data-action="xp100">+100</button>
          <button class="admin-action-btn" data-action="xp1000">+1k</button>
        </div>
      </div>
    `;

    // Admin give item buttons
    container.querySelectorAll('.admin-give-btn:not(.light)').forEach(el => {
      el.addEventListener('click', () => {
        const itemKey = el.dataset.item;
        const amount = parseInt(el.dataset.amount) || 1;
        this.addItem(itemKey, amount);
        const item = this.itemTypes[itemKey] || this.equipmentTypes[itemKey];
        if (window.chatManager && item) {
          window.chatManager.addLogMessage(`🔧 Admin: Added ${amount}x ${item.icon} ${item.name}`, 'system');
        }
        this.updateUI();
        this.save();
      });
    });

    // Admin give light buttons
    container.querySelectorAll('.admin-give-btn.light').forEach(el => {
      el.addEventListener('click', () => {
        const amount = parseInt(el.dataset.light) || 100;
        this.lightBalance += amount;
        if (window.chatManager) {
          window.chatManager.addLogMessage(`🔧 Admin: Added ${amount} Light`, 'system');
        }
        this.updateUI();
        this.save();
      });
    });

    // Admin action buttons
    container.querySelectorAll('.admin-action-btn').forEach(el => {
      el.addEventListener('click', () => {
        const action = el.dataset.action;
        switch (action) {
          case 'fullheal':
            this.combatHealth = this.maxCombatHealth;
            if (window.chatManager) {
              window.chatManager.addLogMessage(`🔧 Admin: Full heal!`, 'system');
            }
            this.renderCombat();
            break;
          case 'damage50':
            this.combatHealth = Math.max(0, this.combatHealth - 50);
            if (window.chatManager) {
              window.chatManager.addLogMessage(`🔧 Admin: Took 50 damage (${this.combatHealth}/${this.maxCombatHealth})`, 'system');
            }
            this.renderCombat();
            break;
          case 'kill':
            this.combatHealth = 0;
            this.die();
            break;
          case 'tphome':
            if (window.mapManager) {
              window.mapManager.goToHome();
            }
            break;
          case 'tpnyc':
            if (window.mapManager) {
              window.mapManager.setPosition({ lat: 40.758896, lng: -73.985130 });
            }
            break;
          case 'tptokyo':
            if (window.mapManager) {
              window.mapManager.setPosition({ lat: 35.6762, lng: 139.6503 });
            }
            break;
          case 'xp100':
            for (const skill of Object.values(this.skills)) {
              skill.xp += 100;
            }
            if (window.chatManager) {
              window.chatManager.addLogMessage(`🔧 Admin: Added 100 XP to all skills`, 'system');
            }
            this.updateUI();
            this.save();
            break;
          case 'xp1000':
            for (const skill of Object.values(this.skills)) {
              skill.xp += 1000;
            }
            if (window.chatManager) {
              window.chatManager.addLogMessage(`🔧 Admin: Added 1000 XP to all skills`, 'system');
            }
            this.updateUI();
            this.save();
            break;
        }
      });
    });
  }
  // ========================================
  // END ADMIN TOOLS SECTION
  // ========================================

  // Teleport in a specific direction by distance
  teleportDirectional(direction, distanceKm) {
    if (this.teleportAnimating) {
      if (window.chatManager) {
        window.chatManager.addLogMessage('❌ Already teleporting!', 'error');
      }
      return;
    }

    const config = this.getDirectionalConfig()[direction];
    if (!config) return;

    const ammoCost = this.getDirectionalAmmoCost(distanceKm);
    const ammoType = config.ammoType;

    // Check and consume ammo
    let remaining = ammoCost;
    for (let i = 0; i < this.inventorySlots.length && remaining > 0; i++) {
      const slot = this.inventorySlots[i];
      if (slot && slot.itemKey === ammoType && slot.count > 0) {
        const take = Math.min(slot.count, remaining);
        slot.count -= take;
        remaining -= take;
        if (slot.count <= 0) {
          this.inventorySlots[i] = null;
        }
      }
    }

    if (remaining > 0) {
      if (window.chatManager) {
        const ammoItem = this.itemTypes[ammoType];
        window.chatManager.addLogMessage(`❌ Not enough ${ammoItem?.icon || ''} ${ammoItem?.name || 'ammo'}! Need ${ammoCost}`, 'error');
      }
      return;
    }

    // Calculate destination based on direction and distance
    const currentPos = this.playerPosition;
    if (!currentPos) return;

    // Convert angle to radians (0 = North, clockwise)
    const angleRad = (config.angle * Math.PI) / 180;

    // Approximate: 1 degree latitude ≈ 111km, longitude varies by latitude
    const kmPerDegreeLat = 111;
    const kmPerDegreeLng = 111 * Math.cos(currentPos.lat * Math.PI / 180);

    // Calculate offset
    const latOffset = (distanceKm * Math.cos(angleRad)) / kmPerDegreeLat;
    const lngOffset = (distanceKm * Math.sin(angleRad)) / kmPerDegreeLng;

    const destLat = currentPos.lat + latOffset;
    const destLng = currentPos.lng + lngOffset;

    // Start teleport animation
    this.teleportAnimating = true;
    const animDuration = 2400;
    const ammoItem = this.itemTypes[ammoType];

    if (window.chatManager) {
      window.chatManager.addLogMessage(`🧭 Teleporting ${distanceKm}km ${direction}...`, 'info');
    }

    this.showTeleportAnimation(ammoType, animDuration);
    this.save();
    this.renderInventory();
    this.renderTeleports();

    setTimeout(() => {
      if (window.game) {
        window.game.fastTravelTo(destLat, destLng);
      }

      // Add XP based on ammo used, scaled with teleport level
      // Formula: base XP per ammo * ammo used * (1 + level bonus)
      const teleportLevel = this.getTeleportationLevel();
      const baseXPPerAmmo = 15;
      const levelMultiplier = 1 + (teleportLevel * 0.1); // 10% more XP per level
      const xpGain = Math.floor(ammoCost * baseXPPerAmmo * levelMultiplier);
      this.addTeleportXP(xpGain);

      if (window.chatManager) {
        window.chatManager.addLogMessage(`🧭 Arrived ${distanceKm}km ${direction}! Used ${ammoCost}x ${ammoItem?.icon || ''} ${ammoItem?.name || 'ammo'}`, 'info');
      }

      this.teleportAnimating = false;
      this.renderTeleports();
    }, animDuration);
  }

  // Teleport to a destination (consumes ammo, plays animation)
  teleportTo(lat, lng, ammoType, ammoCost, levelReq, destName) {
    // Prevent teleporting while already teleporting
    if (this.teleportAnimating) {
      if (window.chatManager) {
        window.chatManager.addLogMessage('❌ Already teleporting!', 'error');
      }
      return;
    }

    // Find and consume ammo first
    let remaining = ammoCost;
    for (let i = 0; i < this.inventorySlots.length && remaining > 0; i++) {
      const slot = this.inventorySlots[i];
      if (slot && slot.itemKey === ammoType && slot.count > 0) {
        const take = Math.min(slot.count, remaining);
        slot.count -= take;
        remaining -= take;
        if (slot.count <= 0) {
          this.inventorySlots[i] = null;
        }
      }
    }

    if (remaining > 0) {
      if (window.chatManager) {
        window.chatManager.addLogMessage('❌ Not enough ammo to teleport!', 'error');
      }
      return;
    }

    // Start teleport animation (4 game ticks = 2400ms)
    this.teleportAnimating = true;
    const animDuration = 2400;
    const ammoItem = this.itemTypes[ammoType];

    // Show casting message
    if (window.chatManager) {
      window.chatManager.addLogMessage(`🌀 Casting teleport to ${destName}...`, 'info');
    }

    // Create full-screen teleport animation overlay
    this.showTeleportAnimation(ammoType, animDuration);

    // Save and update UI immediately (ammo consumed)
    this.save();
    this.renderInventory();
    this.renderTeleports();

    // After animation, perform actual teleport
    setTimeout(() => {
      // Perform teleport
      if (window.game) {
        window.game.fastTravelTo(lat, lng);
      }

      // Add teleportation XP
      this.addTeleportXP(levelReq);

      if (window.chatManager) {
        window.chatManager.addLogMessage(`🌀 Teleported to ${destName}! Used ${ammoCost}x ${ammoItem?.icon || ''} ${ammoItem?.name || 'ammo'}`, 'info');
      }

      this.teleportAnimating = false;
      this.renderTeleports();
    }, animDuration);
  }

  // Show full-screen teleport animation based on ammo type
  showTeleportAnimation(ammoType, duration) {
    // Remove any existing animation
    const existing = document.querySelector('.teleport-animation-overlay');
    if (existing) existing.remove();

    // Determine animation style based on ammo type
    const animStyles = {
      cloudwisp: { color: '#aabbcc', icon: '💨', particles: 'clouds', name: 'Cloud Vortex' },
      raindrop: { color: '#4488ff', icon: '💧', particles: 'rain', name: 'Rain Portal' },
      sunstone: { color: '#ffaa00', icon: '☀️', particles: 'light', name: 'Solar Warp' },
      snowflake: { color: '#88ddff', icon: '❄️', particles: 'snow', name: 'Frost Gate' },
      mistessence: { color: '#9966ff', icon: '🫧', particles: 'mist', name: 'Mist Rift' },
      lightningshard: { color: '#ffff00', icon: '⚡', particles: 'lightning', name: 'Storm Jump' }
    };

    const style = animStyles[ammoType] || animStyles.cloudwisp;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = `teleport-animation-overlay anim-${style.particles}`;
    overlay.innerHTML = `
      <div class="teleport-vortex">
        <div class="teleport-ring ring-1"></div>
        <div class="teleport-ring ring-2"></div>
        <div class="teleport-ring ring-3"></div>
        <div class="teleport-center-icon">${style.icon}</div>
      </div>
      <div class="teleport-particles"></div>
      <div class="teleport-text">${style.name}</div>
      <div class="teleport-progress-bar">
        <div class="teleport-progress-fill"></div>
      </div>
    `;

    // Set custom color
    overlay.style.setProperty('--tp-color', style.color);

    document.body.appendChild(overlay);

    // Generate particles
    const particleContainer = overlay.querySelector('.teleport-particles');
    for (let i = 0; i < 50; i++) {
      const particle = document.createElement('div');
      particle.className = 'teleport-particle';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.animationDelay = `${Math.random() * 1}s`;
      particle.style.animationDuration = `${0.5 + Math.random() * 1}s`;
      particleContainer.appendChild(particle);
    }

    // Animate progress bar
    const progressFill = overlay.querySelector('.teleport-progress-fill');
    progressFill.style.transition = `width ${duration}ms linear`;
    requestAnimationFrame(() => {
      progressFill.style.width = '100%';
    });

    // Flash effect at end
    setTimeout(() => {
      overlay.classList.add('teleport-flash');
    }, duration - 300);

    // Remove overlay after animation
    setTimeout(() => {
      overlay.classList.add('teleport-fade-out');
      setTimeout(() => overlay.remove(), 300);
    }, duration);
  }

  // Get count of an item in inventory
  getItemCount(itemKey) {
    let count = 0;
    for (const slot of this.inventorySlots) {
      if (slot && slot.itemKey === itemKey) {
        count += slot.count;
      }
    }
    return count;
  }

  // Check if an item key is equipment
  isEquipmentItem(itemKey) {
    return this.equipmentTypes.hasOwnProperty(itemKey);
  }

  // Get the combined item type (regular or equipment)
  getItemType(itemKey) {
    if (this.itemTypes[itemKey]) return this.itemTypes[itemKey];
    if (this.equipmentTypes[itemKey]) return this.equipmentTypes[itemKey];
    return null;
  }

  // Equip a gear item from inventory
  equipGear(itemKey) {
    const gear = this.equipmentTypes[itemKey];
    if (!gear) return false;

    // Find the item in inventory
    const slotIndex = this.inventorySlots.findIndex(
      s => s && s.itemKey === itemKey && s.count > 0
    );
    if (slotIndex === -1) return false;

    // If something is already equipped in that slot, unequip it first
    const currentEquipped = this.equippedGear[gear.type];
    if (currentEquipped) {
      // Add current item back to inventory
      this.addItem(currentEquipped, 1);
    }

    // Remove from inventory
    this.inventorySlots[slotIndex].count--;
    if (this.inventorySlots[slotIndex].count <= 0) {
      this.inventorySlots[slotIndex] = null;
    }

    // Equip the new item
    this.equippedGear[gear.type] = itemKey;

    // Update player visual
    this.updatePlayerEquipment();
    this.save();
    this.renderInventory();
    this.renderEquipment();

    if (window.chatManager) {
      window.chatManager.addLogMessage(`🛡️ Equipped ${gear.icon} ${gear.name}`, 'info');
    }

    return true;
  }

  // Unequip gear from a slot
  unequipGear(slotType) {
    const equipped = this.equippedGear[slotType];
    if (!equipped) return false;

    const gear = this.equipmentTypes[equipped];

    // Try to add back to inventory
    if (!this.addItem(equipped, 1)) {
      if (window.chatManager) {
        window.chatManager.addLogMessage(`❌ Inventory full! Cannot unequip.`, 'error');
      }
      return false;
    }

    // Remove from equipped
    this.equippedGear[slotType] = null;

    // Update player visual
    this.updatePlayerEquipment();
    this.save();
    this.renderInventory();
    this.renderEquipment();

    if (window.chatManager) {
      window.chatManager.addLogMessage(`🛡️ Unequipped ${gear.icon} ${gear.name}`, 'info');
    }

    return true;
  }

  // Update player's visual appearance based on equipped gear
  updatePlayerEquipment() {
    if (!this.map3d || !window.playerManager) return;

    const selfId = window.playerManager.selfSocketId;
    if (!selfId) return;

    // Create equipment object with just the item keys
    const equipment = {
      skin: this.equippedGear.skin || null,
      hat: this.equippedGear.hat || null,
      held: this.equippedGear.held || null,
      aura: this.equippedGear.aura || null
    };

    // Update local 3D appearance
    this.map3d.updatePlayerEquipment(selfId, equipment);

    // Send equipment update to server (so other players see it)
    if (window.game && window.game.socket && window.game.socket.connected) {
      window.game.socket.emit('player:updateEquipment', { equipment });
    }
  }

  // Show item context menu (for equip option)
  showItemContextMenu(slotIndex, event) {
    const slot = this.inventorySlots[slotIndex];
    if (!slot) return;

    // Remove any existing context menu
    this.hideItemContextMenu();

    const itemKey = slot.itemKey;
    const itemType = this.getItemType(itemKey);
    const isEquipment = this.isEquipmentItem(itemKey);

    const menu = document.createElement('div');
    menu.id = 'item-context-menu';
    menu.className = 'item-context-menu';

    let menuHtml = `<div class="context-menu-header">${itemType.icon} ${itemType.name}</div>`;

    // Consumable items (health packs) - Use option
    if (itemType.isConsumable && itemType.healAmount) {
      menuHtml += `<button class="context-menu-btn use-btn" data-action="use">Use (+${itemType.healAmount} HP)</button>`;
    }

    if (isEquipment) {
      const gear = this.equipmentTypes[itemKey];
      menuHtml += `<button class="context-menu-btn equip-btn" data-action="equip">Equip (${gear.type})</button>`;
    }

    if (itemType.sellValue && !itemType.isCurrency) {
      menuHtml += `<button class="context-menu-btn sell-btn" data-action="sell">Sell (+${itemType.sellValue}✨)</button>`;
    }

    menuHtml += `<button class="context-menu-btn cancel-btn" data-action="cancel">Cancel</button>`;

    menu.innerHTML = menuHtml;

    // Position near click
    menu.style.left = `${event.clientX}px`;
    menu.style.top = `${event.clientY}px`;

    document.body.appendChild(menu);

    // Button handlers
    menu.querySelectorAll('.context-menu-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action === 'use') {
          this.useConsumable(itemKey);
        } else if (action === 'equip') {
          this.equipGear(itemKey);
        } else if (action === 'sell') {
          this.sellItem(itemKey, 1);
        }
        this.hideItemContextMenu();
      });
    });

    // Close on click outside
    setTimeout(() => {
      document.addEventListener('click', this.hideItemContextMenu.bind(this), { once: true });
    }, 10);
  }

  // Hide item context menu
  hideItemContextMenu() {
    const menu = document.getElementById('item-context-menu');
    if (menu) menu.remove();
  }

  // Use a consumable item (health pack)
  useConsumable(itemKey) {
    const slotIndex = this.inventorySlots.findIndex(
      s => s && s.itemKey === itemKey && s.count > 0
    );
    if (slotIndex === -1) return;

    const item = this.itemTypes[itemKey];
    if (!item || !item.isConsumable || !item.healAmount) return;

    // Consume one item
    this.inventorySlots[slotIndex].count--;
    if (this.inventorySlots[slotIndex].count <= 0) {
      this.inventorySlots[slotIndex] = null;
    }

    // Heal the player
    const oldHealth = this.combatHealth;
    this.combatHealth = Math.min(this.maxCombatHealth, this.combatHealth + item.healAmount);
    const actualHeal = this.combatHealth - oldHealth;

    // If in combat, skip the player's next attack (eating takes a turn)
    if (this.inCombat) {
      this.skipNextAttack = true;
      if (window.chatManager) {
        window.chatManager.addLogMessage(`🩹 You eat ${item.icon} ${item.name} and heal ${actualHeal} HP! (Skipping attack)`, 'heal');
      }
      // Update combat HUD
      if (this.npcCombatTarget) {
        this.updateCombatHUD(this.npcCombatTarget);
      }
    } else {
      if (window.chatManager) {
        window.chatManager.addLogMessage(`🩹 You use ${item.icon} ${item.name} and heal ${actualHeal} HP!`, 'heal');
      }
    }

    this.save();
    this.renderInventory();
    this.renderCombat();
  }

  // Get items that can be sold for Light (including equipment)
  getSellableItems() {
    const items = [];
    for (const slot of this.inventorySlots) {
      if (slot && slot.count > 0) {
        // Check both itemTypes and equipmentTypes
        const itemType = this.itemTypes[slot.itemKey] || this.equipmentTypes[slot.itemKey];
        if (itemType && itemType.sellValue && !itemType.isCurrency) {
          const existing = items.find(i => i.itemKey === slot.itemKey);
          if (existing) {
            existing.count += slot.count;
          } else {
            items.push({ itemKey: slot.itemKey, count: slot.count });
          }
        }
      }
    }
    return items;
  }

  // Sell one item for Light (including equipment)
  sellItem(itemKey, count = 1) {
    // Check both itemTypes and equipmentTypes
    const itemType = this.itemTypes[itemKey] || this.equipmentTypes[itemKey];
    if (!itemType || !itemType.sellValue) return false;

    // Find and remove items from inventory
    let sold = 0;
    for (let i = 0; i < this.inventorySlots.length && sold < count; i++) {
      const slot = this.inventorySlots[i];
      if (slot && slot.itemKey === itemKey && slot.count > 0) {
        const toSell = Math.min(slot.count, count - sold);
        slot.count -= toSell;
        sold += toSell;
        if (slot.count <= 0) {
          this.inventorySlots[i] = null;
        }
      }
    }

    if (sold > 0) {
      const lightGained = sold * itemType.sellValue;
      this.lightBalance += lightGained;
      this.save();
      this.renderEquipment();

      if (window.chatManager) {
        window.chatManager.addLogMessage(`💱 Sold ${sold}x ${itemType.icon} ${itemType.name} for ${lightGained}✨ Light!`, 'item');
      }
      return true;
    }
    return false;
  }

  // Sell all items for Light (including equipment)
  sellAllItems() {
    const sellable = this.getSellableItems();
    if (sellable.length === 0) return;

    let totalLight = 0;
    let totalItems = 0;

    for (const item of sellable) {
      // Check both itemTypes and equipmentTypes
      const itemType = this.itemTypes[item.itemKey] || this.equipmentTypes[item.itemKey];
      totalLight += item.count * itemType.sellValue;
      totalItems += item.count;
    }

    // Clear sellable items from inventory (including equipment)
    for (let i = 0; i < this.inventorySlots.length; i++) {
      const slot = this.inventorySlots[i];
      if (slot) {
        // Check both itemTypes and equipmentTypes
        const itemType = this.itemTypes[slot.itemKey] || this.equipmentTypes[slot.itemKey];
        if (itemType && itemType.sellValue && !itemType.isCurrency) {
          this.inventorySlots[i] = null;
        }
      }
    }

    this.lightBalance += totalLight;
    this.save();
    this.renderEquipment();

    if (window.chatManager) {
      window.chatManager.addLogMessage(`💱 Sold ${totalItems} items for ${totalLight}✨ Light!`, 'item');
    }
  }

  // Buy equipment from an NPC - adds item to inventory
  buyEquipment(equipmentKey, npcId) {
    const equipment = this.equipmentTypes[equipmentKey];
    if (!equipment) return false;

    // Check if in combat
    if (this.inCombat) {
      if (window.chatManager) {
        window.chatManager.addLogMessage(`❌ Cannot trade while in combat!`, 'error');
      }
      return false;
    }

    // Check Light balance
    if (this.lightBalance < equipment.price) {
      if (window.chatManager) {
        window.chatManager.addLogMessage(`❌ Not enough Light! Need ${equipment.price}✨`, 'error');
      }
      return false;
    }

    // Check inventory space
    const slotIndex = this.findSlotForItem(equipmentKey);
    if (slotIndex === -1) {
      if (window.chatManager) {
        window.chatManager.addLogMessage(`❌ Inventory full!`, 'error');
      }
      return false;
    }

    // Purchase - add to inventory
    this.lightBalance -= equipment.price;
    this.addItem(equipmentKey, 1);
    this.save();
    this.renderInventory();
    this.renderEquipment();

    if (window.chatManager) {
      window.chatManager.addLogMessage(`🎉 Purchased ${equipment.icon} ${equipment.name} for ${equipment.price}✨ Light!`, 'levelup');
    }

    return true;
  }

  // Load NPCs from server world state (called when world:state is received)
  loadNPCsFromServer(serverNPCs) {
    if (!this.map3d) {
      console.warn('Map3D not ready, deferring NPC loading');
      // Retry after a short delay
      setTimeout(() => this.loadNPCsFromServer(serverNPCs), 500);
      return;
    }

    if (!serverNPCs || serverNPCs.length === 0) {
      console.warn('No NPCs received from server');
      return;
    }

    // If NPCs already exist (reconnection), preserve their health state
    const existingNPCHealth = new Map();
    for (const npc of this.npcs) {
      existingNPCHealth.set(npc.id, npc.health);
    }
    const isReconnection = this.npcsInitialized && this.npcs.length > 0;

    // Clear existing NPCs first
    for (const npc of this.npcs) {
      if (this.map3d) {
        this.map3d.removeNPC(npc.id);
      }
    }
    this.npcs = [];

    // Create NPCs from server data
    for (const serverNPC of serverNPCs) {
      // Preserve health if this is a reconnection and NPC existed before
      let npcHealth = serverNPC.health;
      if (isReconnection && existingNPCHealth.has(serverNPC.id)) {
        npcHealth = existingNPCHealth.get(serverNPC.id);
      }

      // Create client-side NPC instance from server data
      const npcInstance = {
        id: serverNPC.id,
        name: serverNPC.name,
        title: serverNPC.title,
        icon: serverNPC.icon,
        equipment: serverNPC.equipment,
        sellsEquipment: serverNPC.sellsEquipment,
        baseCity: serverNPC.baseCity,
        health: npcHealth,
        maxHealth: serverNPC.maxHealth,
        damage: serverNPC.damage,
        attackItems: [...serverNPC.attackItems],
        color: serverNPC.color,
        particle: serverNPC.particle,
        equippedAura: serverNPC.equippedAura,
        position: { lat: serverNPC.position.lat, lng: serverNPC.position.lng }
      };

      // Create 3D sprite for the NPC
      this.map3d.createNPC(npcInstance, npcInstance.position);
      this.npcs.push(npcInstance);

      if (!isReconnection) {
        console.log(`Loaded NPC from server: ${npcInstance.name} (${npcInstance.icon}) at ${npcInstance.baseCity} - Position: ${npcInstance.position.lat.toFixed(4)}, ${npcInstance.position.lng.toFixed(4)}`);
      }
    }

    this.npcsInitialized = true;
    if (!isReconnection) {
      console.log(`Loaded ${this.npcs.length} NPCs from server:`, this.npcs.map(n => `${n.icon} ${n.name}`).join(', '));
    } else {
      console.log(`Reconnection: Preserved health for ${existingNPCHealth.size} NPCs`);
    }
  }

  // Show Trade Screen (modular for NPC and future P2P trading)
  showTradeScreen(npcId) {
    const npc = this.npcs.find(n => n.id === npcId);
    if (!npc) return;

    // Close any existing trade screen
    this.closeTradeScreen();

    const equipment = this.equipmentTypes[npc.sellsEquipment];
    const npcEquipment = this.equipmentTypes[npc.equipment];
    const canAfford = this.lightBalance >= equipment.price;

    // Get sellable items from inventory
    const sellableItems = this.getSellableItems();

    // Create trade screen HTML
    const screen = document.createElement('div');
    screen.className = 'trade-screen';
    screen.innerHTML = `
      <div class="trade-screen-overlay"></div>
      <div class="trade-screen-content">
        <div class="trade-header">
          <div class="trade-npc-info">
            <span class="trade-npc-icon" style="color: ${npc.color}">${npc.icon}</span>
            <div class="trade-npc-details">
              <h3>${npc.name}</h3>
              <span class="trade-npc-title">${npc.title}</span>
            </div>
          </div>
          <button class="trade-close-btn" id="trade-close-btn">✕</button>
        </div>

        <div class="trade-body">
          <div class="trade-column trade-your-offer">
            <h4>Your Offer</h4>
            <div class="trade-balance">
              <span class="light-icon">✨</span>
              <span class="light-amount">${this.lightBalance}</span>
              <span class="light-label">Light</span>
            </div>
            <div class="trade-items-grid" id="trade-your-items">
              ${sellableItems.length === 0 ? '<p class="no-items">No items to trade</p>' : ''}
              ${sellableItems.map(item => {
                const itemType = this.itemTypes[item.itemKey];
                return `
                  <div class="trade-grid-item" data-item="${item.itemKey}" title="Click to sell for ${itemType.sellValue}✨">
                    <span class="item-icon">${itemType.icon}</span>
                    <span class="item-count">x${item.count}</span>
                    <span class="item-value">+${itemType.sellValue}✨</span>
                  </div>
                `;
              }).join('')}
            </div>
            <button class="osrs-btn small-btn" id="trade-sell-all-btn" ${sellableItems.length === 0 ? 'disabled' : ''}>
              Sell All Items
            </button>
          </div>

          <div class="trade-divider">
            <span class="trade-arrow">⇄</span>
          </div>

          <div class="trade-column trade-npc-offer">
            <h4>${npc.name}'s Wares</h4>
            <div class="trade-npc-equipment">
              <div class="trade-npc-wearing">
                <span>Wearing: </span>
                <span style="color: ${npcEquipment?.color}">${npcEquipment?.icon} ${npcEquipment?.name || 'Unknown'}</span>
              </div>
            </div>
            <div class="trade-shop-item ${!canAfford ? 'cannot-afford' : ''}">
              <span class="shop-icon" style="color: ${equipment.color}">${equipment.icon}</span>
              <div class="shop-details">
                <span class="shop-name">${equipment.name}</span>
                <span class="shop-type">${equipment.type.toUpperCase()}</span>
              </div>
              <span class="shop-price">${equipment.price}✨</span>
            </div>
            ${!canAfford ? `<p class="afford-warning">Need ${equipment.price - this.lightBalance} more Light</p>` : ''}
            <button class="osrs-btn small-btn buy-btn" id="trade-buy-btn" ${!canAfford ? 'disabled' : ''}>
              Buy (${equipment.price}✨)
            </button>
          </div>
        </div>

        <div class="trade-footer">
          <p class="trade-warning">"Defeat me in combat, and I shall reward you handsomely with Light..."</p>
          <div class="trade-actions">
            <button class="osrs-btn fight-btn" id="trade-fight-btn">⚔️ Challenge to Combat</button>
            <button class="osrs-btn" id="trade-leave-btn">Leave</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(screen);
    this.activeTradeScreen = { element: screen, npc, npcId };

    // Event handlers
    screen.querySelector('#trade-close-btn')?.addEventListener('click', () => this.closeTradeScreen());
    screen.querySelector('#trade-leave-btn')?.addEventListener('click', () => this.closeTradeScreen());
    screen.querySelector('.trade-screen-overlay')?.addEventListener('click', () => this.closeTradeScreen());

    screen.querySelector('#trade-buy-btn')?.addEventListener('click', () => {
      if (this.buyEquipment(npc.sellsEquipment, npcId)) {
        this.closeTradeScreen();
      }
    });

    screen.querySelector('#trade-fight-btn')?.addEventListener('click', () => {
      this.startNPCCombat(npcId);
      this.closeTradeScreen();
    });

    screen.querySelector('#trade-sell-all-btn')?.addEventListener('click', () => {
      this.sellAllItems();
      this.refreshTradeScreen();
    });

    // Individual item sell handlers
    screen.querySelectorAll('.trade-grid-item').forEach(el => {
      el.addEventListener('click', () => {
        const itemKey = el.dataset.item;
        this.sellItem(itemKey, 1);
        this.refreshTradeScreen();
      });
    });
  }

  // Refresh trade screen content (after selling items)
  refreshTradeScreen() {
    if (!this.activeTradeScreen) return;
    const { npcId } = this.activeTradeScreen;
    this.showTradeScreen(npcId);
  }

  // Close trade screen
  closeTradeScreen() {
    if (this.activeTradeScreen && this.activeTradeScreen.element) {
      this.activeTradeScreen.element.remove();
    }
    this.activeTradeScreen = null;
  }

  // Show NPC interaction tooltip (Trade/Battle/Talk options) at click position
  showNPCDialog(npcId, clientX, clientY) {
    const npc = this.npcs.find(n => n.id === npcId);
    if (!npc) return;

    // Close any existing menus
    this.closeNPCMenu();
    this.closePlayerInteractionMenu();
    this.closePlayerInspect();
    this.closeNPCInspect();

    // Build menu options based on NPC type
    const isBattleOnly = npc.isBattleOnly;

    // Create tooltip menu (same style as player interaction)
    const menu = document.createElement('div');
    menu.className = 'entity-interaction-tooltip';
    menu.innerHTML = `
      <div class="entity-tooltip-header">
        <span class="entity-tooltip-icon" style="color: ${npc.color}">${npc.icon}</span>
        <div class="entity-tooltip-info">
          <span class="entity-tooltip-name">${npc.name}</span>
          <span class="entity-tooltip-sub">${npc.title}</span>
        </div>
      </div>
      <div class="entity-tooltip-stats">
        <span>❤️ ${npc.health}/${npc.maxHealth}</span>
        <span>⚔️ ${npc.damage}</span>
      </div>
      <div class="entity-tooltip-options">
        ${!isBattleOnly ? `
        <button class="entity-tooltip-btn trade" data-action="trade">
          <span>💰</span> Trade
        </button>
        ` : ''}
        <button class="entity-tooltip-btn battle" data-action="battle">
          <span>⚔️</span> Battle
        </button>
        <button class="entity-tooltip-btn inspect" data-action="inspect">
          <span>🔍</span> Inspect
        </button>
      </div>
    `;

    // Position at click location
    menu.style.left = `${clientX}px`;
    menu.style.top = `${clientY}px`;

    document.body.appendChild(menu);
    this.activeNPCMenu = { element: menu, npc, npcId };

    // Adjust position if off-screen
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      menu.style.left = `${clientX - rect.width}px`;
    }
    if (rect.bottom > window.innerHeight) {
      menu.style.top = `${clientY - rect.height}px`;
    }

    // Close on click outside
    const closeHandler = (e) => {
      if (!menu.contains(e.target)) {
        this.closeNPCMenu();
        document.removeEventListener('click', closeHandler);
      }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 10);

    // Button handlers
    menu.querySelectorAll('.entity-tooltip-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        this.closeNPCMenu();

        switch (action) {
          case 'trade':
            this.showTradeScreen(npcId);
            break;
          case 'inspect':
            this.showNPCInspect(npcId);
            break;
          case 'battle':
            this.startNPCCombat(npcId);
            break;
        }
      });
    });
  }

  // Close NPC interaction menu
  closeNPCMenu() {
    if (this.activeNPCMenu && this.activeNPCMenu.element) {
      this.activeNPCMenu.element.remove();
    }
    this.activeNPCMenu = null;
  }

  // Show player interaction menu (right-click style tooltip at click position)
  showPlayerInteractionMenu(playerId, clientX, clientY) {
    // Close any existing menu
    this.closePlayerInteractionMenu();
    this.closeNPCMenu();
    this.closePlayerInspect();
    this.closeNPCInspect();

    // Get player info from the player manager
    const player = window.playerManager?.getPlayer(playerId);
    if (!player) {
      console.log('Player not found:', playerId);
      return;
    }

    const playerName = player.username || player.name || 'Unknown Player';
    const playerFlag = player.avatar?.text || player.flag || '🙂';

    // Create the tooltip menu
    const menu = document.createElement('div');
    menu.className = 'player-interaction-tooltip';
    menu.innerHTML = `
      <div class="player-tooltip-header">
        <span class="player-tooltip-flag">${playerFlag}</span>
        <span class="player-tooltip-name">${playerName}</span>
      </div>
      <div class="player-tooltip-options">
        <button class="player-tooltip-btn trade" data-action="trade">
          <span>💰</span> Trade
        </button>
        <button class="player-tooltip-btn attack" data-action="attack">
          <span>⚔️</span> Attack
        </button>
        <button class="player-tooltip-btn inspect" data-action="inspect">
          <span>🔍</span> Inspect
        </button>
      </div>
    `;

    // Position at click location
    menu.style.left = `${clientX}px`;
    menu.style.top = `${clientY}px`;

    document.body.appendChild(menu);
    this.activePlayerMenu = { element: menu, playerId, player };

    // Adjust position if off-screen
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      menu.style.left = `${clientX - rect.width}px`;
    }
    if (rect.bottom > window.innerHeight) {
      menu.style.top = `${clientY - rect.height}px`;
    }

    // Close on click outside
    const closeHandler = (e) => {
      if (!menu.contains(e.target)) {
        this.closePlayerInteractionMenu();
        document.removeEventListener('click', closeHandler);
      }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 10);

    // Button handlers
    menu.querySelectorAll('.player-tooltip-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        this.closePlayerInteractionMenu();

        switch (action) {
          case 'trade':
            this.initiatePlayerTrade(playerId, player);
            break;
          case 'attack':
            this.initiatePlayerAttack(playerId, player);
            break;
          case 'inspect':
            this.showPlayerInspect(player);
            break;
        }
      });
    });
  }

  // Close player interaction menu
  closePlayerInteractionMenu() {
    if (this.activePlayerMenu && this.activePlayerMenu.element) {
      this.activePlayerMenu.element.remove();
    }
    this.activePlayerMenu = null;
  }

  // Initiate trade with another player
  initiatePlayerTrade(playerId, player) {
    const playerName = player?.username || player?.name || 'Unknown';

    // Check if we have selected combat item (used as currency for trades)
    if (!this.selectedCombatItem) {
      if (window.chatManager) {
        window.chatManager.addLogMessage(`❌ Select ammo in Combat tab first to trade!`, 'error');
      }
      return;
    }

    // Send trade request to server
    if (window.game && window.game.socket && window.game.socket.connected) {
      window.game.socket.emit('player:tradeRequest', { targetId: playerId });
      if (window.chatManager) {
        window.chatManager.addLogMessage(`💰 Sent trade request to ${playerName}`, 'info');
      }
    } else {
      if (window.chatManager) {
        window.chatManager.addLogMessage(`❌ Not connected to server!`, 'error');
      }
    }
  }

  // Initiate attack on another player (PvP combat) - server-side calculation
  initiatePlayerAttack(playerId, player) {
    const playerName = player?.username || player?.name || 'Unknown';

    // Check if we have selected combat item
    if (!this.selectedCombatItem) {
      if (window.chatManager) {
        window.chatManager.addLogMessage(`❌ Select ammo in Combat tab first to attack!`, 'error');
      }
      return;
    }

    // Check if we have any of the selected ammo
    const ammoCount = this.getItemCount(this.selectedCombatItem);
    if (ammoCount <= 0) {
      if (window.chatManager) {
        const item = this.itemTypes[this.selectedCombatItem];
        window.chatManager.addLogMessage(`❌ You have no ${item?.icon || ''} ${item?.name || 'ammo'}!`, 'error');
      }
      return;
    }

    // Consume 1 ammo
    this.removeItem(this.selectedCombatItem, 1);

    // Get accuracy and max hit for server-side calculation
    const accuracy = this.getAccuracy(this.selectedCombatItem);
    const maxHit = this.getMaxHit(this.selectedCombatItem);

    // Store target info for result handler
    this.lastPvPTarget = { playerId, playerName, itemKey: this.selectedCombatItem };

    // Send attack to server for damage calculation
    if (window.game && window.game.socket && window.game.socket.connected) {
      window.game.socket.emit('pvp:attack', {
        targetId: playerId,
        itemKey: this.selectedCombatItem,
        accuracy,
        maxHit
      });
    } else {
      // Offline fallback
      if (window.chatManager) {
        window.chatManager.addLogMessage(`⚔️ Cannot attack while offline!`, 'error');
      }
    }

    this.save();
    this.renderInventory();
    this.renderCombat();
  }

  // Handle PvP attack result from server
  handlePvPAttackResult(data) {
    const target = this.lastPvPTarget;
    if (!target) return;

    const item = this.itemTypes[target.itemKey];

    if (data.didHit) {
      if (window.chatManager) {
        window.chatManager.addLogMessage(`⚔️ You hit ${target.playerName} for ${data.damage} damage! (${item?.icon || ''})`, 'combat');
      }
      // Add combat XP
      this.addCombatXP(data.damage);
    } else {
      if (window.chatManager) {
        window.chatManager.addLogMessage(`⚔️ You missed ${target.playerName}! (${item?.icon || ''})`, 'combat');
      }
    }
  }

  // Handle being damaged by another player
  handlePvPDamaged(data) {
    // Update our health
    this.combatHealth = data.health;
    this.maxCombatHealth = data.maxHealth;

    if (window.chatManager) {
      window.chatManager.addLogMessage(`💥 ${data.attackerName} hit you for ${data.damage} damage! (${this.combatHealth}/${this.maxCombatHealth} HP)`, 'damage');
    }

    // Update health display
    this.renderCombat();

    // Check if dead
    if (this.combatHealth <= 0) {
      // Will receive pvp:defeated event
    }
  }

  // Handle being defeated by another player
  handlePvPDefeated(data) {
    if (window.chatManager) {
      window.chatManager.addLogMessage(`💀 You were defeated by ${data.killerName}!`, 'death');
    }

    // Play death animation and respawn
    if (this.map3d) {
      this.map3d.playPlayerDeathAnimation(() => {
        // Respawn with full health
        this.combatHealth = this.maxCombatHealth;
        this.renderCombat();

        // Teleport home
        if (this.homePosition && window.game) {
          window.game.teleportTo(this.homePosition.lat, this.homePosition.lng);
        }

        this.map3d.playPlayerRespawnAnimation();
      });
    }
  }

  // Add combat XP based on damage dealt
  addCombatXP(damage) {
    const xpGain = Math.max(1, Math.floor(damage / 10));
    this.skills.hitpoints.xp += xpGain;
    this.renderSkills();
  }

  // Show player inspection dialog (tooltip style)
  showPlayerInspect(player) {
    if (!player) return;

    // Close any existing menus
    this.closePlayerInspect();
    this.closeNPCInspect();

    // Get player's equipment display
    const equipment = player.equipment || {};
    const equipItems = [];
    if (equipment.skin) {
      const item = this.equipmentTypes[equipment.skin];
      if (item) equipItems.push(`<span title="${item.name}">${item.icon}</span>`);
    }
    if (equipment.hat) {
      const item = this.equipmentTypes[equipment.hat];
      if (item) equipItems.push(`<span title="${item.name}">${item.icon}</span>`);
    }
    if (equipment.held) {
      const item = this.equipmentTypes[equipment.held];
      if (item) equipItems.push(`<span title="${item.name}">${item.icon}</span>`);
    }
    if (equipment.aura) {
      const item = this.equipmentTypes[equipment.aura];
      if (item) equipItems.push(`<span title="${item.name}">${item.icon}</span>`);
    }

    const avatarText = player.avatar?.text || player.flag || ':-)';
    const avatarColor = player.avatar?.color || '#ffb000';
    const equipHtml = equipItems.length > 0 ? equipItems.join(' ') : '<span style="color:#666">None</span>';

    // Create inspect tooltip (same style as NPC inspect)
    const inspect = document.createElement('div');
    inspect.className = 'inspect-tooltip player-inspect';
    inspect.innerHTML = `
      <div class="inspect-header">
        <span class="inspect-icon" style="color:${avatarColor}">${avatarText}</span>
        <div class="inspect-title">
          <span class="inspect-name">${player.username}</span>
          <span class="inspect-subtitle">Player</span>
        </div>
        <button class="inspect-close">✕</button>
      </div>
      <div class="inspect-body">
        <div class="inspect-stat-row">
          <span class="inspect-label">🎮 Status</span>
          <span class="inspect-value" style="color:#44ff44">Online</span>
        </div>
        <div class="inspect-stat-row">
          <span class="inspect-label">📍 Location</span>
          <span class="inspect-value">${player.position ? `${player.position.lat.toFixed(4)}, ${player.position.lng.toFixed(4)}` : 'Unknown'}</span>
        </div>
        <div class="inspect-stat-row">
          <span class="inspect-label">🛡️ Equipment</span>
          <span class="inspect-value">${equipHtml}</span>
        </div>
      </div>
      <div class="inspect-actions">
        <button class="inspect-action-btn" data-action="goto">
          <span>📍</span> Go To
        </button>
        <button class="inspect-action-btn trade" data-action="trade">
          <span>💰</span> Trade
        </button>
        <button class="inspect-action-btn attack" data-action="attack">
          <span>⚔️</span> Attack
        </button>
      </div>
    `;

    // Position in center of screen
    inspect.style.position = 'fixed';
    inspect.style.left = '50%';
    inspect.style.top = '50%';
    inspect.style.transform = 'translate(-50%, -50%)';

    document.body.appendChild(inspect);
    this.activePlayerInspect = { element: inspect, player };

    // Close button
    inspect.querySelector('.inspect-close').addEventListener('click', () => {
      this.closePlayerInspect();
    });

    // Action buttons
    inspect.querySelectorAll('.inspect-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        this.closePlayerInspect();

        switch (action) {
          case 'goto':
            if (this.map3d && player.position) {
              this.map3d.centerOn(player.position.lat, player.position.lng);
            }
            break;
          case 'trade':
            this.initiatePlayerTrade(player.id, player);
            break;
          case 'attack':
            this.initiatePlayerAttack(player.id, player);
            break;
        }
      });
    });

    // Close on click outside
    const closeHandler = (e) => {
      if (!inspect.contains(e.target)) {
        this.closePlayerInspect();
        document.removeEventListener('click', closeHandler);
      }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 10);
  }

  // Close player inspection menu
  closePlayerInspect() {
    if (this.activePlayerInspect && this.activePlayerInspect.element) {
      this.activePlayerInspect.element.remove();
    }
    this.activePlayerInspect = null;
  }

  // Show NPC detailed inspection as UI tooltip
  showNPCInspect(npcId) {
    const npc = this.npcs.find(n => n.id === npcId);
    if (!npc) return;

    // Close any existing inspect
    this.closeNPCInspect();

    // Calculate difficulty based on damage and health
    let difficulty = 'Easy';
    let difficultyColor = '#88ff88';
    if (npc.isTraining) {
      difficulty = 'Very Easy';
      difficultyColor = '#88ff88';
    } else if (npc.isBattleOnly) {
      if (npc.damage >= 30) {
        difficulty = 'Medium';
        difficultyColor = '#ffcc00';
      } else {
        difficulty = 'Easy';
        difficultyColor = '#88ff88';
      }
    } else {
      // Boss
      if (npc.damage >= 100) {
        difficulty = 'Very Hard';
        difficultyColor = '#ff4444';
      } else if (npc.damage >= 75) {
        difficulty = 'Hard';
        difficultyColor = '#ff8844';
      } else {
        difficulty = 'Medium';
        difficultyColor = '#ffcc00';
      }
    }

    // Build drops display
    let dropsHtml = '<span style="color:#666">None</span>';
    if (npc.drops && npc.drops.length > 0) {
      dropsHtml = npc.drops.map(d => {
        const item = this.itemTypes[d];
        return item ? `<span title="${item.name}">${item.icon}</span>` : d;
      }).join(' ');
      dropsHtml += ` <span style="color:#888;font-size:9px">(${Math.round((npc.dropChance || 0) * 100)}%)</span>`;
    }

    // Build attack items display
    const attacksHtml = npc.attackItems.map(a => {
      const item = this.itemTypes[a];
      return item ? `<span title="${item.name}">${item.icon}</span>` : a;
    }).join(' ');

    // Health percentage for bar
    const healthPct = Math.max(0, Math.min(100, (npc.health / npc.maxHealth) * 100));
    const healthColor = healthPct > 50 ? '#44ff44' : healthPct > 25 ? '#ffaa00' : '#ff4444';

    // Create inspect tooltip
    const inspect = document.createElement('div');
    inspect.className = 'inspect-tooltip npc-inspect';
    inspect.innerHTML = `
      <div class="inspect-header">
        <span class="inspect-icon">${npc.icon}</span>
        <div class="inspect-title">
          <span class="inspect-name">${npc.name}</span>
          <span class="inspect-subtitle">${npc.title}</span>
        </div>
        <button class="inspect-close">✕</button>
      </div>
      <div class="inspect-body">
        <div class="inspect-stat-row">
          <span class="inspect-label">❤️ Health</span>
          <div class="inspect-health-bar">
            <div class="inspect-health-fill" style="width:${healthPct}%;background:${healthColor}"></div>
            <span class="inspect-health-text">${npc.health}/${npc.maxHealth}</span>
          </div>
        </div>
        <div class="inspect-stat-row">
          <span class="inspect-label">⚔️ Max Hit</span>
          <span class="inspect-value">${npc.damage}</span>
        </div>
        <div class="inspect-stat-row">
          <span class="inspect-label">🎯 Attacks</span>
          <span class="inspect-value">${attacksHtml}</span>
        </div>
        <div class="inspect-stat-row">
          <span class="inspect-label">📍 Location</span>
          <span class="inspect-value">${npc.baseCity}</span>
        </div>
        <div class="inspect-stat-row">
          <span class="inspect-label">⚠️ Difficulty</span>
          <span class="inspect-value" style="color:${difficultyColor}">${difficulty}</span>
        </div>
        <div class="inspect-stat-row">
          <span class="inspect-label">🎁 Drops</span>
          <span class="inspect-value">${dropsHtml}</span>
        </div>
        ${npc.sellsEquipment ? `
        <div class="inspect-stat-row">
          <span class="inspect-label">💰 Sells</span>
          <span class="inspect-value">${this.equipmentTypes[npc.sellsEquipment]?.icon || ''} ${this.equipmentTypes[npc.sellsEquipment]?.name || ''}</span>
        </div>
        ` : ''}
      </div>
    `;

    // Position in center of screen
    inspect.style.position = 'fixed';
    inspect.style.left = '50%';
    inspect.style.top = '50%';
    inspect.style.transform = 'translate(-50%, -50%)';

    document.body.appendChild(inspect);
    this.activeNPCInspect = { element: inspect, npcId };

    // Close button
    inspect.querySelector('.inspect-close').addEventListener('click', () => {
      this.closeNPCInspect();
    });

    // Close on click outside
    const closeHandler = (e) => {
      if (!inspect.contains(e.target)) {
        this.closeNPCInspect();
        document.removeEventListener('click', closeHandler);
      }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 10);
  }

  // Close NPC inspect tooltip
  closeNPCInspect() {
    if (this.activeNPCInspect && this.activeNPCInspect.element) {
      this.activeNPCInspect.element.remove();
    }
    this.activeNPCInspect = null;
  }

  // Show NPC talk dialog
  showNPCTalk(npcId) {
    const npc = this.npcs.find(n => n.id === npcId);
    if (!npc) return;

    const dialogues = {
      'npc_frost_warden': [
        "The cold never bothered me... it empowers me.",
        "Frost and ice are my domain. Can you survive my chill?",
        "I've frozen warriors far mightier than you."
      ],
      'npc_storm_herald': [
        "Thunder rumbles in my veins!",
        "The storm's fury knows no bounds.",
        "Lightning strikes twice... and thrice!"
      ],
      'npc_void_walker': [
        "The void whispers secrets of power...",
        "Step into the darkness with me.",
        "Existence is but a flicker in the void."
      ],
      'npc_light_bringer': [
        "May the light guide your path.",
        "Darkness cannot stand against me.",
        "I am the dawn that banishes all shadows."
      ]
    };

    const npcDialogues = dialogues[npcId] || ["..."];
    const randomDialogue = npcDialogues[Math.floor(Math.random() * npcDialogues.length)];

    if (window.chatManager) {
      window.chatManager.addLogMessage(`${npc.icon} ${npc.name}: "${randomDialogue}"`, 'npc');
    }
  }

  closeNPCDialog() {
    this.closeNPCMenu();
    this.closeTradeScreen();
  }

  // Start combat with an NPC
  startNPCCombat(npcId) {
    const npc = this.npcs.find(n => n.id === npcId);
    if (!npc) return;

    if (!this.selectedCombatItem) {
      if (window.chatManager) {
        window.chatManager.addLogMessage('⚔️ Select a weapon from the Combat tab first!', 'error');
      }
      return;
    }

    this.inCombat = true;
    this.npcCombatTarget = npcId;
    this.isPlayerTurn = true;
    this.combatTurnTick = 0;

    // Reset NPC health for new fight
    npc.health = npc.maxHealth;
    if (this.map3d) {
      this.map3d.updateNPCHealth(npcId, npc.health, npc.maxHealth);
    }

    if (window.chatManager) {
      window.chatManager.addLogMessage(`⚔️ Combat started with ${npc.name}!`, 'combat');
    }

    // Show combat HUD
    this.showCombatHUD(npcId);

    // First attack happens immediately
    this.processCombatTurn();
  }

  // Process a single combat turn (called by game tick system every 1.2s)
  processCombatTurn() {
    if (!this.inCombat || !this.npcCombatTarget) return;

    const npcId = this.npcCombatTarget;
    const npc = this.npcs.find(n => n.id === npcId);
    if (!npc) {
      this.endNPCCombat();
      return;
    }

    if (this.isPlayerTurn) {
      // Check if player ate food and should skip attack
      if (this.skipNextAttack) {
        this.skipNextAttack = false;
        if (window.chatManager) {
          window.chatManager.addLogMessage('🍽️ You finish eating...', 'combat');
        }
        // Still toggle turn - NPC gets to attack after player eats
      } else {
        // Player's turn
        this.playerAttackNPC(npcId);
      }
    } else {
      // NPC's turn
      this.npcAttackPlayer(npcId);
    }

    // Toggle turn
    this.isPlayerTurn = !this.isPlayerTurn;
  }

  // Player attacks NPC - sends to server for damage calculation
  playerAttackNPC(npcId) {
    const npc = this.npcs.find(n => n.id === npcId);
    if (!npc) return;

    // Check if we have the selected ammo
    let slotIndex = this.inventorySlots.findIndex(
      s => s && s.itemKey === this.selectedCombatItem && s.count > 0
    );

    // If current ammo is empty, try to auto-equip another ammo type
    if (slotIndex === -1) {
      const availableAmmo = this.getCombatItems();
      if (availableAmmo.length > 0) {
        // Auto-equip the first available ammo
        this.selectedCombatItem = availableAmmo[0].itemKey;
        slotIndex = this.inventorySlots.findIndex(
          s => s && s.itemKey === this.selectedCombatItem && s.count > 0
        );
        const newItem = this.itemTypes[this.selectedCombatItem];
        if (window.chatManager) {
          window.chatManager.addLogMessage(`⚔️ Auto-equipped ${newItem?.icon || ''} ${newItem?.name || 'ammo'}!`, 'combat');
        }
        this.renderCombat();
      }
    }

    // If still no ammo, player can't attack but combat continues
    if (slotIndex === -1) {
      if (window.chatManager) {
        window.chatManager.addLogMessage('⚔️ No ammo! You cannot attack!', 'error');
      }
      return;
    }

    // Consume one item
    this.inventorySlots[slotIndex].count--;
    if (this.inventorySlots[slotIndex].count <= 0) {
      this.inventorySlots[slotIndex] = null;
    }

    // Get accuracy and max hit for server
    const accuracy = this.getAccuracy(this.selectedCombatItem);
    const maxHit = this.getMaxHit(this.selectedCombatItem);

    // Send attack to server for damage calculation
    if (window.game && window.game.socket && window.game.socket.connected) {
      window.game.socket.emit('npc:attack', {
        npcId,
        itemKey: this.selectedCombatItem,
        accuracy,
        maxHit
      });
    } else {
      // Fallback: local calculation if offline
      this.playerAttackNPCLocal(npcId, accuracy, maxHit);
    }

    this.save();
    this.renderCombat();
  }

  // Local fallback for NPC attack (offline mode)
  playerAttackNPCLocal(npcId, accuracy, maxHit) {
    const npc = this.npcs.find(n => n.id === npcId);
    if (!npc) return;

    const hitRoll = Math.random() * 100;
    const didHit = hitRoll < accuracy;
    const damage = didHit ? Math.floor(Math.random() * (maxHit + 1)) : 0;

    npc.health -= damage;
    const item = this.itemTypes[this.selectedCombatItem];

    const hpXP = didHit ? Math.max(5, damage * 4) : 2;
    this.addHPXP(hpXP);

    if (this.map3d) {
      if (didHit) {
        this.map3d.showCombatEffect('player_attack', npcId, item?.icon || '⚔️', damage);
      } else {
        this.map3d.showCombatEffect('player_miss', npcId, '💨', 0);
      }
      this.map3d.updateNPCHealth(npcId, Math.max(0, npc.health), npc.maxHealth);
    }

    if (window.chatManager) {
      if (didHit) {
        window.chatManager.addLogMessage(`⚔️ You hit ${npc.name} for ${damage} damage!`, 'combat');
      } else {
        window.chatManager.addLogMessage(`💨 You miss ${npc.name}!`, 'combat');
      }
    }

    this.updateCombatHUD(npcId);

    if (npc.health <= 0) {
      this.defeatNPC(npcId);
    }
  }

  // Handle NPC attack result from server
  handleNPCAttackResult(data) {
    const npc = this.npcs.find(n => n.id === data.npcId);
    if (!npc) return;

    // Update local NPC health from server
    npc.health = data.npcHealth;

    const item = this.itemTypes[this.selectedCombatItem];

    // Award HP XP
    const hpXP = data.didHit ? Math.max(5, data.damage * 4) : 2;
    this.addHPXP(hpXP);

    // Show attack particle effect
    if (this.map3d) {
      if (data.didHit) {
        this.map3d.showCombatEffect('player_attack', data.npcId, item?.icon || '⚔️', data.damage);
      } else {
        this.map3d.showCombatEffect('player_miss', data.npcId, '💨', 0);
      }
      this.map3d.updateNPCHealth(data.npcId, data.npcHealth, data.npcMaxHealth);
    }

    if (window.chatManager) {
      if (data.didHit) {
        window.chatManager.addLogMessage(`⚔️ You hit ${npc.name} for ${data.damage} damage!`, 'combat');
      } else {
        window.chatManager.addLogMessage(`💨 You miss ${npc.name}!`, 'combat');
      }
    }

    // Update combat HUD
    this.updateCombatHUD(data.npcId);
  }

  // Handle NPC health update from server (for all players)
  updateNPCHealthFromServer(data) {
    const npc = this.npcs.find(n => n.id === data.npcId);
    if (npc) {
      npc.health = data.health;
      if (this.map3d) {
        this.map3d.updateNPCHealth(data.npcId, data.health, data.maxHealth);
      }
    }
  }

  // Handle NPC defeated from server
  handleNPCDefeated(data) {
    const npc = this.npcs.find(n => n.id === data.npcId);
    if (!npc) return;

    npc.health = 0;

    // Award drops from server
    if (data.drops && data.drops.length > 0) {
      for (const dropKey of data.drops) {
        this.addItem(dropKey, 1);
        const item = this.itemTypes[dropKey] || this.equipmentTypes[dropKey];
        if (window.chatManager && item) {
          window.chatManager.addLogMessage(`🎁 ${npc.name} dropped ${item.icon} ${item.name}!`, 'drop');
        }
      }
    }

    if (window.chatManager) {
      window.chatManager.addLogMessage(`🏆 You defeated ${npc.name}!`, 'victory');
    }

    // Play death animation
    if (this.map3d) {
      this.map3d.playNPCDeathAnimation(data.npcId);
    }

    this.endNPCCombat();
    this.save();
    this.renderEquipment();
  }

  // Handle NPC respawned from server
  handleNPCRespawned(data) {
    const npc = this.npcs.find(n => n.id === data.npcId);
    if (npc) {
      npc.health = npc.maxHealth;
      if (this.map3d) {
        this.map3d.playNPCRespawnAnimation(data.npcId);
      }
    }
  }

  // NPC attacks the player with visual effects
  npcAttackPlayer(npcId) {
    const npc = this.npcs.find(n => n.id === npcId);
    if (!npc) return;

    // Select random attack item from NPC's arsenal
    const attackItems = npc.attackItems || ['lightningshard'];
    const attackItemKey = attackItems[Math.floor(Math.random() * attackItems.length)];
    const attackItem = this.itemTypes[attackItemKey];

    // Random damage from 0 to max hit
    const damage = Math.floor(Math.random() * (npc.damage + 1));
    this.combatHealth -= damage;

    // Show attack particle effect
    if (this.map3d) {
      this.map3d.showCombatEffect('npc_attack', npcId, attackItem?.icon || '💀', damage);
    }

    if (damage === 0) {
      if (window.chatManager) {
        window.chatManager.addLogMessage(`💨 ${npc.name} missed!`, 'combat');
      }
    } else {
      if (window.chatManager) {
        window.chatManager.addLogMessage(`💥 ${npc.name} hits you with ${attackItem?.icon || '💀'} for ${damage} damage!`, 'combat');
      }
    }

    // Update combat HUD
    this.updateCombatHUD(npcId);
    this.renderCombat();

    // Check if player defeated
    if (this.combatHealth <= 0) {
      this.combatHealth = 0;
      this.endNPCCombat();
      this.die();
    }
  }

  // Show combat HUD overlay
  showCombatHUD(npcId) {
    const npc = this.npcs.find(n => n.id === npcId);
    if (!npc) return;

    // Remove existing HUD
    this.hideCombatHUD();

    const hud = document.createElement('div');
    hud.id = 'combat-hud';
    hud.className = 'combat-hud';
    hud.innerHTML = `
      <div class="combat-hud-content">
        <div class="combat-participant player-side">
          <span class="combat-name">You</span>
          <div class="combat-health-bar">
            <div class="combat-health-fill player-health" style="width: ${(this.combatHealth / this.maxCombatHealth) * 100}%"></div>
          </div>
          <span class="combat-hp">${this.combatHealth}/${this.maxCombatHealth}</span>
        </div>
        <div class="combat-vs">⚔️</div>
        <div class="combat-participant npc-side">
          <span class="combat-name" style="color: ${npc.color}">${npc.icon} ${npc.name}</span>
          <div class="combat-health-bar">
            <div class="combat-health-fill npc-health" style="width: ${(npc.health / npc.maxHealth) * 100}%"></div>
          </div>
          <span class="combat-hp">${npc.health}/${npc.maxHealth}</span>
        </div>
      </div>
      <button class="combat-flee-btn osrs-btn">🏃 Flee</button>
    `;

    document.body.appendChild(hud);

    hud.querySelector('.combat-flee-btn')?.addEventListener('click', () => {
      this.endNPCCombat();
      if (window.chatManager) {
        window.chatManager.addLogMessage('🏃 You fled from combat!', 'system');
      }
    });
  }

  // Update combat HUD
  updateCombatHUD(npcId) {
    const npc = this.npcs.find(n => n.id === npcId);
    if (!npc) return;

    const hud = document.getElementById('combat-hud');
    if (!hud) return;

    const playerHealth = hud.querySelector('.player-health');
    const npcHealth = hud.querySelector('.npc-health');
    const playerHp = hud.querySelector('.player-side .combat-hp');
    const npcHp = hud.querySelector('.npc-side .combat-hp');

    if (playerHealth) {
      playerHealth.style.width = `${(this.combatHealth / this.maxCombatHealth) * 100}%`;
    }
    if (npcHealth) {
      npcHealth.style.width = `${(Math.max(0, npc.health) / npc.maxHealth) * 100}%`;
    }
    if (playerHp) {
      playerHp.textContent = `${this.combatHealth}/${this.maxCombatHealth}`;
    }
    if (npcHp) {
      npcHp.textContent = `${Math.max(0, npc.health)}/${npc.maxHealth}`;
    }
  }

  // Hide combat HUD
  hideCombatHUD() {
    const hud = document.getElementById('combat-hud');
    if (hud) hud.remove();
  }

  // Player defeats NPC
  defeatNPC(npcId) {
    const npc = this.npcs.find(n => n.id === npcId);
    if (!npc) return;

    // Award Light based on NPC difficulty
    const lightReward = Math.floor(npc.maxHealth / 50);
    this.lightBalance += lightReward;

    if (window.chatManager) {
      window.chatManager.addLogMessage(`🎉 You defeated ${npc.name}!`, 'levelup');
      window.chatManager.addLogMessage(`✨ Received ${lightReward} Light!`, 'item');
    }

    // NPC explodes and drops ammo on the ground!
    // NPCs drop ammo from their attack items list
    const attackItems = npc.attackItems || ['cloudwisp'];

    // Amount scales with NPC difficulty (maxHealth / 50, min 3, max 15)
    const ammoAmount = Math.max(3, Math.min(15, Math.floor(npc.maxHealth / 50)));

    // Play death animation, then spawn items from NPC center
    if (this.map3d && npc.position) {
      this.map3d.playNPCDeathAnimation(npcId, () => {
        // After death animation completes, spawn items from where NPC died
        this.createItemExplosionFromCenter(attackItems, npc.position, ammoAmount);
        if (window.chatManager) {
          window.chatManager.addLogMessage(`💥 ${npc.name} exploded! ${ammoAmount} ammo dropped!`, 'item');
        }
      });
    }

    // Check for rare item drops (battle NPCs only) - these go to inventory
    if (npc.isBattleOnly && npc.drops && npc.drops.length > 0 && npc.dropChance) {
      const roll = Math.random();
      if (roll < npc.dropChance) {
        // Randomly select one of the possible drops
        const dropIndex = Math.floor(Math.random() * npc.drops.length);
        const droppedItemKey = npc.drops[dropIndex];
        const droppedItem = this.itemTypes[droppedItemKey];

        if (droppedItem) {
          // Add item to inventory
          const added = this.addItemToInventory(droppedItemKey, 1);
          if (added && window.chatManager) {
            window.chatManager.addLogMessage(`🎁 Rare drop: ${droppedItem.icon} ${droppedItem.name}!`, 'item');
          }
        }
      } else {
        // No rare drop this time
        if (window.chatManager) {
          window.chatManager.addLogMessage(`No rare drop this time.`, 'system');
        }
      }
    }

    // Respawn NPC after delay (NPCs respawn by dropping from sky)
    // Battle NPCs respawn faster than bosses
    const respawnTime = npc.isBattleOnly ? 60000 : 120000; // 1 min for battle, 2 min for bosses
    setTimeout(() => {
      npc.health = npc.maxHealth;
      if (this.map3d) {
        this.map3d.updateNPCHealth(npcId, npc.health, npc.maxHealth);
        this.map3d.playNPCRespawnAnimation(npcId);
      }
    }, respawnTime);

    this.endNPCCombat();
    this.save();
    this.renderEquipment();
  }

  // End NPC combat
  endNPCCombat() {
    this.inCombat = false;
    this.npcCombatTarget = null;
    this.isPlayerTurn = true;
    this.combatTurnTick = 0;
    this.hideCombatHUD();
  }

  // Check if player is near an NPC (for interaction)
  checkNPCProximity() {
    if (!this.playerPosition) return null;

    for (const npc of this.npcs) {
      if (!npc.position) continue;

      const distance = this.getDistance(this.playerPosition, npc.position);
      if (distance < 0.0005) { // ~50m
        return npc.id;
      }
    }
    return null;
  }

  // Get items available for combat (only gathered items, not equipment or consumables)
  getCombatItems() {
    const items = [];
    for (const slot of this.inventorySlots) {
      if (slot && slot.count > 0) {
        const itemType = this.itemTypes[slot.itemKey];
        // Only include gathered items (those in itemTypes, not equipmentTypes)
        // Exclude currency and consumables (health packs)
        const isGatheredItem = itemType && !itemType.isCurrency && !itemType.isConsumable;
        const isEquipment = this.equipmentTypes[slot.itemKey];

        if (isGatheredItem && !isEquipment) {
          // Check if already in list
          const existing = items.find(i => i.itemKey === slot.itemKey);
          if (existing) {
            existing.count += slot.count;
          } else {
            items.push({ itemKey: slot.itemKey, count: slot.count });
          }
        }
      }
    }
    return items;
  }

  // Get combat level for an item (based on corresponding skill)
  getCombatLevel(itemKey) {
    const item = this.itemTypes[itemKey];
    if (!item) return 1;

    // Find the skill that matches this item's weather
    for (const [skillKey, skill] of Object.entries(this.skills)) {
      if (skill.weather === item.weather) {
        return this.getLevel(skill.xp);
      }
    }
    return 1;
  }

  // Get max hit for an item (used to roll damage from 0 to max)
  getMaxHit(itemKey) {
    const level = this.getCombatLevel(itemKey);
    const item = this.itemTypes[itemKey];

    // Base damage + level bonus + rarity bonus
    let baseDamage = 5;
    switch (item?.rarity) {
      case 'common': baseDamage = 5; break;
      case 'uncommon': baseDamage = 8; break;
      case 'rare': baseDamage = 12; break;
      case 'epic': baseDamage = 18; break;
      case 'legendary': baseDamage = 25; break;
    }

    return baseDamage + Math.floor(level / 2);
  }

  // Legacy alias for getMaxHit
  getCombatDamage(itemKey) {
    return this.getMaxHit(itemKey);
  }

  // Get accuracy percentage for an item (chance to hit)
  // Base accuracy: 50% + (skill level * 0.5) + item accuracy bonus + equipment bonus
  // Capped at 95% to always have some miss chance
  getAccuracy(itemKey) {
    const level = this.getCombatLevel(itemKey);
    const item = this.itemTypes[itemKey];
    const itemAccuracyBonus = item?.accuracyBonus || 0;

    // Get equipment accuracy bonus (from held items)
    const equipmentBonus = this.getEquipmentAccuracyBonus();

    // Base 50% + 0.5% per level + item bonus + equipment bonus
    const accuracy = 50 + (level * 0.5) + itemAccuracyBonus + equipmentBonus;

    // Cap at 95%
    return Math.min(95, accuracy);
  }

  // Get total accuracy bonus from equipped gear
  getEquipmentAccuracyBonus() {
    let bonus = 0;
    for (const [slotType, itemKey] of Object.entries(this.equippedGear)) {
      if (!itemKey) continue;
      const gear = this.equipmentTypes[itemKey];
      if (gear?.accuracyBonus) {
        bonus += gear.accuracyBonus;
      }
    }
    return bonus;
  }

  // Get total drop bonus from equipped gear (increases ammo drop chance)
  getEquipmentDropBonus() {
    let bonus = 0;
    for (const [slotType, itemKey] of Object.entries(this.equippedGear)) {
      if (!itemKey) continue;
      const gear = this.equipmentTypes[itemKey];
      if (gear?.dropBonus) {
        bonus += gear.dropBonus;
      }
    }
    return bonus;
  }

  // Roll damage (0 to max hit) and check accuracy
  // Returns actual damage dealt (0 if miss)
  rollCombatDamage(itemKey) {
    const maxHit = this.getMaxHit(itemKey);
    const accuracy = this.getAccuracy(itemKey);

    // Check if hit lands
    const hitRoll = Math.random() * 100;
    if (hitRoll > accuracy) {
      // Miss!
      return { damage: 0, hit: false, maxHit };
    }

    // Hit! Roll damage from 1 to max hit (at least 1 on hit)
    const damage = Math.floor(Math.random() * maxHit) + 1;
    return { damage, hit: true, maxHit };
  }

  // Select combat item
  selectCombatItem(itemKey) {
    this.selectedCombatItem = itemKey;

    // Update max health based on HP skill level (level * 100)
    this.updateMaxHP();

    this.renderCombat();

    if (window.chatManager) {
      const item = this.itemTypes[itemKey];
      window.chatManager.addLogMessage(`⚔️ Equipped ${item.icon} ${item.name} for combat!`, 'item');
    }
  }

  // Attack a player
  attackPlayer(targetId) {
    if (!this.selectedCombatItem) {
      if (window.chatManager) {
        window.chatManager.addLogMessage('⚔️ Select a weapon first!', 'error');
      }
      return false;
    }

    // Check if we have the item
    const slotIndex = this.inventorySlots.findIndex(
      s => s && s.itemKey === this.selectedCombatItem && s.count > 0
    );

    if (slotIndex === -1) {
      if (window.chatManager) {
        window.chatManager.addLogMessage('⚔️ No ammo left!', 'error');
      }
      this.selectedCombatItem = null;
      this.renderCombat();
      return false;
    }

    // Consume one item
    this.inventorySlots[slotIndex].count--;
    if (this.inventorySlots[slotIndex].count <= 0) {
      this.inventorySlots[slotIndex] = null;
    }

    this.save();
    this.renderCombat();

    return true;
  }

  // Take damage
  takeDamage(damage) {
    this.combatHealth -= damage;

    if (this.combatHealth <= 0) {
      this.combatHealth = 0;
      this.die();
      return true; // Player died
    }

    this.renderCombat();
    return false; // Player alive
  }

  // Player died - respawn at home
  die() {
    if (window.chatManager) {
      window.chatManager.addLogMessage('💀 You have been defeated!', 'error');
    }

    // Collect ammo to drop
    const ammoTypes = this.getAllAmmoTypes();
    const deathPosition = this.playerPosition ? { ...this.playerPosition } : null;
    let totalDropped = 0;
    const itemsToDrop = [];

    if (deathPosition) {
      for (const ammoKey of ammoTypes) {
        const count = this.getItemCount(ammoKey);
        if (count > 0) {
          // Drop 80-95% of this ammo type
          const dropPercent = 0.80 + Math.random() * 0.15;
          const dropAmount = Math.floor(count * dropPercent);

          if (dropAmount > 0) {
            // Remove from inventory
            this.removeItemFromInventory(ammoKey, dropAmount);

            // Add to drop list (max 20 sprites per type)
            const spriteCount = Math.min(dropAmount, 20);
            for (let i = 0; i < spriteCount; i++) {
              itemsToDrop.push(ammoKey);
            }
            totalDropped += dropAmount;
          }
        }
      }
    }

    // Play death animation for player, then drop items, then respawn
    if (this.map3d && deathPosition) {
      this.map3d.playPlayerDeathAnimation(() => {
        // After death animation, explode items from center
        if (itemsToDrop.length > 0) {
          this.createItemExplosionFromCenter(itemsToDrop, deathPosition, itemsToDrop.length);

          if (window.chatManager) {
            window.chatManager.addLogMessage(`💥 You dropped ${totalDropped} ammo on death!`, 'error');
          }
        }

        // Wait for items to disperse, then respawn
        setTimeout(() => {
          // Reset health
          this.combatHealth = this.maxCombatHealth;

          if (this.homePosition && window.game) {
            window.game.fastTravelTo(this.homePosition.lat, this.homePosition.lng);
            if (window.chatManager) {
              window.chatManager.addLogMessage('🏠 Respawned at home!', 'info');
            }
          } else if (window.game) {
            // Respawn at default location
            window.game.fastTravelTo(GAME_CONFIG.defaultPosition.lat, GAME_CONFIG.defaultPosition.lng);
            if (window.chatManager) {
              window.chatManager.addLogMessage('🏠 Respawned at spawn point!', 'info');
            }
          }

          // Play respawn animation
          if (this.map3d) {
            this.map3d.playPlayerRespawnAnimation();
          }

          this.renderCombat();
        }, 1500);
      });
    } else {
      // Fallback if no map3d
      this.combatHealth = this.maxCombatHealth;
      setTimeout(() => {
        if (this.homePosition && window.game) {
          window.game.fastTravelTo(this.homePosition.lat, this.homePosition.lng);
        } else if (window.game) {
          window.game.fastTravelTo(GAME_CONFIG.defaultPosition.lat, GAME_CONFIG.defaultPosition.lng);
        }
        this.renderCombat();
      }, 1500);
    }

    this.save();
  }

  // Heal (for later use)
  heal(amount) {
    this.combatHealth = Math.min(this.combatHealth + amount, this.maxCombatHealth);
    this.renderCombat();
  }

  // Find slot with item or first empty slot
  findSlotForItem(itemKey) {
    // First try to stack with existing
    for (let i = 0; i < this.inventorySlots.length; i++) {
      const slot = this.inventorySlots[i];
      if (slot && slot.itemKey === itemKey) {
        return i;
      }
    }
    // Find first empty slot
    for (let i = 0; i < this.inventorySlots.length; i++) {
      if (!this.inventorySlots[i]) {
        return i;
      }
    }
    return -1; // Inventory full
  }

  // Add item to inventory
  addItem(itemKey, count = 1) {
    const slotIndex = this.findSlotForItem(itemKey);
    if (slotIndex === -1) {
      this.showNotification('Inventory full!', 'error');
      return false;
    }

    if (this.inventorySlots[slotIndex]) {
      this.inventorySlots[slotIndex].count += count;
    } else {
      this.inventorySlots[slotIndex] = { itemKey, count };
    }
    return true;
  }

  // Get total count of an item
  getItemCount(itemKey) {
    let total = 0;
    for (const slot of this.inventorySlots) {
      if (slot && slot.itemKey === itemKey) {
        total += slot.count;
      }
    }
    return total;
  }

  // Remove item from inventory (returns actual amount removed)
  removeItemFromInventory(itemKey, count = 1) {
    let remaining = count;

    for (let i = 0; i < this.inventorySlots.length && remaining > 0; i++) {
      const slot = this.inventorySlots[i];
      if (slot && slot.itemKey === itemKey) {
        const toRemove = Math.min(remaining, slot.count);
        slot.count -= toRemove;
        remaining -= toRemove;

        // Clear slot if empty
        if (slot.count <= 0) {
          this.inventorySlots[i] = null;
        }
      }
    }

    return count - remaining; // Return actual amount removed
  }

  // Alias for addItem (for consistency)
  addItemToInventory(itemKey, count = 1) {
    return this.addItem(itemKey, count);
  }

  // Get skill key for weather type
  getSkillForWeather(weather) {
    for (const [key, skill] of Object.entries(this.skills)) {
      if (skill.weather === weather ||
          (weather === 'drizzle' && skill.weather === 'rain')) {
        return key;
      }
    }
    return 'sunbathing'; // Default to sunbathing for clear/unknown
  }

  // Get item key for weather type
  getItemForWeather(weather) {
    for (const [key, item] of Object.entries(this.itemTypes)) {
      if (item.weather === weather ||
          (weather === 'drizzle' && item.weather === 'rain')) {
        return key;
      }
    }
    return 'sunstone';
  }

  // Start gaining XP for current weather
  startWeatherXP(weather) {
    this.currentWeather = weather;

    // Clear existing intervals
    this.stopWeatherXP();

    // Grant XP every 3 seconds
    this.xpInterval = setInterval(() => {
      this.grantWeatherXP();
    }, 3000);

    // Check for item drops every 10 seconds
    this.itemCheckInterval = setInterval(() => {
      this.checkItemDrop();
    }, 10000);

    // Update UI to show active skill
    this.updateUI();
  }

  // Stop XP gain
  stopWeatherXP() {
    if (this.xpInterval) {
      clearInterval(this.xpInterval);
      this.xpInterval = null;
    }
    if (this.itemCheckInterval) {
      clearInterval(this.itemCheckInterval);
      this.itemCheckInterval = null;
    }
  }

  // Grant XP for current weather
  grantWeatherXP() {
    const skillKey = this.getSkillForWeather(this.currentWeather);
    const skill = this.skills[skillKey];
    if (!skill) return;

    const oldLevel = this.getLevel(skill.xp);

    // Grant 5-15 XP
    const xpGain = 5 + Math.floor(Math.random() * 11);
    skill.xp += xpGain;

    const newLevel = this.getLevel(skill.xp);

    // Level up - show notification and log
    if (newLevel > oldLevel) {
      this.showNotification(`${skill.icon} ${skill.name} leveled up to ${newLevel}!`, 'levelup');
      // Also add to game log
      if (window.chatManager) {
        window.chatManager.addLogMessage(`${skill.icon} ${skill.name} leveled up to ${newLevel}!`, 'levelup');
      }
    }

    // Update UI
    this.updateUI();
    this.save();
  }

  // Check for random item drop - now drops on ground instead of inventory
  checkItemDrop() {
    if (!this.playerPosition) return;

    const itemKey = this.getItemForWeather(this.currentWeather);
    const item = this.itemTypes[itemKey];
    if (!item) return;

    // Drop chance based on rarity
    let dropChance;
    switch (item.rarity) {
      case 'common': dropChance = 0.15; break;    // 15%
      case 'uncommon': dropChance = 0.08; break;  // 8%
      case 'rare': dropChance = 0.03; break;      // 3%
      default: dropChance = 0.1;
    }

    // Add equipment drop bonus (percentage increase)
    const dropBonus = this.getEquipmentDropBonus();
    if (dropBonus > 0) {
      dropChance *= (1 + dropBonus / 100);  // e.g. 5% bonus = 1.05x multiplier
    }

    if (Math.random() < dropChance) {
      this.dropItemOnGround(itemKey);
    }
  }

  // Drop an item on the ground near the player
  dropItemOnGround(itemKey) {
    this.dropItemAtPosition(itemKey, this.playerPosition);
  }

  // Drop an item on the ground at a specific position
  // radiusMultiplier: controls spread of items (0.5 = tight, 1.0 = normal, 2.0 = wide)
  // silent: if true, don't log to chat
  dropItemAtPosition(itemKey, centerPosition, radiusMultiplier = 1.0, silent = false) {
    if (!centerPosition || !this.map3d) return;

    const item = this.itemTypes[itemKey];
    if (!item) return;

    // Random position near center
    const angle = Math.random() * Math.PI * 2;
    const distance = this.dropConfig.dropRadius * (0.3 + Math.random() * 0.7) * radiusMultiplier;

    const dropPosition = {
      lat: centerPosition.lat + Math.cos(angle) * distance,
      lng: centerPosition.lng + Math.sin(angle) * distance
    };

    // Create dropped item
    const droppedItem = {
      id: ++this.droppedItemId,
      itemKey,
      position: dropPosition,
      createdAt: Date.now(),
      sprite: null
    };

    // Create 3D sprite for the item
    if (this.map3d) {
      droppedItem.sprite = this.map3d.createDroppedItem(droppedItem.id, item, dropPosition);
    }

    this.droppedItems.push(droppedItem);

    // Log to game log (no popup notification for drops)
    if (!silent && window.chatManager) {
      window.chatManager.addLogMessage(`${item.icon} ${item.name} dropped nearby!`, 'item');
    }
  }

  // Create an explosion of items at a position (for NPC death, player death, etc.)
  createItemExplosion(itemKeys, centerPosition, count, radiusMultiplier = 0.8) {
    if (!centerPosition || !this.map3d || itemKeys.length === 0) return;

    // Drop multiple items in an explosion pattern
    for (let i = 0; i < count; i++) {
      const itemKey = itemKeys[Math.floor(Math.random() * itemKeys.length)];
      this.dropItemAtPosition(itemKey, centerPosition, radiusMultiplier, true);
    }

    // Show explosion effect
    if (this.map3d) {
      this.map3d.showExplosionEffect(centerPosition);
    }
  }

  // Create an explosion of items that radiate outward from the center (for death animations)
  // Items spawn at center then animate outward
  createItemExplosionFromCenter(itemKeys, centerPosition, count) {
    if (!centerPosition || !this.map3d || itemKeys.length === 0) return;

    // Show explosion effect first
    this.map3d.showExplosionEffect(centerPosition);

    // Drop items with staggered timing radiating from center
    const dropDelay = 50; // ms between each drop
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const itemKey = itemKeys[Math.floor(Math.random() * itemKeys.length)];
        const item = this.itemTypes[itemKey];
        if (!item) return;

        // Calculate outward direction
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
        const distance = this.dropConfig.dropRadius * (0.4 + Math.random() * 0.6);

        const dropPosition = {
          lat: centerPosition.lat + Math.cos(angle) * distance,
          lng: centerPosition.lng + Math.sin(angle) * distance
        };

        // Create dropped item
        const droppedItem = {
          id: ++this.droppedItemId,
          itemKey,
          position: dropPosition,
          createdAt: Date.now(),
          sprite: null
        };

        // Create 3D sprite that animates from center to drop position
        if (this.map3d) {
          droppedItem.sprite = this.map3d.createDroppedItemAnimated(
            droppedItem.id, item, centerPosition, dropPosition
          );
        }

        this.droppedItems.push(droppedItem);
      }, i * dropDelay);
    }
  }

  // Update dropped items (check despawn, distance, pickup)
  updateDroppedItems() {
    if (!this.playerPosition) return;

    const now = Date.now();
    const toRemove = [];

    for (const droppedItem of this.droppedItems) {
      // Check despawn time
      if (now - droppedItem.createdAt > this.dropConfig.despawnTime) {
        toRemove.push(droppedItem);
        continue;
      }

      // Check distance from player
      const dist = this.getDistance(this.playerPosition, droppedItem.position);

      // Too far - despawn
      if (dist > this.dropConfig.maxDistance) {
        toRemove.push(droppedItem);
        continue;
      }

      // Close enough to pick up
      if (dist < this.dropConfig.pickupDistance) {
        this.pickupDroppedItem(droppedItem);
        toRemove.push(droppedItem);
      }
    }

    // Remove items
    for (const item of toRemove) {
      this.removeDroppedItem(item);
    }
  }

  // Pick up a dropped item
  pickupDroppedItem(droppedItem) {
    const item = this.itemTypes[droppedItem.itemKey];
    if (!item) return;

    if (this.addItem(droppedItem.itemKey, 1)) {
      // Log to game log (no popup notification for pickups)
      if (window.chatManager) {
        window.chatManager.addLogMessage(`${item.icon} Picked up: ${item.name}!`, 'pickup');
      }
      this.updateUI();
      this.save();
    }
  }

  // Remove a dropped item
  removeDroppedItem(droppedItem) {
    // Remove 3D sprite
    if (this.map3d && droppedItem.sprite) {
      this.map3d.removeDroppedItem(droppedItem.id);
    }

    // Remove from array
    const index = this.droppedItems.indexOf(droppedItem);
    if (index > -1) {
      this.droppedItems.splice(index, 1);
    }
  }

  // Calculate distance between two lat/lng positions
  // Accounts for longitude compression at different latitudes
  getDistance(pos1, pos2) {
    const latDiff = pos1.lat - pos2.lat;
    // Adjust longitude difference by cosine of average latitude
    const avgLat = (pos1.lat + pos2.lat) / 2;
    const lngDiff = (pos1.lng - pos2.lng) * Math.cos(avgLat * Math.PI / 180);
    return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
  }

  // Update player position (called from map.js)
  setPlayerPosition(position) {
    const wasNearHome = this.isNearHome();
    const wasInSafeZone = this.playerPosition ? this.isInSafeZone(this.playerPosition.lat, this.playerPosition.lng) : null;

    this.playerPosition = position;

    const isNearHomeNow = this.isNearHome();
    const isInSafeZoneNow = this.isInSafeZone(position.lat, position.lng);

    // Refresh home tab if near-home status changed
    if (wasNearHome !== isNearHomeNow && this.activeTab === 'home') {
      this.renderHome();
    }

    // Refresh combat tab zone status if safe zone status changed
    if (wasInSafeZone !== isInSafeZoneNow && this.activeTab === 'combat') {
      this.updateZoneStatus();
    }
  }

  // Update just the zone status in combat tab (without full re-render)
  updateZoneStatus() {
    const zoneStatusEl = document.querySelector('.zone-status');
    if (!zoneStatusEl) return;

    const safeZoneName = this.playerPosition ?
      this.isInSafeZone(this.playerPosition.lat, this.playerPosition.lng) : null;

    if (safeZoneName) {
      zoneStatusEl.className = 'zone-status safe';
      zoneStatusEl.innerHTML = `🛡️ Safe Zone: ${safeZoneName}`;
    } else {
      zoneStatusEl.className = 'zone-status pvp';
      zoneStatusEl.innerHTML = `⚔️ PvP Zone`;
    }
  }

  // Set map3d reference (called from map.js)
  setMap3D(map3d) {
    this.map3d = map3d;

    // Create home shop entity if home position is already set and shop doesn't exist
    if (this.homePosition && this.map3d && !this.map3d.homeShopData) {
      this.map3d.createHomeShop(this.homePosition);
    }
  }

  // Show notification - now at center top
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `skill-notification ${type}`;
    notification.textContent = message;

    // Position at center top
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.9);
      border: 2px solid ${type === 'levelup' ? '#ffb000' : type === 'error' ? '#ff4444' : '#00ff00'};
      color: ${type === 'levelup' ? '#ffb000' : type === 'error' ? '#ff4444' : '#00ff00'};
      padding: 12px 20px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      z-index: 1000;
      animation: notificationSlideDown 0.3s ease-out, notificationFadeOut 0.5s ease-in 2.5s forwards;
      white-space: nowrap;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentElement) {
        notification.parentElement.removeChild(notification);
      }
    }, 3000);
  }

  // Set user ID for per-account storage
  setUserId(userId) {
    // If switching users, reset data first
    if (this.userId && this.userId !== userId) {
      this.reset();
    }
    this.userId = userId;
    this.load(); // Load data for this user
    this.updateUI();
  }

  // Reset skills and inventory to defaults
  reset() {
    // Reset skills
    for (const skill of Object.values(this.skills)) {
      skill.xp = 0;
    }
    // Reset inventory
    this.inventorySlots = new Array(24).fill(null);
    // Clear dropped items
    for (const item of [...this.droppedItems]) {
      this.removeDroppedItem(item);
    }
    this.droppedItems = [];
  }

  // Get storage key for current user
  getStorageKey() {
    if (!this.userId) return 'geommo_skills';
    return `geommo_skills_${this.userId}`;
  }

  // Save to localStorage (per-user)
  save() {
    const data = {
      skills: {},
      inventorySlots: this.inventorySlots,
      bankSlots: this.bankSlots,
      homePosition: this.homePosition,
      selectedCombatItem: this.selectedCombatItem,
      combatHealth: this.combatHealth,
      maxCombatHealth: this.maxCombatHealth,
      // Equipment data
      equippedGear: this.equippedGear,
      lightBalance: this.lightBalance
    };

    for (const [key, skill] of Object.entries(this.skills)) {
      data.skills[key] = skill.xp;
    }

    localStorage.setItem(this.getStorageKey(), JSON.stringify(data));
  }

  // Load from localStorage (per-user)
  load() {
    const saved = localStorage.getItem(this.getStorageKey());
    if (!saved) {
      // No saved data for this user - start fresh
      this.reset();
      return;
    }

    try {
      const data = JSON.parse(saved);

      // Load skills XP
      if (data.skills) {
        for (const [key, xp] of Object.entries(data.skills)) {
          if (this.skills[key]) {
            this.skills[key].xp = xp;
          }
        }
      }

      // Load inventory slots (new format)
      if (data.inventorySlots) {
        this.inventorySlots = data.inventorySlots;
        // Ensure 24 slots
        while (this.inventorySlots.length < 24) {
          this.inventorySlots.push(null);
        }
      }
      // Migration from old format
      else if (data.inventory) {
        let slotIndex = 0;
        for (const [key, count] of Object.entries(data.inventory)) {
          if (count > 0 && slotIndex < 24) {
            this.inventorySlots[slotIndex] = { itemKey: key, count };
            slotIndex++;
          }
        }
      }

      // Load bank slots
      if (data.bankSlots) {
        this.bankSlots = data.bankSlots;
        // Ensure 100 slots
        while (this.bankSlots.length < 100) {
          this.bankSlots.push(null);
        }
      }

      // Load home position
      if (data.homePosition) {
        this.homePosition = data.homePosition;
      }

      // Load combat data
      if (data.selectedCombatItem) {
        this.selectedCombatItem = data.selectedCombatItem;
      }

      // Recalculate max HP based on HP skill level (level * 100)
      this.maxCombatHealth = this.calculateMaxHP();

      // Load current HP (capped at new max)
      if (data.combatHealth !== undefined) {
        this.combatHealth = Math.min(data.combatHealth, this.maxCombatHealth);
      } else {
        this.combatHealth = this.maxCombatHealth;
      }

      // Load equipment data
      if (data.equippedGear) {
        this.equippedGear = { ...this.equippedGear, ...data.equippedGear };
      }
      // Backward compatibility: migrate old equippedCosmetics to equippedGear
      else if (data.equippedCosmetics) {
        this.equippedGear = { ...this.equippedGear, ...data.equippedCosmetics };
      }
      // Migrate old ownedCosmetics to inventory
      if (data.ownedCosmetics && data.ownedCosmetics.length > 0) {
        for (const cosmeticKey of data.ownedCosmetics) {
          this.addItem(cosmeticKey, 1);
        }
      }
      if (data.lightBalance !== undefined) {
        this.lightBalance = data.lightBalance;
      }

      // Sync combat stats to server for PvP
      setTimeout(() => this.syncCombatStatsToServer(), 1000);
    } catch (e) {
      console.error('Failed to load skills data:', e);
    }
  }

  // Get total level
  getTotalLevel() {
    let total = 0;
    for (const skill of Object.values(this.skills)) {
      total += this.getLevel(skill.xp);
    }
    return total;
  }

  // Grant all equipment items and Light to a player (for testing)
  grantAllEquipment() {
    console.log('Granting all equipment and Light to player...');

    // Grant 1000 Light currency
    this.lightBalance = 1000;

    // Grant all equipment items to inventory
    for (const [key, item] of Object.entries(this.equipmentTypes)) {
      this.addItem(key, 1);
    }

    // Grant some combat items too
    this.addItem('lightningshard', 50);
    this.addItem('mistessence', 50);
    this.addItem('sunstone', 20);
    this.addItem('snowflake', 20);

    this.save();
    this.updateUI();
    console.log('Granted all equipment, 1000 Light, and combat items!');
  }

  // Set username and check for test player
  setUsername(username) {
    // Grant test items to player "Jo" (case insensitive)
    if (username && username.toLowerCase() === 'jo') {
      // Check if we've already granted items (only grant once)
      const grantedKey = `geommo_granted_${this.userId}`;
      if (!localStorage.getItem(grantedKey)) {
        setTimeout(() => {
          this.grantAllEquipment();
          localStorage.setItem(grantedKey, 'true');
          console.log('Test items granted to Jo!');
        }, 2000); // Delay to ensure everything is initialized
      }
    }
  }

  // Cleanup
  dispose() {
    this.stopWeatherXP();
    if (this.droppedItemCheckInterval) {
      clearInterval(this.droppedItemCheckInterval);
    }
    // Remove all dropped items
    for (const item of [...this.droppedItems]) {
      this.removeDroppedItem(item);
    }
  }
}

// Export
window.SkillsManager = SkillsManager;
