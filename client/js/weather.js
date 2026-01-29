// Weather Manager - Fetches weather data and manages visual effects
class WeatherManager {
  constructor(map3d) {
    this.map3d = map3d;
    this.currentWeather = null;
    this.lastFetchTime = 0;
    this.fetchInterval = 5 * 60 * 1000; // Fetch every 5 minutes
    this.lastLat = null;
    this.lastLng = null;

    // Weather particles
    this.rainSystem = null;
    this.snowSystem = null;

    // Lighting
    this.ambientLight = null;
    this.sunLight = null;
    this.originalBackground = null;

    // Weather state
    this.isDay = true;
    this.weatherType = 'clear'; // clear, rain, snow, storm, cloudy

    // Skills manager reference (set externally)
    this.skillsManager = null;
  }

  async init() {
    // Store original background
    this.originalBackground = this.map3d.scene.background.clone();

    // Find or create ambient light
    this.map3d.scene.traverse((obj) => {
      if (obj.isAmbientLight) {
        this.ambientLight = obj;
      }
    });

    // Add directional light for sun/moon
    this.sunLight = new THREE.DirectionalLight(0xffffff, 0.5);
    this.sunLight.position.set(50, 100, 50);
    this.map3d.scene.add(this.sunLight);

    // Create particle systems
    this.createRainSystem();
    this.createSnowSystem();

    return this;
  }

  createRainSystem() {
    const particleCount = 5000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 200;     // x
      positions[i * 3 + 1] = Math.random() * 100;          // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200; // z
      velocities[i] = 0.5 + Math.random() * 0.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.userData.velocities = velocities;

    const material = new THREE.PointsMaterial({
      color: 0xaaaaaa,
      size: 0.3,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    this.rainSystem = new THREE.Points(geometry, material);
    this.rainSystem.visible = false;
    this.map3d.scene.add(this.rainSystem);
  }

  createSnowSystem() {
    const particleCount = 3000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 2); // y velocity + x drift

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 1] = Math.random() * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
      velocities[i * 2] = 0.05 + Math.random() * 0.1;     // fall speed
      velocities[i * 2 + 1] = (Math.random() - 0.5) * 0.02; // drift
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.userData.velocities = velocities;

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    this.snowSystem = new THREE.Points(geometry, material);
    this.snowSystem.visible = false;
    this.map3d.scene.add(this.snowSystem);
  }

