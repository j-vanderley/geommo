// Skills & Inventory System
class SkillsManager {
  constructor() {
    // User ID for per-account storage
    this.userId = null;

    // Skills - one for each weather type + HP skill
    this.skills = {
      hitpoints: { name: 'Hitpoints', xp: 0, icon: '❤️', isCombat: true },
      sunbathing: { name: 'Sunbathing', weather: 'clear', xp: 0, icon: '☀️' },
      cloudgazing: { name: 'Cloud Gazing', weather: 'cloudy', xp: 0, icon: '☁️' },
      mistwalking: { name: 'Mist Walking', weather: 'fog', xp: 0, icon: '🌫️' },
      raindancing: { name: 'Rain Dancing', weather: 'rain', xp: 0, icon: '🌧️' },
      snowdrifting: { name: 'Snow Drifting', weather: 'snow', xp: 0, icon: '❄️' },
      stormchasing: { name: 'Storm Chasing', weather: 'storm', xp: 0, icon: '⛈️' }
    };

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

    // Equipment items (wearable/visible gear)
    this.equipmentTypes = {
      // Skins (change base body appearance)
      skin_snowball: { name: 'Snowball', type: 'skin', icon: '⚪', color: '#ffffff', price: 50, particle: 'snow', isEquipment: true },
      skin_lightning: { name: 'Lightning Ball', type: 'skin', icon: '⚡', color: '#ffff00', price: 75, particle: 'spark', isEquipment: true },
      skin_flame: { name: 'Flame Spirit', type: 'skin', icon: '🔥', color: '#ff4400', price: 75, particle: 'fire', isEquipment: true },
      skin_void: { name: 'Void Walker', type: 'skin', icon: '🌑', color: '#330066', price: 100, particle: 'void', isEquipment: true },
      // Hats (head-worn items)
      hat_ice_tiara: { name: 'Ice Tiara', type: 'hat', icon: '👑', color: '#88ddff', price: 30, isEquipment: true },
      hat_storm_crown: { name: 'Storm Crown', type: 'hat', icon: '⚜️', color: '#9966ff', price: 40, isEquipment: true },
      hat_sun_halo: { name: 'Sun Halo', type: 'hat', icon: '☀️', color: '#ffcc00', price: 35, isEquipment: true },
      hat_mist_hood: { name: 'Mist Hood', type: 'hat', icon: '🎭', color: '#aabbcc', price: 25, isEquipment: true },
      // Held items (objects held by character)
      held_lightning_bolt: { name: 'Lightning Bolt', type: 'held', icon: '🗡️', color: '#ffff00', price: 45, isEquipment: true },
      held_frost_staff: { name: 'Frost Staff', type: 'held', icon: '🪄', color: '#88ddff', price: 40, isEquipment: true },
      held_sun_orb: { name: 'Sun Orb', type: 'held', icon: '🔮', color: '#ffaa00', price: 35, isEquipment: true },
      held_void_blade: { name: 'Void Blade', type: 'held', icon: '⚔️', color: '#660099', price: 60, isEquipment: true },
      // Auras (particle effects around character)
      aura_frost: { name: 'Frost Aura', type: 'aura', icon: '❄️', color: '#88ddff', price: 80, particle: 'frost', isEquipment: true },
      aura_fire: { name: 'Fire Aura', type: 'aura', icon: '🔥', color: '#ff4400', price: 80, particle: 'fire', isEquipment: true },
      aura_lightning: { name: 'Lightning Aura', type: 'aura', icon: '⚡', color: '#ffff00', price: 100, particle: 'lightning', isEquipment: true },
      aura_void: { name: 'Void Aura', type: 'aura', icon: '🌀', color: '#660099', price: 120, particle: 'void', isEquipment: true },
      aura_holy: { name: 'Holy Aura', type: 'aura', icon: '✨', color: '#ffffaa', price: 150, particle: 'holy', isEquipment: true }
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
    }

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
    // Handle combat turns
    if (this.inCombat && this.npcCombatTarget) {
      this.combatTurnTick++;

      // Every 2 ticks (1.2 seconds), process a combat turn
      if (this.combatTurnTick >= this.COMBAT_TICKS) {
        this.combatTurnTick = 0;
        this.processCombatTurn();
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
        </div>
      </div>
      <div id="home-content" class="home-content hidden"></div>
      <div id="skills-content" class="skills-content"></div>
      <div id="inventory-content" class="inventory-content hidden"></div>
      <div id="combat-content" class="combat-content hidden"></div>
      <div id="equipment-content" class="equipment-content hidden"></div>
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
    }
  }

  // Render skills tab as grid (same layout as inventory)
  renderSkills() {
    const container = document.getElementById('skills-content');
    if (!container) return;

    let html = '<div class="skills-grid">';
    const skillEntries = Object.entries(this.skills);

    // Render skills in grid format (same as inventory)
    for (const [key, skill] of skillEntries) {
      const level = this.getLevel(skill.xp);
      const isActive = this.getSkillForWeather(this.currentWeather) === key;

      html += `
        <div class="skill-slot ${isActive ? 'active' : ''}" data-skill="${key}">
          <span class="skill-slot-icon">${skill.icon}</span>
          <span class="skill-slot-level">lvl:${level}</span>
        </div>
      `;
    }

    html += '</div>';
    container.innerHTML = html;

    // Add hover listeners for tooltips
    container.querySelectorAll('.skill-slot[data-skill]').forEach(slot => {
      const skillKey = slot.dataset.skill;
      const skill = this.skills[skillKey];

      slot.addEventListener('mouseenter', () => this.showTooltip(skill, slot));
      slot.addEventListener('mouseleave', () => this.hideTooltip());
    });
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

  // Render home tab
  renderHome() {
    const container = document.getElementById('home-content');
    if (!container) return;

    const hasHome = this.homePosition !== null;
    const posText = hasHome
      ? `${this.homePosition.lat.toFixed(4)}, ${this.homePosition.lng.toFixed(4)}`
      : 'Not set';

    container.innerHTML = `
      <div class="home-panel">
        <div class="home-section">
          <h4>🏠 Home Location</h4>
          <p class="home-coords">${posText}</p>
          <button class="osrs-btn small-btn home-btn" id="set-home-btn">
            ${hasHome ? 'Update Home' : 'Set Home Here'}
          </button>
          ${hasHome ? `
            <button class="osrs-btn small-btn home-btn" id="teleport-home-btn">
              Teleport Home
            </button>
          ` : ''}
        </div>
        <div class="home-shop-section">
          <h4>🏪 Home Shop</h4>
          <p class="home-shop-desc">Buy supplies & sell items</p>
          <button class="osrs-btn small-btn shop-btn" id="open-home-shop-btn">
            Open Shop
          </button>
        </div>
        <div class="home-info">
          <p>Set your home to respawn here after combat.</p>
        </div>
      </div>
    `;

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
  }

  // Set current position as home
  setHomePosition() {
    if (!this.playerPosition) return;

    this.homePosition = { ...this.playerPosition };
    this.save();
    this.renderHome();

    if (window.chatManager) {
      window.chatManager.addLogMessage('🏠 Home location set!', 'info');
    }
  }

  // Teleport to home position
  teleportHome() {
    if (!this.homePosition || !window.game) return;

    window.game.fastTravelTo(this.homePosition.lat, this.homePosition.lng);

    if (window.chatManager) {
      window.chatManager.addLogMessage('🏠 Teleported home!', 'info');
    }
  }

  // Show home shop dialog
  showHomeShop() {
    // Close any existing shop
    this.closeHomeShop();

    // Get sellable items from inventory
    const sellableItems = this.inventorySlots
      .filter(slot => slot && slot.count > 0)
      .map(slot => {
        const item = this.itemTypes[slot.itemKey];
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

  // Sell a single item
  sellItem(itemKey, count = 1) {
    const slotIndex = this.inventorySlots.findIndex(
      s => s && s.itemKey === itemKey && s.count > 0
    );
    if (slotIndex === -1) return;

    const item = this.itemTypes[itemKey];
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

  // Sell all items in inventory
  sellAllItems() {
    let totalValue = 0;
    let itemsSold = 0;

    for (let i = 0; i < this.inventorySlots.length; i++) {
      const slot = this.inventorySlots[i];
      if (!slot || slot.count <= 0) continue;

      const item = this.itemTypes[slot.itemKey];
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

  // Render combat tab
  renderCombat() {
    const container = document.getElementById('combat-content');
    if (!container) return;

    // Get items that can be used for combat (gathered items only)
    const combatItems = this.getCombatItems();

    let itemsHtml = '';
    if (combatItems.length === 0) {
      itemsHtml = `
        <div class="no-combat-items">
          <p class="no-items-title">⚠️ No Ammo</p>
          <p class="no-items-desc">Collect weather items to fight!</p>
        </div>
      `;
    } else {
      itemsHtml = '<div class="combat-ammo-grid">';
      for (const item of combatItems) {
        const isSelected = this.selectedCombatItem === item.itemKey;
        const itemType = this.itemTypes[item.itemKey];
        if (!itemType) continue;
        const damage = this.getCombatDamage(item.itemKey);
        itemsHtml += `
          <div class="combat-ammo-slot ${isSelected ? 'selected' : ''}"
               data-item="${item.itemKey}"
               title="${itemType.name}">
            <span class="ammo-icon">${itemType.icon}</span>
            <span class="ammo-qty">${item.count}</span>
            <span class="ammo-dmg">${damage}</span>
          </div>
        `;
      }
      itemsHtml += '</div>';
    }

    // Health display
    const healthPercent = (this.combatHealth / this.maxCombatHealth) * 100;

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
          <h4>⚔️ Select Ammo</h4>
          ${itemsHtml}
        </div>

        ${this.selectedCombatItem ? `
          <div class="combat-stats">
            <div class="combat-stat">🎯 Accuracy: ${Math.round(this.getAccuracy(this.selectedCombatItem))}%</div>
            <div class="combat-stat">💥 Max Hit: ${this.getMaxHit(this.selectedCombatItem)}</div>
          </div>
          <div class="combat-ready">✅ Ready for battle!</div>
        ` : '<div class="combat-warning">⚠️ Select ammo to fight</div>'}
      </div>
    `;

    // Combat item selection
    container.querySelectorAll('.combat-ammo-slot').forEach(el => {
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

    // Equipment slots in 2x2 grid
    const slotTypes = ['skin', 'hat', 'held', 'aura'];
    const slotNames = { skin: 'Skin', hat: 'Hat', held: 'Held', aura: 'Aura' };
    const slotIcons = { skin: '👤', hat: '🎩', held: '🗡️', aura: '✨' };

    let slotsHtml = '<div class="equipment-grid">';
    for (const slotType of slotTypes) {
      const equipped = this.equippedGear[slotType];
      const gear = equipped ? this.equipmentTypes[equipped] : null;
      slotsHtml += `
        <div class="equip-slot ${equipped ? 'equipped' : ''}" data-slot="${slotType}" title="${equipped ? gear.name + ' - Click to unequip' : slotNames[slotType]}">
          <span class="equip-icon" ${gear ? `style="color: ${gear.color}"` : ''}>${gear ? gear.icon : slotIcons[slotType]}</span>
          <span class="equip-label">${slotNames[slotType]}</span>
        </div>
      `;
    }
    slotsHtml += '</div>';

    container.innerHTML = `
      <div class="equipment-panel">
        <div class="light-balance">
          <span class="light-icon">✨</span>
          <span class="light-amount">${this.lightBalance}</span>
        </div>
        ${slotsHtml}
        <p class="equip-hint">Equip gear from inventory</p>
      </div>
    `;

    // Click handlers for unequipping gear
    container.querySelectorAll('.equip-slot.equipped').forEach(el => {
      el.addEventListener('click', () => {
        const slotType = el.dataset.slot;
        this.unequipGear(slotType);
      });
    });
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

  // Get items that can be sold for Light
  getSellableItems() {
    const items = [];
    for (const slot of this.inventorySlots) {
      if (slot && slot.count > 0) {
        const itemType = this.itemTypes[slot.itemKey];
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

  // Sell one item for Light
  sellItem(itemKey, count = 1) {
    const itemType = this.itemTypes[itemKey];
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

  // Sell all items for Light
  sellAllItems() {
    const sellable = this.getSellableItems();
    if (sellable.length === 0) return;

    let totalLight = 0;
    let totalItems = 0;

    for (const item of sellable) {
      const itemType = this.itemTypes[item.itemKey];
      totalLight += item.count * itemType.sellValue;
      totalItems += item.count;
    }

    // Clear sellable items from inventory
    for (let i = 0; i < this.inventorySlots.length; i++) {
      const slot = this.inventorySlots[i];
      if (slot) {
        const itemType = this.itemTypes[slot.itemKey];
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

    // Clear existing NPCs first
    for (const npc of this.npcs) {
      if (this.map3d) {
        this.map3d.removeNPC(npc.id);
      }
    }
    this.npcs = [];

    // Create NPCs from server data
    for (const serverNPC of serverNPCs) {
      // Create client-side NPC instance from server data
      const npcInstance = {
        id: serverNPC.id,
        name: serverNPC.name,
        title: serverNPC.title,
        icon: serverNPC.icon,
        equipment: serverNPC.equipment,
        sellsEquipment: serverNPC.sellsEquipment,
        baseCity: serverNPC.baseCity,
        health: serverNPC.health,
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

      console.log(`Loaded NPC from server: ${npcInstance.name} (${npcInstance.icon}) at ${npcInstance.baseCity} - Position: ${npcInstance.position.lat.toFixed(4)}, ${npcInstance.position.lng.toFixed(4)}`);
    }

    this.npcsInitialized = true;
    console.log(`Loaded ${this.npcs.length} NPCs from server:`, this.npcs.map(n => `${n.icon} ${n.name}`).join(', '));
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

  // Show NPC interaction menu (Trade/Battle/Talk options)
  showNPCDialog(npcId) {
    const npc = this.npcs.find(n => n.id === npcId);
    if (!npc) return;

    // Close any existing menu
    this.closeNPCMenu();

    // Build menu options based on NPC type
    const isBattleOnly = npc.isBattleOnly;
    const isTraining = npc.isTraining;

    // Build drops display
    const dropInfo = npc.drops && npc.drops.length > 0 ?
      `<div class="npc-drop-info">
        <span class="drop-label">Drops:</span>
        ${npc.drops.map(d => {
          const item = this.itemTypes[d];
          return item ? `<span class="drop-item" title="${item.name}">${item.icon}</span>` : '';
        }).join('')}
        <span class="drop-chance">(${Math.round((npc.dropChance || 0) * 100)}%)</span>
      </div>` : '';

    // NPC difficulty label
    const difficultyLabel = isTraining ? '<span class="npc-difficulty training">Training</span>' :
      (isBattleOnly ? '<span class="npc-difficulty battle">Battle</span>' :
      '<span class="npc-difficulty boss">Boss</span>');

    // Create interaction menu
    const menu = document.createElement('div');
    menu.className = 'npc-interaction-menu';
    menu.innerHTML = `
      <div class="npc-menu-overlay"></div>
      <div class="npc-menu-content">
        <div class="npc-menu-header">
          <span class="npc-menu-icon" style="color: ${npc.color}">${npc.icon}</span>
          <div class="npc-menu-info">
            <h3>${npc.name}</h3>
            <span class="npc-menu-title">${npc.title}</span>
            ${difficultyLabel}
          </div>
        </div>
        <div class="npc-stats">
          <div class="npc-stat">
            <span class="stat-icon">❤️</span>
            <span class="stat-value">${npc.health}/${npc.maxHealth}</span>
          </div>
          <div class="npc-stat">
            <span class="stat-icon">⚔️</span>
            <span class="stat-value">${npc.damage} max hit</span>
          </div>
          <div class="npc-stat">
            <span class="stat-icon">📍</span>
            <span class="stat-value">${npc.baseCity}</span>
          </div>
        </div>
        ${dropInfo}
        ${this.selectedCombatItem ? `
        <div class="npc-player-stats">
          <div class="player-combat-title">Your Combat Stats:</div>
          <div class="player-combat-row">
            <span>🎯 ${Math.round(this.getAccuracy(this.selectedCombatItem))}% accuracy</span>
            <span>💥 0-${this.getMaxHit(this.selectedCombatItem)} damage</span>
          </div>
        </div>
        ` : '<div class="npc-player-warning">⚠️ Select ammo in Combat tab first!</div>'}
        <div class="npc-menu-options">
          ${!isBattleOnly ? `
          <button class="npc-menu-btn trade-btn" data-action="trade">
            <span class="btn-icon">💰</span>
            <span class="btn-text">Trade</span>
          </button>
          ` : ''}
          <button class="npc-menu-btn inspect-btn" data-action="inspect">
            <span class="btn-icon">🔍</span>
            <span class="btn-text">Inspect</span>
          </button>
          <button class="npc-menu-btn battle-btn" data-action="battle">
            <span class="btn-icon">⚔️</span>
            <span class="btn-text">Battle</span>
          </button>
        </div>
        <button class="npc-menu-close">✕</button>
      </div>
    `;

    document.body.appendChild(menu);
    this.activeNPCMenu = { element: menu, npc, npcId };

    // Event handlers
    menu.querySelector('.npc-menu-overlay')?.addEventListener('click', () => this.closeNPCMenu());
    menu.querySelector('.npc-menu-close')?.addEventListener('click', () => this.closeNPCMenu());

    menu.querySelectorAll('.npc-menu-btn').forEach(btn => {
      btn.addEventListener('click', () => {
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

  // Show player inspection dialog
  showPlayerInspect(player) {
    if (!player) return;

    // Close any existing menu
    this.closePlayerInspect();

    // Get player's equipment display
    const equipment = player.equipment || {};
    const equipDisplay = [];
    if (equipment.skin) {
      const item = this.equipmentTypes[equipment.skin];
      if (item) equipDisplay.push(`<span title="${item.name}">${item.icon}</span>`);
    }
    if (equipment.hat) {
      const item = this.equipmentTypes[equipment.hat];
      if (item) equipDisplay.push(`<span title="${item.name}">${item.icon}</span>`);
    }
    if (equipment.held) {
      const item = this.equipmentTypes[equipment.held];
      if (item) equipDisplay.push(`<span title="${item.name}">${item.icon}</span>`);
    }
    if (equipment.aura) {
      const item = this.equipmentTypes[equipment.aura];
      if (item) equipDisplay.push(`<span title="${item.name}">${item.icon}</span>`);
    }

    const avatarText = player.avatar?.text || player.flag || ':-)';
    const avatarColor = player.avatar?.color || '#ffb000';

    // Create inspection menu
    const menu = document.createElement('div');
    menu.className = 'player-inspect-menu';
    menu.innerHTML = `
      <div class="npc-menu-overlay"></div>
      <div class="npc-menu-content">
        <div class="npc-menu-header">
          <span class="npc-menu-icon" style="color: ${avatarColor}">${avatarText}</span>
          <div class="npc-menu-info">
            <h3>${player.username}</h3>
            <span class="npc-menu-title">Player</span>
          </div>
        </div>
        <div class="npc-stats">
          <div class="npc-stat">
            <span class="stat-icon">🎮</span>
            <span class="stat-value">Online</span>
          </div>
          <div class="npc-stat">
            <span class="stat-icon">📍</span>
            <span class="stat-value">${player.position ? `${player.position.lat.toFixed(4)}, ${player.position.lng.toFixed(4)}` : 'Unknown'}</span>
          </div>
          ${equipDisplay.length > 0 ? `
          <div class="npc-stat equipment-display">
            <span class="stat-icon">🛡️</span>
            <span class="stat-value">${equipDisplay.join(' ')}</span>
          </div>
          ` : ''}
        </div>
        <div class="npc-menu-options">
          <button class="npc-menu-btn" data-action="center">
            <span class="btn-icon">📍</span>
            <span class="btn-text">Go To</span>
          </button>
          ${this.selectedCombatItem ? `
          <button class="npc-menu-btn battle-btn" data-action="attack">
            <span class="btn-icon">⚔️</span>
            <span class="btn-text">Attack</span>
          </button>
          ` : ''}
        </div>
        <button class="npc-menu-close">✕</button>
      </div>
    `;

    document.body.appendChild(menu);
    this.activePlayerInspect = { element: menu, player };

    // Event handlers
    menu.querySelector('.npc-menu-overlay')?.addEventListener('click', () => this.closePlayerInspect());
    menu.querySelector('.npc-menu-close')?.addEventListener('click', () => this.closePlayerInspect());

    menu.querySelectorAll('.npc-menu-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        this.closePlayerInspect();

        switch (action) {
          case 'center':
            if (this.map3d && player.position) {
              this.map3d.centerOn(player.position.lat, player.position.lng);
            }
            break;
          case 'attack':
            if (window.game) {
              window.game.attackPlayer(player.id);
            }
            break;
        }
      });
    });
  }

  // Close player inspection menu
  closePlayerInspect() {
    if (this.activePlayerInspect && this.activePlayerInspect.element) {
      this.activePlayerInspect.element.remove();
    }
    this.activePlayerInspect = null;
  }

  // Show NPC detailed inspection
  showNPCInspect(npcId) {
    const npc = this.npcs.find(n => n.id === npcId);
    if (!npc) return;

    // Calculate difficulty based on damage and health
    let difficulty = 'Easy';
    let difficultyColor = '#88ff88';
    if (npc.isTraining) {
      difficulty = 'Very Easy (Training)';
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
        difficulty = 'Very Hard (Boss)';
        difficultyColor = '#ff4444';
      } else if (npc.damage >= 75) {
        difficulty = 'Hard (Boss)';
        difficultyColor = '#ff8844';
      } else {
        difficulty = 'Medium (Boss)';
        difficultyColor = '#ffcc00';
      }
    }

    // Build drops display
    let dropsHtml = 'None';
    if (npc.drops && npc.drops.length > 0) {
      dropsHtml = npc.drops.map(d => {
        const item = this.itemTypes[d];
        return item ? `<span class="drop-item" title="${item.name}">${item.icon} ${item.name}</span>` : d;
      }).join(', ');
      dropsHtml += ` <span style="color:#888">(${Math.round((npc.dropChance || 0) * 100)}% chance)</span>`;
    }

    // Build attack items display
    const attacksHtml = npc.attackItems.map(a => {
      const item = this.itemTypes[a];
      return item ? `${item.icon}` : a;
    }).join(' ');

    // Show detailed stats in chat log
    if (window.chatManager) {
      window.chatManager.addLogMessage(`━━━ ${npc.icon} ${npc.name} ━━━`, 'system');
      window.chatManager.addLogMessage(`📜 ${npc.title}`, 'system');
      window.chatManager.addLogMessage(`❤️ Health: ${npc.health}/${npc.maxHealth}`, 'system');
      window.chatManager.addLogMessage(`⚔️ Max Damage: ${npc.damage}`, 'system');
      window.chatManager.addLogMessage(`🎯 Attacks: ${attacksHtml}`, 'system');
      window.chatManager.addLogMessage(`📍 Location: ${npc.baseCity}`, 'system');
      window.chatManager.addLogMessage(`⚠️ Difficulty: ${difficulty}`, 'system');
      if (npc.drops && npc.drops.length > 0) {
        window.chatManager.addLogMessage(`🎁 Drops: ${dropsHtml}`, 'system');
      }
      if (npc.sellsEquipment) {
        const sellItem = this.equipmentTypes[npc.sellsEquipment];
        if (sellItem) {
          window.chatManager.addLogMessage(`💰 Sells: ${sellItem.icon} ${sellItem.name}`, 'system');
        }
      }
      window.chatManager.addLogMessage(`━━━━━━━━━━━━━━━━`, 'system');
    }
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

  // Player attacks NPC with visual effects
  playerAttackNPC(npcId) {
    const npc = this.npcs.find(n => n.id === npcId);
    if (!npc) return;

    // Check if we have the item
    const slotIndex = this.inventorySlots.findIndex(
      s => s && s.itemKey === this.selectedCombatItem && s.count > 0
    );

    if (slotIndex === -1) {
      if (window.chatManager) {
        window.chatManager.addLogMessage('⚔️ No ammo left!', 'error');
      }
      this.endNPCCombat();
      return;
    }

    // Consume one item
    this.inventorySlots[slotIndex].count--;
    if (this.inventorySlots[slotIndex].count <= 0) {
      this.inventorySlots[slotIndex] = null;
    }

    // Roll damage (0 to max hit) with accuracy check
    const combatResult = this.rollCombatDamage(this.selectedCombatItem);
    const damage = combatResult.damage;
    npc.health -= damage;

    const item = this.itemTypes[this.selectedCombatItem];
    const accuracy = this.getAccuracy(this.selectedCombatItem);

    // Award HP XP for attacking (XP = damage dealt / 4, min 1 even on miss for effort)
    // HP XP scales with damage dealt (damage * 4 for faster leveling)
    const hpXP = combatResult.hit ? Math.max(5, damage * 4) : 2;
    this.addHPXP(hpXP);

    // Show attack particle effect
    if (this.map3d) {
      if (combatResult.hit) {
        this.map3d.showCombatEffect('player_attack', npcId, item?.icon || '⚔️', damage);
      } else {
        this.map3d.showCombatEffect('player_miss', npcId, '💨', 0);
      }
      this.map3d.updateNPCHealth(npcId, Math.max(0, npc.health), npc.maxHealth);
    }

    if (window.chatManager) {
      if (combatResult.hit) {
        window.chatManager.addLogMessage(`⚔️ You hit ${npc.name} with ${item?.icon || '⚔️'} for ${damage} damage! (max: ${combatResult.maxHit})`, 'combat');
      } else {
        window.chatManager.addLogMessage(`💨 You miss ${npc.name}! (${Math.round(accuracy)}% accuracy)`, 'combat');
      }
    }

    // Update combat HUD
    this.updateCombatHUD(npcId);

    this.save();
    this.renderCombat();

    // Check if NPC defeated
    if (npc.health <= 0) {
      this.defeatNPC(npcId);
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

    const damage = npc.damage;
    this.combatHealth -= damage;

    // Show attack particle effect
    if (this.map3d) {
      this.map3d.showCombatEffect('npc_attack', npcId, attackItem?.icon || '💀', damage);
    }

    if (window.chatManager) {
      window.chatManager.addLogMessage(`💥 ${npc.name} hits you with ${attackItem?.icon || '💀'} for ${damage} damage!`, 'combat');
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

    // Check for item drops (battle NPCs only)
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
            window.chatManager.addLogMessage(`🎁 ${npc.name} dropped: ${droppedItem.icon} ${droppedItem.name}!`, 'item');
          }
        }
      } else {
        // No drop this time
        if (window.chatManager) {
          window.chatManager.addLogMessage(`${npc.name} didn't drop anything this time.`, 'system');
        }
      }
    }

    // Respawn NPC after delay (NPCs respawn)
    // Battle NPCs respawn faster than bosses
    const respawnTime = npc.isBattleOnly ? 15000 : 30000; // 15s for battle, 30s for bosses
    setTimeout(() => {
      npc.health = npc.maxHealth;
      if (this.map3d) {
        this.map3d.updateNPCHealth(npcId, npc.health, npc.maxHealth);
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

  // Get items available for combat (only gathered items, not equipment)
  getCombatItems() {
    const items = [];
    for (const slot of this.inventorySlots) {
      if (slot && slot.count > 0) {
        // Only include gathered items (those in itemTypes, not equipmentTypes)
        const isGatheredItem = this.itemTypes[slot.itemKey] && !this.itemTypes[slot.itemKey].isCurrency;
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
  // Base accuracy: 50% + (skill level * 0.5) + item accuracy bonus
  // Capped at 95% to always have some miss chance
  getAccuracy(itemKey) {
    const level = this.getCombatLevel(itemKey);
    const item = this.itemTypes[itemKey];
    const accuracyBonus = item?.accuracyBonus || 0;

    // Base 50% + 0.5% per level + item bonus
    const accuracy = 50 + (level * 0.5) + accuracyBonus;

    // Cap at 95%
    return Math.min(95, accuracy);
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

    // Reset health
    this.combatHealth = this.maxCombatHealth;

    // Respawn at home or default location
    setTimeout(() => {
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

      this.renderCombat();
    }, 1500);
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

    if (Math.random() < dropChance) {
      this.dropItemOnGround(itemKey);
    }
  }

  // Drop an item on the ground near the player
  dropItemOnGround(itemKey) {
    if (!this.playerPosition || !this.map3d) return;

    const item = this.itemTypes[itemKey];
    if (!item) return;

    // Random position near player
    const angle = Math.random() * Math.PI * 2;
    const distance = this.dropConfig.dropRadius * (0.5 + Math.random() * 0.5);

    const dropPosition = {
      lat: this.playerPosition.lat + Math.cos(angle) * distance,
      lng: this.playerPosition.lng + Math.sin(angle) * distance
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
    if (window.chatManager) {
      window.chatManager.addLogMessage(`${item.icon} ${item.name} dropped nearby!`, 'item');
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
  getDistance(pos1, pos2) {
    const latDiff = pos1.lat - pos2.lat;
    const lngDiff = pos1.lng - pos2.lng;
    return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
  }

  // Update player position (called from map.js)
  setPlayerPosition(position) {
    this.playerPosition = position;
  }

  // Set map3d reference (called from map.js)
  setMap3D(map3d) {
    this.map3d = map3d;
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
