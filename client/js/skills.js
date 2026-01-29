// Skills & Inventory System
class SkillsManager {
  constructor() {
    // User ID for per-account storage
    this.userId = null;

    // Skills - one for each weather type
    this.skills = {
      sunbathing: { name: 'Sunbathing', weather: 'clear', xp: 0, icon: '☀️' },
      cloudgazing: { name: 'Cloud Gazing', weather: 'cloudy', xp: 0, icon: '☁️' },
      mistwalking: { name: 'Mist Walking', weather: 'fog', xp: 0, icon: '🌫️' },
      raindancing: { name: 'Rain Dancing', weather: 'rain', xp: 0, icon: '🌧️' },
      snowdrifting: { name: 'Snow Drifting', weather: 'snow', xp: 0, icon: '❄️' },
      stormchasing: { name: 'Storm Chasing', weather: 'storm', xp: 0, icon: '⛈️' }
    };

    // Items that can be collected
    this.itemTypes = {
      sunstone: { name: 'Sunstone', weather: 'clear', icon: '🌟', rarity: 'uncommon', sellValue: 2 },
      cloudwisp: { name: 'Cloud Wisp', weather: 'cloudy', icon: '💨', rarity: 'common', sellValue: 1 },
      mistessence: { name: 'Mist Essence', weather: 'fog', icon: '🫧', rarity: 'rare', sellValue: 5 },
      raindrop: { name: 'Raindrop Crystal', weather: 'rain', icon: '💧', rarity: 'common', sellValue: 1 },
      snowflake: { name: 'Eternal Snowflake', weather: 'snow', icon: '❆', rarity: 'uncommon', sellValue: 2 },
      lightningshard: { name: 'Lightning Shard', weather: 'storm', icon: '⚡', rarity: 'rare', sellValue: 5 },
      // Currency
      light: { name: 'Light', icon: '✨', rarity: 'legendary', isCurrency: true }
    };

    // Cosmetic items (purchasable with Light)
    this.cosmeticTypes = {
      // Skins (change base body appearance)
      skin_snowball: { name: 'Snowball', type: 'skin', icon: '⚪', color: '#ffffff', price: 50, particle: 'snow' },
      skin_lightning: { name: 'Lightning Ball', type: 'skin', icon: '⚡', color: '#ffff00', price: 75, particle: 'spark' },
      skin_flame: { name: 'Flame Spirit', type: 'skin', icon: '🔥', color: '#ff4400', price: 75, particle: 'fire' },
      skin_void: { name: 'Void Walker', type: 'skin', icon: '🌑', color: '#330066', price: 100, particle: 'void' },
      // Hats (head-worn items)
      hat_ice_tiara: { name: 'Ice Tiara', type: 'hat', icon: '👑', color: '#88ddff', price: 30 },
      hat_storm_crown: { name: 'Storm Crown', type: 'hat', icon: '⚜️', color: '#9966ff', price: 40 },
      hat_sun_halo: { name: 'Sun Halo', type: 'hat', icon: '☀️', color: '#ffcc00', price: 35 },
      hat_mist_hood: { name: 'Mist Hood', type: 'hat', icon: '🎭', color: '#aabbcc', price: 25 },
      // Held items (objects held by character)
      held_lightning_bolt: { name: 'Lightning Bolt', type: 'held', icon: '🗡️', color: '#ffff00', price: 45 },
      held_frost_staff: { name: 'Frost Staff', type: 'held', icon: '🪄', color: '#88ddff', price: 40 },
      held_sun_orb: { name: 'Sun Orb', type: 'held', icon: '🔮', color: '#ffaa00', price: 35 },
      held_void_blade: { name: 'Void Blade', type: 'held', icon: '⚔️', color: '#660099', price: 60 },
      // Auras (particle effects around character)
      aura_frost: { name: 'Frost Aura', type: 'aura', icon: '❄️', color: '#88ddff', price: 80, particle: 'frost' },
      aura_fire: { name: 'Fire Aura', type: 'aura', icon: '🔥', color: '#ff4400', price: 80, particle: 'fire' },
      aura_lightning: { name: 'Lightning Aura', type: 'aura', icon: '⚡', color: '#ffff00', price: 100, particle: 'lightning' },
      aura_void: { name: 'Void Aura', type: 'aura', icon: '🌀', color: '#660099', price: 120, particle: 'void' },
      aura_holy: { name: 'Holy Aura', type: 'aura', icon: '✨', color: '#ffffaa', price: 150, particle: 'holy' }
    };

    // Equipped cosmetics
    this.equippedCosmetics = {
      skin: null,
      hat: null,
      held: null,
      aura: null
    };

    // Owned cosmetics (array of cosmetic keys)
    this.ownedCosmetics = [];

    // Light currency balance
    this.lightBalance = 0;

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
    this.combatHealth = 100;
    this.maxCombatHealth = 100;
    this.inCombat = false;
    this.combatTarget = null;

    // NPC Merchants (Legendary Bosses)
    this.npcs = [];
    this.npcData = this.createNPCData();
    this.activeNPCDialog = null;
    this.npcCombatTarget = null;

    // Don't load here - wait for setUserId to be called with user's ID
  }

