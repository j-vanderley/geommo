// Skills & Inventory System
class SkillsManager {
  constructor() {
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

    // Inventory (item counts)
    this.inventory = {};
    for (const key in this.itemTypes) {
      this.inventory[key] = 0;
    }

    // XP table (OSRS-style exponential)
    this.xpTable = this.generateXPTable(99);

    // Timers
    this.xpInterval = null;
    this.itemCheckInterval = null;
    this.currentWeather = 'clear';

    // UI elements
    this.panel = null;
    this.activeTab = 'skills';

    // Load saved data
    this.load();
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
    this.updateUI();
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
          <button class="skills-tab active" data-tab="skills">Skills</button>
          <button class="skills-tab" data-tab="inventory">Inventory</button>
        </div>
      </div>
      <div id="skills-content" class="skills-content"></div>
      <div id="inventory-content" class="inventory-content hidden"></div>
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

  // Switch between tabs
  switchTab(tabName) {
    this.activeTab = tabName;

    // Update tab buttons
    this.panel.querySelectorAll('.skills-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Update content visibility
    document.getElementById('skills-content').classList.toggle('hidden', tabName !== 'skills');
    document.getElementById('inventory-content').classList.toggle('hidden', tabName !== 'inventory');

    this.updateUI();
  }

  // Update UI display
  updateUI() {
    if (this.activeTab === 'skills') {
      this.renderSkills();
    } else {
      this.renderInventory();
    }
  }

  // Render skills tab
  renderSkills() {
    const container = document.getElementById('skills-content');
    if (!container) return;

    let html = '<div class="skills-grid">';

    for (const [key, skill] of Object.entries(this.skills)) {
      const level = this.getLevel(skill.xp);
      const progress = this.getLevelProgress(skill.xp);
      const isActive = this.getSkillForWeather(this.currentWeather) === key;

      html += `
        <div class="skill-box ${isActive ? 'active' : ''}">
          <div class="skill-icon">${skill.icon}</div>
          <div class="skill-info">
            <div class="skill-name">${skill.name}</div>
            <div class="skill-level">Lv. ${level}</div>
            <div class="skill-progress-bar">
              <div class="skill-progress-fill" style="width: ${progress * 100}%"></div>
            </div>
          </div>
        </div>
      `;
    }

    html += '</div>';
    container.innerHTML = html;
  }

  // Render inventory tab
  renderInventory() {
    const container = document.getElementById('inventory-content');
    if (!container) return;

    let html = '<div class="inventory-grid">';

    for (const [key, item] of Object.entries(this.itemTypes)) {
      const count = this.inventory[key] || 0;
      const hasItem = count > 0;

      html += `
        <div class="inventory-slot ${hasItem ? 'has-item' : ''}" title="${item.name}">
          <span class="item-icon">${item.icon}</span>
          ${hasItem ? `<span class="item-count">${count}</span>` : ''}
        </div>
      `;
    }

    // Fill remaining slots (28 total like OSRS)
    const filledSlots = Object.keys(this.itemTypes).length;
    for (let i = filledSlots; i < 28; i++) {
      html += '<div class="inventory-slot empty"></div>';
    }

    html += '</div>';
    container.innerHTML = html;
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

    // Level up notification
    if (newLevel > oldLevel) {
      this.showNotification(`${skill.icon} ${skill.name} leveled up to ${newLevel}!`, 'levelup');
    }

    // Update UI
    this.updateUI();
    this.save();
  }

  // Check for random item drop
  checkItemDrop() {
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
      this.inventory[itemKey] = (this.inventory[itemKey] || 0) + 1;
      this.showNotification(`${item.icon} Found: ${item.name}!`, 'item');
      this.updateUI();
      this.save();
    }
  }

  // Show notification
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `skill-notification ${type}`;
    notification.textContent = message;

    // Position near skills panel
    notification.style.cssText = `
      position: fixed;
      bottom: 280px;
      right: 20px;
      background: rgba(0, 0, 0, 0.9);
      border: 2px solid ${type === 'levelup' ? '#ffb000' : '#00ff00'};
      color: ${type === 'levelup' ? '#ffb000' : '#00ff00'};
      padding: 10px 15px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      z-index: 1000;
      animation: slideIn 0.3s ease-out, fadeOut 0.5s ease-in 2.5s forwards;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentElement) {
        notification.parentElement.removeChild(notification);
      }
    }, 3000);
  }

  // Save to localStorage
  save() {
    const data = {
      skills: {},
      inventory: this.inventory
    };

    for (const [key, skill] of Object.entries(this.skills)) {
      data.skills[key] = skill.xp;
    }

    localStorage.setItem('geommo_skills', JSON.stringify(data));
  }

  // Load from localStorage
  load() {
    const saved = localStorage.getItem('geommo_skills');
    if (!saved) return;

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

      // Load inventory
      if (data.inventory) {
        for (const [key, count] of Object.entries(data.inventory)) {
          if (key in this.inventory) {
            this.inventory[key] = count;
          }
        }
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
}

// Export
window.SkillsManager = SkillsManager;