  async fetchWeather(lat, lng) {
    const now = Date.now();

    // Check if we should fetch (rate limiting)
    const distanceMoved = this.lastLat !== null ?
      Math.abs(lat - this.lastLat) + Math.abs(lng - this.lastLng) : Infinity;

    if (now - this.lastFetchTime < this.fetchInterval && distanceMoved < 0.5) {
      return this.currentWeather;
    }

    try {
      // Open-Meteo API - free, no key needed
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,is_day&daily=sunrise,sunset&timezone=auto`;

      const response = await fetch(url);
      const data = await response.json();

      this.currentWeather = {
        temperature: data.current.temperature_2m,
        weatherCode: data.current.weather_code,
        isDay: data.current.is_day === 1,
        sunrise: data.daily.sunrise[0],
        sunset: data.daily.sunset[0]
      };

      this.lastFetchTime = now;
      this.lastLat = lat;
      this.lastLng = lng;

      // Apply weather effects
      this.applyWeather();

      return this.currentWeather;
    } catch (error) {
      console.error('Failed to fetch weather:', error);
      return null;
    }
  }

  // Convert WMO weather codes to simple types
  getWeatherType(code) {
    // WMO Weather interpretation codes
    // https://open-meteo.com/en/docs
    if (code === 0 || code === 1) return 'clear';
    if (code === 2 || code === 3) return 'cloudy';
    if (code >= 45 && code <= 48) return 'fog';
    if (code >= 51 && code <= 57) return 'drizzle';
    if (code >= 61 && code <= 67) return 'rain';
    if (code >= 71 && code <= 77) return 'snow';
    if (code >= 80 && code <= 82) return 'rain';
    if (code >= 85 && code <= 86) return 'snow';
    if (code >= 95 && code <= 99) return 'storm';
    return 'clear';
  }

  applyWeather() {
    if (!this.currentWeather) return;

    const weatherType = this.getWeatherType(this.currentWeather.weatherCode);
    const weatherChanged = this.weatherType !== weatherType;
    this.weatherType = weatherType;
    this.isDay = this.currentWeather.isDay;

    // Apply day/night lighting
    this.applyDayNight();

    // Apply weather effects
    this.applyWeatherEffects(weatherType);

    // Update UI
    this.updateWeatherUI();

    // Notify skills manager of weather (start XP gain)
    if (this.skillsManager) {
      this.skillsManager.startWeatherXP(weatherType);
    }
  }

  applyDayNight() {
    if (this.isDay) {
      // Daytime
      this.map3d.scene.background = new THREE.Color(0x87CEEB); // Sky blue
      if (this.ambientLight) {
        this.ambientLight.intensity = 1.0;
        this.ambientLight.color.setHex(0xffffff);
      }
      if (this.sunLight) {
        this.sunLight.intensity = 0.6;
        this.sunLight.color.setHex(0xffffee);
      }
    } else {
      // Nighttime
      this.map3d.scene.background = new THREE.Color(0x0a0a20); // Dark blue
      if (this.ambientLight) {
        this.ambientLight.intensity = 0.3;
        this.ambientLight.color.setHex(0x4444ff);
      }
      if (this.sunLight) {
        this.sunLight.intensity = 0.1;
        this.sunLight.color.setHex(0x8888ff); // Moonlight
      }
    }
  }

  applyWeatherEffects(type) {
    // Reset all effects
    this.rainSystem.visible = false;
    this.snowSystem.visible = false;

    // Adjust background for weather
    let bgColor = this.isDay ? 0x87CEEB : 0x0a0a20;

    switch (type) {
      case 'clear':
        // Sunny/clear - brighter
        if (this.isDay) {
          bgColor = 0x87CEEB;
          if (this.ambientLight) this.ambientLight.intensity = 1.2;
        }
        break;

      case 'cloudy':
        // Overcast - dimmer
        bgColor = this.isDay ? 0x9ca3af : 0x0a0a15;
        if (this.ambientLight) this.ambientLight.intensity = this.isDay ? 0.7 : 0.2;
        break;

      case 'fog':
        // Foggy - grey
        bgColor = this.isDay ? 0xb0b0b0 : 0x202030;
        if (this.ambientLight) this.ambientLight.intensity = this.isDay ? 0.5 : 0.15;
        // Could add fog effect here
        break;

      case 'drizzle':
      case 'rain':
        // Rain
        bgColor = this.isDay ? 0x6b7280 : 0x0a0a18;
        if (this.ambientLight) this.ambientLight.intensity = this.isDay ? 0.5 : 0.2;
        this.rainSystem.visible = true;
        break;

      case 'snow':
        // Snow
        bgColor = this.isDay ? 0xd1d5db : 0x1a1a2e;
        if (this.ambientLight) this.ambientLight.intensity = this.isDay ? 0.8 : 0.3;
        this.snowSystem.visible = true;
        break;

      case 'storm':
        // Thunderstorm - dark with rain
        bgColor = this.isDay ? 0x374151 : 0x050510;
        if (this.ambientLight) this.ambientLight.intensity = this.isDay ? 0.3 : 0.1;
        this.rainSystem.visible = true;
        // Start lightning
        this.startLightning();
        break;
    }

    this.map3d.scene.background = new THREE.Color(bgColor);
  }

  startLightning() {
    if (this.weatherType !== 'storm') return;

    // Random lightning flash
    const flash = () => {
      if (this.weatherType !== 'storm') return;

      // Flash the scene bright
      if (this.ambientLight) {
        const originalIntensity = this.ambientLight.intensity;
        this.ambientLight.intensity = 2.0;
        this.map3d.scene.background = new THREE.Color(0xffffff);

        setTimeout(() => {
          this.ambientLight.intensity = originalIntensity;
          this.map3d.scene.background = new THREE.Color(this.isDay ? 0x374151 : 0x050510);
        }, 100);
      }

      // Schedule next flash
      const nextFlash = 3000 + Math.random() * 7000;
      setTimeout(flash, nextFlash);
    };

    // Start first flash
    setTimeout(flash, 2000 + Math.random() * 3000);
  }

  update() {
    // Update rain particles
    if (this.rainSystem.visible) {
      const positions = this.rainSystem.geometry.attributes.position.array;
      const velocities = this.rainSystem.geometry.userData.velocities;
      const playerPos = this.getPlayerPosition();

      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3 + 1] -= velocities[i] * 2; // Fall

        // Reset if below ground
        if (positions[i * 3 + 1] < 0) {
          positions[i * 3] = playerPos.x + (Math.random() - 0.5) * 200;
          positions[i * 3 + 1] = 80 + Math.random() * 20;
          positions[i * 3 + 2] = playerPos.z + (Math.random() - 0.5) * 200;
        }
      }

      this.rainSystem.geometry.attributes.position.needsUpdate = true;
    }

    // Update snow particles
    if (this.snowSystem.visible) {
      const positions = this.snowSystem.geometry.attributes.position.array;
      const velocities = this.snowSystem.geometry.userData.velocities;
      const playerPos = this.getPlayerPosition();

      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3] += velocities[i * 2 + 1]; // Drift
        positions[i * 3 + 1] -= velocities[i * 2]; // Fall
        positions[i * 3 + 2] += Math.sin(Date.now() * 0.001 + i) * 0.01; // Sway

        // Reset if below ground
        if (positions[i * 3 + 1] < 0) {
          positions[i * 3] = playerPos.x + (Math.random() - 0.5) * 200;
          positions[i * 3 + 1] = 60 + Math.random() * 20;
          positions[i * 3 + 2] = playerPos.z + (Math.random() - 0.5) * 200;
        }
      }

      this.snowSystem.geometry.attributes.position.needsUpdate = true;
    }
  }

  getPlayerPosition() {
    if (this.map3d.selfPlayerId) {
      const playerData = this.map3d.playerSprites.get(this.map3d.selfPlayerId);
      if (playerData) {
        return playerData.group.position;
      }
    }
    return { x: 0, y: 0, z: 0 };
  }

  updateWeatherUI() {
    // Update or create weather display
    let weatherDisplay = document.getElementById('weather-display');

    if (!weatherDisplay) {
      weatherDisplay = document.createElement('div');
      weatherDisplay.id = 'weather-display';
      weatherDisplay.className = 'ui-panel';
      weatherDisplay.innerHTML = `
        <div class="panel-header">Weather</div>
        <div id="weather-info"></div>
      `;

      // Insert after player info
      const playerInfo = document.getElementById('player-info');
      if (playerInfo && playerInfo.parentNode) {
        playerInfo.parentNode.insertBefore(weatherDisplay, playerInfo.nextSibling);
      }
    }

    const weatherInfo = document.getElementById('weather-info');
    if (weatherInfo && this.currentWeather) {
      const temp = Math.round(this.currentWeather.temperature);
      const icon = this.getWeatherIcon();
      const timeIcon = this.isDay ? '☀️' : '🌙';

      weatherInfo.innerHTML = `
        <div class="weather-temp">${icon} ${temp}°C</div>
        <div class="weather-time">${timeIcon} ${this.isDay ? 'Day' : 'Night'}</div>
      `;
    }
  }

  getWeatherIcon() {
    switch (this.weatherType) {
      case 'clear': return this.isDay ? '☀️' : '🌙';
      case 'cloudy': return '☁️';
      case 'fog': return '🌫️';
      case 'drizzle': return '🌦️';
      case 'rain': return '🌧️';
      case 'snow': return '❄️';
      case 'storm': return '⛈️';
      default: return '🌤️';
    }
  }

  dispose() {
    if (this.rainSystem) {
      this.map3d.scene.remove(this.rainSystem);
      this.rainSystem.geometry.dispose();
      this.rainSystem.material.dispose();
    }
    if (this.snowSystem) {
      this.map3d.scene.remove(this.snowSystem);
      this.snowSystem.geometry.dispose();
      this.snowSystem.material.dispose();
    }
    if (this.sunLight) {
      this.map3d.scene.remove(this.sunLight);
    }
  }
}

// Export for use in other modules
window.WeatherManager = WeatherManager;