  // Create NPC merchant data
  createNPCData() {
    return [
      {
        id: 'npc_frost_merchant',
        name: 'Frost Merchant',
        title: 'Keeper of Ice',
        cosmetic: 'skin_snowball',
        sellsCosmetic: 'aura_frost',
        baseCity: 'Sydney', // Near Sydney
        offsetLat: 0.027, // ~3000m offset
        offsetLng: 0,
        health: 5000,
        maxHealth: 5000,
        damage: 50,
        attackItem: 'snowflake',
        color: '#88ddff',
        particle: 'frost',
        aura: 'aura_frost'
      },
      {
        id: 'npc_storm_merchant',
        name: 'Storm Merchant',
        title: 'Herald of Thunder',
        cosmetic: 'skin_lightning',
        sellsCosmetic: 'aura_lightning',
        baseCity: 'Tokyo',
        offsetLat: 0,
        offsetLng: 0.033,
        health: 6000,
        maxHealth: 6000,
        damage: 65,
        attackItem: 'lightningshard',
        color: '#ffff00',
        particle: 'lightning',
        aura: 'aura_lightning'
      },
      {
        id: 'npc_void_merchant',
        name: 'Void Merchant',
        title: 'Shadow Walker',
        cosmetic: 'skin_void',
        sellsCosmetic: 'aura_void',
        baseCity: 'London',
        offsetLat: -0.027,
        offsetLng: 0,
        health: 7500,
        maxHealth: 7500,
        damage: 80,
        attackItem: 'mistessence',
        color: '#660099',
        particle: 'void',
        aura: 'aura_void'
      },
      {
        id: 'npc_holy_merchant',
        name: 'Holy Merchant',
        title: 'Light Bringer',
        cosmetic: 'skin_flame',
        sellsCosmetic: 'aura_holy',
        baseCity: 'New York',
        offsetLat: 0,
        offsetLng: -0.033,
        health: 10000,
        maxHealth: 10000,
        damage: 100,
        attackItem: 'lightningshard',
        color: '#ffffaa',
        particle: 'holy',
        aura: 'aura_holy'
      }
    ];
  }

