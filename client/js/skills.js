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
      sunstone: { name: 'Sunstone', weather: 'clear', icon: '🌟', rarity: 'uncommon' },
      cloudwisp: { name: 'Cloud Wisp', weather: 'cloudy', icon: '💨', rarity: 'common' },
      mistessence: { name: 'Mist Essence', weather: 'fog', icon: '🫧', rarity: 'rare' },
      raindrop: { name: 'Raindrop Crystal', weather: 'rain', icon: '💧', rarity: 'common' },
      snowflake: { name: 'Eternal Snowflake', weather: 'snow', icon: '❆', rarity: 'uncommon' },
      lightningshard: { name: 'Lightning Shard', weather: 'storm', icon: '⚡', rarity: 'rare' }
    };

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
        </div>
      </div>
      <div id="home-content" class="home-content hidden"></div>
      <div id="skills-content" class="skills-content"></div>
      <div id="inventory-content" class="inventory-content hidden"></div>
      <div id="combat-content" class="combat-content hidden"></div>
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
      maxCombatHealth: this.maxCombatHealth
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