  // Get NPC position based on city
  getNPCPosition(npc) {
    const city = MAJOR_CITIES.find(c => c.name === npc.baseCity);
    if (!city) return null;
    return {
      lat: city.lat + npc.offsetLat,
      lng: city.lng + npc.offsetLng
    };
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

  // Initialize UI
  init() {
    this.createPanel();
    this.createTooltip();
    this.updateUI();

    // Start dropped item check interval
    this.droppedItemCheckInterval = setInterval(() => {
      this.updateDroppedItems();
    }, 1000);

    return this;
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
          <button class="skills-tab" data-tab="cosmetics" title="Cosmetics">💎</button>
        </div>
      </div>
      <div id="home-content" class="home-content hidden"></div>
      <div id="skills-content" class="skills-content"></div>
      <div id="inventory-content" class="inventory-content hidden"></div>
      <div id="combat-content" class="combat-content hidden"></div>
      <div id="cosmetics-content" class="cosmetics-content hidden"></div>
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
    document.getElementById('cosmetics-content').classList.toggle('hidden', tabName !== 'cosmetics');

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
    } else if (this.activeTab === 'cosmetics') {
      this.renderCosmetics();
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

    let html = '<div class="inventory-grid">';

    for (let i = 0; i < 24; i++) {
      const slot = this.inventorySlots[i];
      const hasItem = slot && slot.count > 0;
      const item = hasItem ? this.itemTypes[slot.itemKey] : null;

      html += `
        <div class="inventory-slot ${hasItem ? 'has-item' : ''}"
             data-slot="${i}"
             ${hasItem ? `title="${item.name}"` : ''}
             draggable="${hasItem}">
          ${hasItem ? `<span class="item-icon">${item.icon}</span>` : ''}
          ${hasItem ? `<span class="item-count">${slot.count}</span>` : ''}
        </div>
      `;
    }

    html += '</div>';
    container.innerHTML = html;

    // Set up drag and drop
    this.setupDragAndDrop();
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

  // Render combat tab
  renderCombat() {
    const container = document.getElementById('combat-content');
    if (!container) return;

    // Get items that can be used for combat
    const combatItems = this.getCombatItems();

    let itemsHtml = '';
    if (combatItems.length === 0) {
      itemsHtml = '<p class="no-items">No items available for combat. Collect items first!</p>';
    } else {
      itemsHtml = '<div class="combat-items">';
      for (const item of combatItems) {
        const isSelected = this.selectedCombatItem === item.itemKey;
        const itemType = this.itemTypes[item.itemKey];
        const level = this.getCombatLevel(item.itemKey);
        itemsHtml += `
          <div class="combat-item ${isSelected ? 'selected' : ''}"
               data-item="${item.itemKey}"
               title="${itemType.name} - Level ${level}">
            <span class="item-icon">${itemType.icon}</span>
            <span class="item-count">x${item.count}</span>
            <span class="item-level">Lv${level}</span>
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
          <h4>⚔️ Select Weapon</h4>
          ${itemsHtml}
        </div>

        ${this.selectedCombatItem ? `
          <div class="combat-info">
            <p>Click on a player to attack!</p>
            <p class="combat-stats">
              Damage: ${this.getCombatDamage(this.selectedCombatItem)}<br>
              Uses 1 ${this.itemTypes[this.selectedCombatItem].name} per attack
            </p>
          </div>
        ` : '<div class="combat-info"><p>Select an item to use as a weapon.</p></div>'}
      </div>
    `;

    // Combat item selection
    container.querySelectorAll('.combat-item').forEach(el => {
      el.addEventListener('click', () => {
        const itemKey = el.dataset.item;
        this.selectCombatItem(itemKey);
      });
    });
  }

  // Render cosmetics tab
  renderCosmetics() {
    const container = document.getElementById('cosmetics-content');
    if (!container) return;

    // Equipment slots HTML
    const slotTypes = ['skin', 'hat', 'held', 'aura'];
    const slotNames = { skin: 'Skin', hat: 'Hat', held: 'Held', aura: 'Aura' };
    const slotIcons = { skin: '👤', hat: '👑', held: '🗡️', aura: '✨' };

    let slotsHtml = '<div class="cosmetic-slots">';
    for (const slotType of slotTypes) {
      const equipped = this.equippedCosmetics[slotType];
      const cosmetic = equipped ? this.cosmeticTypes[equipped] : null;
      slotsHtml += `
        <div class="cosmetic-slot ${equipped ? 'equipped' : ''}" data-slot="${slotType}">
          <span class="slot-icon">${cosmetic ? cosmetic.icon : slotIcons[slotType]}</span>
          <span class="slot-name">${slotNames[slotType]}</span>
          ${equipped ? `<span class="slot-item">${cosmetic.name}</span>` : ''}
        </div>
      `;
    }
    slotsHtml += '</div>';

    // Owned cosmetics HTML
    let ownedHtml = '<div class="owned-cosmetics">';
    if (this.ownedCosmetics.length === 0) {
      ownedHtml += '<p class="no-items">No cosmetics owned. Trade with Legendary Merchants!</p>';
    } else {
      for (const cosmeticKey of this.ownedCosmetics) {
        const cosmetic = this.cosmeticTypes[cosmeticKey];
        if (!cosmetic) continue;
        const isEquipped = this.equippedCosmetics[cosmetic.type] === cosmeticKey;
        ownedHtml += `
          <div class="owned-cosmetic ${isEquipped ? 'equipped' : ''}"
               data-cosmetic="${cosmeticKey}"
               title="${cosmetic.name}">
            <span class="cosmetic-icon" style="color: ${cosmetic.color}">${cosmetic.icon}</span>
            <span class="cosmetic-name">${cosmetic.name}</span>
            ${isEquipped ? '<span class="equipped-badge">E</span>' : ''}
          </div>
        `;
      }
    }
    ownedHtml += '</div>';

    // Trade section - sell items for Light
    const sellableItems = this.getSellableItems();
    let tradeHtml = '<div class="trade-section">';
    tradeHtml += '<h4>💱 Trade Items for Light</h4>';
    if (sellableItems.length === 0) {
      tradeHtml += '<p class="no-items">No items to trade.</p>';
    } else {
      tradeHtml += '<div class="trade-items">';
      for (const item of sellableItems) {
        const itemType = this.itemTypes[item.itemKey];
        tradeHtml += `
          <div class="trade-item" data-item="${item.itemKey}" title="Sell for ${itemType.sellValue} Light each">
            <span class="item-icon">${itemType.icon}</span>
            <span class="item-count">x${item.count}</span>
            <span class="item-value">+${itemType.sellValue}✨</span>
          </div>
        `;
      }
      tradeHtml += '</div>';
      tradeHtml += `<button class="osrs-btn small-btn" id="sell-all-btn">Sell All Items</button>`;
    }
    tradeHtml += '</div>';

    container.innerHTML = `
      <div class="cosmetics-panel">
        <div class="light-balance">
          <span class="light-icon">✨</span>
          <span class="light-amount">${this.lightBalance}</span>
          <span class="light-label">Light</span>
        </div>

        <div class="cosmetics-section">
          <h4>🎨 Equipment</h4>
          ${slotsHtml}
        </div>

        <div class="cosmetics-section">
          <h4>📦 Owned Cosmetics</h4>
          ${ownedHtml}
        </div>

        ${tradeHtml}
      </div>
    `;

    // Click handlers for equipping cosmetics
    container.querySelectorAll('.owned-cosmetic').forEach(el => {
      el.addEventListener('click', () => {
        const cosmeticKey = el.dataset.cosmetic;
        this.toggleCosmetic(cosmeticKey);
      });
    });

    // Click handlers for selling items
    container.querySelectorAll('.trade-item').forEach(el => {
      el.addEventListener('click', () => {
        const itemKey = el.dataset.item;
        this.sellItem(itemKey, 1);
      });
    });

    // Sell all button
    document.getElementById('sell-all-btn')?.addEventListener('click', () => {
      this.sellAllItems();
    });
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
      this.renderCosmetics();

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
    this.renderCosmetics();

    if (window.chatManager) {
      window.chatManager.addLogMessage(`💱 Sold ${totalItems} items for ${totalLight}✨ Light!`, 'item');
    }
  }

  // Toggle equip/unequip cosmetic
  toggleCosmetic(cosmeticKey) {
    const cosmetic = this.cosmeticTypes[cosmeticKey];
    if (!cosmetic) return;

    if (this.equippedCosmetics[cosmetic.type] === cosmeticKey) {
      // Unequip
      this.equippedCosmetics[cosmetic.type] = null;
      if (window.chatManager) {
        window.chatManager.addLogMessage(`🎨 Unequipped ${cosmetic.icon} ${cosmetic.name}`, 'info');
      }
    } else {
      // Equip
      this.equippedCosmetics[cosmetic.type] = cosmeticKey;
      if (window.chatManager) {
        window.chatManager.addLogMessage(`🎨 Equipped ${cosmetic.icon} ${cosmetic.name}`, 'info');
      }
    }

    // Update player visual
    this.updatePlayerCosmetics();
    this.save();
    this.renderCosmetics();
  }

  // Update player's visual appearance based on equipped cosmetics
  updatePlayerCosmetics() {
    if (!this.map3d || !window.playerManager) return;

    const selfId = window.playerManager.selfSocketId;
    if (!selfId) return;

    // Get equipped cosmetic data
    const cosmeticsData = {
      skin: this.equippedCosmetics.skin ? this.cosmeticTypes[this.equippedCosmetics.skin] : null,
      hat: this.equippedCosmetics.hat ? this.cosmeticTypes[this.equippedCosmetics.hat] : null,
      held: this.equippedCosmetics.held ? this.cosmeticTypes[this.equippedCosmetics.held] : null,
      aura: this.equippedCosmetics.aura ? this.cosmeticTypes[this.equippedCosmetics.aura] : null
    };

    // Update 3D appearance
    this.map3d.updatePlayerCosmetics(selfId, cosmeticsData);
  }

  // Buy a cosmetic from an NPC
  buyCosmetic(cosmeticKey, npcId) {
    const cosmetic = this.cosmeticTypes[cosmeticKey];
    if (!cosmetic) return false;

    // Check if already owned
    if (this.ownedCosmetics.includes(cosmeticKey)) {
      if (window.chatManager) {
        window.chatManager.addLogMessage(`❌ You already own ${cosmetic.icon} ${cosmetic.name}!`, 'error');
      }
      return false;
    }

    // Check if in combat
    if (this.inCombat) {
      if (window.chatManager) {
        window.chatManager.addLogMessage(`❌ Cannot trade while in combat!`, 'error');
      }
      return false;
    }

    // Check Light balance
    if (this.lightBalance < cosmetic.price) {
      if (window.chatManager) {
        window.chatManager.addLogMessage(`❌ Not enough Light! Need ${cosmetic.price}✨`, 'error');
      }
      return false;
    }

    // Purchase
    this.lightBalance -= cosmetic.price;
    this.ownedCosmetics.push(cosmeticKey);
    this.save();
    this.renderCosmetics();

    if (window.chatManager) {
      window.chatManager.addLogMessage(`🎉 Purchased ${cosmetic.icon} ${cosmetic.name} for ${cosmetic.price}✨ Light!`, 'levelup');
    }

    return true;
  }

  // Initialize NPCs in the 3D world
  initNPCs() {
    if (!this.map3d) return;

    // Create each NPC at their position
    for (const npc of this.npcData) {
      const position = this.getNPCPosition(npc);
      if (position) {
        this.map3d.createNPC(npc, position);
        this.npcs.push({ ...npc, position });
      }
    }

    console.log(`Initialized ${this.npcs.length} Legendary Merchant NPCs`);
  }

  // Show NPC dialog
  showNPCDialog(npcId) {
    // Find the NPC
    const npc = this.npcs.find(n => n.id === npcId);
    if (!npc) return;

    // Check if already in dialog
    if (this.activeNPCDialog) {
      this.closeNPCDialog();
    }

    const cosmetic = this.cosmeticTypes[npc.sellsCosmetic];
    const alreadyOwned = this.ownedCosmetics.includes(npc.sellsCosmetic);
    const canAfford = this.lightBalance >= cosmetic.price;

    // Create dialog HTML
    const dialog = document.createElement('div');
    dialog.className = 'npc-dialog';
    dialog.innerHTML = `
      <div class="npc-dialog-header">
        <div class="npc-portrait" style="color: ${npc.color}">${this.cosmeticTypes[npc.cosmetic]?.icon || '👤'}</div>
        <div class="npc-info">
          <h3>${npc.name}</h3>
          <span class="npc-title">${npc.title}</span>
        </div>
      </div>
      <div class="npc-dialog-content">
        <p>"Greetings, traveler. I am ${npc.name}, ${npc.title}. I possess a rare artifact that might interest you..."</p>

        <div class="npc-shop-item">
          <span class="shop-icon" style="color: ${cosmetic.color}">${cosmetic.icon}</span>
          <div class="shop-details">
            <span class="shop-name">${cosmetic.name}</span>
            <span class="shop-type">${cosmetic.type.toUpperCase()}</span>
          </div>
          <span class="shop-price">${cosmetic.price}✨</span>
        </div>

        ${alreadyOwned ? '<p style="color: #4CAF50;">✓ You already own this cosmetic!</p>' : ''}
        ${!canAfford && !alreadyOwned ? `<p style="color: #ff6666;">You need ${cosmetic.price - this.lightBalance} more Light.</p>` : ''}

        <p style="color: #ff6666; margin-top: 10px;">"...Or you may challenge me in combat. But be warned, I am no ordinary foe."</p>
      </div>
      <div class="npc-dialog-actions">
        <button class="osrs-btn npc-buy-btn" id="npc-buy-btn" ${alreadyOwned || !canAfford ? 'disabled' : ''}>
          ${alreadyOwned ? 'Owned' : `Buy (${cosmetic.price}✨)`}
        </button>
        <button class="osrs-btn npc-fight-btn" id="npc-fight-btn">Fight</button>
        <button class="osrs-btn" id="npc-close-btn">Leave</button>
      </div>
    `;

    document.body.appendChild(dialog);
    this.activeNPCDialog = { element: dialog, npc };

    // Event handlers
    dialog.querySelector('#npc-buy-btn')?.addEventListener('click', () => {
      if (this.buyCosmetic(npc.sellsCosmetic, npcId)) {
        this.closeNPCDialog();
      }
    });

    dialog.querySelector('#npc-fight-btn')?.addEventListener('click', () => {
      this.startNPCCombat(npcId);
      this.closeNPCDialog();
    });

    dialog.querySelector('#npc-close-btn')?.addEventListener('click', () => {
      this.closeNPCDialog();
    });
  }

  // Close NPC dialog
  closeNPCDialog() {
    if (this.activeNPCDialog && this.activeNPCDialog.element) {
      this.activeNPCDialog.element.remove();
    }
    this.activeNPCDialog = null;
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

    // Reset NPC health for new fight
    npc.health = npc.maxHealth;
    if (this.map3d) {
      this.map3d.updateNPCHealth(npcId, npc.health, npc.maxHealth);
    }

    if (window.chatManager) {
      window.chatManager.addLogMessage(`⚔️ Combat started with ${npc.name}!`, 'combat');
    }

    // Start combat loop
    this.npcCombatLoop(npcId);
  }

  // NPC combat loop
  npcCombatLoop(npcId) {
    if (!this.inCombat || this.npcCombatTarget !== npcId) return;

    const npc = this.npcs.find(n => n.id === npcId);
    if (!npc) {
      this.endNPCCombat();
      return;
    }

    // Player attacks NPC
    if (this.attackNPC(npcId)) {
      // NPC is still alive, NPC attacks back after delay
      setTimeout(() => {
        if (this.inCombat && this.npcCombatTarget === npcId) {
          this.npcAttacksPlayer(npcId);

          // Continue combat if both alive
          if (this.inCombat && this.combatHealth > 0 && npc.health > 0) {
            setTimeout(() => this.npcCombatLoop(npcId), 1500);
          }
        }
      }, 1000);
    }
  }

  // Player attacks NPC
  attackNPC(npcId) {
    const npc = this.npcs.find(n => n.id === npcId);
    if (!npc) return false;

    // Check if we have the item
    const slotIndex = this.inventorySlots.findIndex(
      s => s && s.itemKey === this.selectedCombatItem && s.count > 0
    );

    if (slotIndex === -1) {
      if (window.chatManager) {
        window.chatManager.addLogMessage('⚔️ No ammo left!', 'error');
      }
      this.endNPCCombat();
      return false;
    }

    // Consume one item
    this.inventorySlots[slotIndex].count--;
    if (this.inventorySlots[slotIndex].count <= 0) {
      this.inventorySlots[slotIndex] = null;
    }

    // Calculate damage
    const damage = this.getCombatDamage(this.selectedCombatItem);
    npc.health -= damage;

    if (window.chatManager) {
      const item = this.itemTypes[this.selectedCombatItem];
      window.chatManager.addLogMessage(`⚔️ You hit ${npc.name} for ${damage} damage!`, 'combat');
    }

    // Update NPC health bar
    if (this.map3d) {
      this.map3d.updateNPCHealth(npcId, Math.max(0, npc.health), npc.maxHealth);
    }

    this.save();
    this.renderCombat();

    // Check if NPC defeated
    if (npc.health <= 0) {
      this.defeatNPC(npcId);
      return false;
    }

    return true;
  }

  // NPC attacks the player
  npcAttacksPlayer(npcId) {
    const npc = this.npcs.find(n => n.id === npcId);
    if (!npc) return;

    const damage = npc.damage;
    this.combatHealth -= damage;

    if (window.chatManager) {
      const attackItem = this.itemTypes[npc.attackItem];
      window.chatManager.addLogMessage(`💥 ${npc.name} hits you with ${attackItem?.icon || '💀'} for ${damage} damage!`, 'combat');
    }

    this.renderCombat();

    // Check if player defeated
    if (this.combatHealth <= 0) {
      this.combatHealth = 0;
      this.endNPCCombat();
      this.die();
    }
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

    // Respawn NPC after delay (NPCs respawn)
    setTimeout(() => {
      npc.health = npc.maxHealth;
      if (this.map3d) {
        this.map3d.updateNPCHealth(npcId, npc.health, npc.maxHealth);
      }
    }, 30000); // 30 seconds respawn

    this.endNPCCombat();
    this.save();
    this.renderCosmetics();
  }

  // End NPC combat
  endNPCCombat() {
    this.inCombat = false;
    this.npcCombatTarget = null;
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

  // Get items available for combat (from inventory)
  getCombatItems() {
    const items = [];
    for (const slot of this.inventorySlots) {
      if (slot && slot.count > 0) {
        // Check if already in list
        const existing = items.find(i => i.itemKey === slot.itemKey);
        if (existing) {
          existing.count += slot.count;
        } else {
          items.push({ itemKey: slot.itemKey, count: slot.count });
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

  // Get damage for an item
  getCombatDamage(itemKey) {
    const level = this.getCombatLevel(itemKey);
    const item = this.itemTypes[itemKey];

    // Base damage + level bonus + rarity bonus
    let baseDamage = 5;
    switch (item?.rarity) {
      case 'common': baseDamage = 5; break;
      case 'uncommon': baseDamage = 8; break;
      case 'rare': baseDamage = 12; break;
    }

    return baseDamage + Math.floor(level / 2);
  }

  // Select combat item
  selectCombatItem(itemKey) {
    this.selectedCombatItem = itemKey;

    // Update max health based on combat level
    this.maxCombatHealth = this.getCombatLevel(itemKey) * 10;
    if (this.combatHealth > this.maxCombatHealth) {
      this.combatHealth = this.maxCombatHealth;
    }

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
      // Cosmetics data
      equippedCosmetics: this.equippedCosmetics,
      ownedCosmetics: this.ownedCosmetics,
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
      if (data.maxCombatHealth) {
        this.maxCombatHealth = data.maxCombatHealth;
      }
      if (data.combatHealth !== undefined) {
        this.combatHealth = data.combatHealth;
      } else {
        this.combatHealth = this.maxCombatHealth;
      }

      // Load cosmetics data
      if (data.equippedCosmetics) {
        this.equippedCosmetics = { ...this.equippedCosmetics, ...data.equippedCosmetics };
      }
      if (data.ownedCosmetics) {
        this.ownedCosmetics = data.ownedCosmetics;
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
