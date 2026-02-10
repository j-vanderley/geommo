// Map Manager - Handles 3D view (Three.js) + Google Maps minimap
class MapManager {
  constructor() {
    // 3D rendering
    this.map3d = null;

    // Weather system
    this.weatherManager = null;

    // Skills system
    this.skillsManager = null;

    // Google Maps (minimap only)
    this.minimap = null;

    // Legacy compatibility
    this.markers = new Map(); // socketId -> marker data
    this.chatBubbles = new Map();
    this.selfMarker = null;
    this.selfPlayerId = null;
    this.onMoveCallback = null;

    // Minimap markers
    this.minimapMarkers = new Map(); // socketId -> google.maps.Marker
    this.minimapNPCMarkers = new Map(); // npcId -> google.maps.Marker
    this.minimapHomeMarker = null;
    this.minimapSelfMarker = null;

    // API key (extracted from page)
    this.apiKey = 'AIzaSyA215L_qSgleCyUM7brvtNUIXKx0GxEErA';

    // Current player position for weather
    this.currentPosition = null;
  }

  async init() {
    // Wait for Google Maps to load (for minimap)
    if (!window.google || !window.google.maps) {
      await new Promise(resolve => {
        window.onMapReady = resolve;
        if (window.mapReady) resolve();
      });
    }

    // Check if 3D is enabled
    if (GAME_CONFIG.view3d && GAME_CONFIG.view3d.enabled) {
      await this.init3D();
    } else {
      await this.init2D();
    }

    // Initialize minimap (always Google Maps)
    this.minimap = new google.maps.Map(document.getElementById('minimap'), {
      center: GAME_CONFIG.defaultPosition,
      zoom: GAME_CONFIG.minimap.zoom,
      disableDefaultUI: true,
      draggable: false,
      zoomControl: false,
      scrollwheel: false,
      disableDoubleClickZoom: true,
      styles: this.getMapStyle()
    });

    // Create self marker for minimap (yellow dot)
    this.minimapSelfMarker = new google.maps.Marker({
      position: GAME_CONFIG.defaultPosition,
      map: this.minimap,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 6,
        fillColor: '#FFD700',
        fillOpacity: 1,
        strokeColor: '#000',
        strokeWeight: 2
      },
      zIndex: 1000,
      title: 'You'
    });

    return this;
  }

  // Create a minimap marker for another player
  createMinimapPlayerMarker(playerId, position, username) {
    if (!this.minimap || playerId === this.selfPlayerId) return;

    // Remove existing marker if any
    this.removeMinimapPlayerMarker(playerId);

    const marker = new google.maps.Marker({
      position: position,
      map: this.minimap,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 4,
        fillColor: '#00FF00',
        fillOpacity: 0.8,
        strokeColor: '#000',
        strokeWeight: 1
      },
      zIndex: 500,
      title: username || 'Player'
    });

    this.minimapMarkers.set(playerId, marker);
  }

  // Update minimap player marker position
  updateMinimapPlayerMarker(playerId, position) {
    if (playerId === this.selfPlayerId) return;

    const marker = this.minimapMarkers.get(playerId);
    if (marker) {
      marker.setPosition(position);
    }
  }

  // Remove minimap player marker
  removeMinimapPlayerMarker(playerId) {
    const marker = this.minimapMarkers.get(playerId);
    if (marker) {
      marker.setMap(null);
      this.minimapMarkers.delete(playerId);
    }
  }

  // Create minimap markers for NPCs
  createMinimapNPCMarkers(npcs) {
    if (!this.minimap) return;

    // Clear existing NPC markers
    this.minimapNPCMarkers.forEach(marker => marker.setMap(null));
    this.minimapNPCMarkers.clear();

    npcs.forEach(npc => {
      // Determine marker color based on NPC level/type
      let fillColor = '#FF4444'; // Red for enemies
      if (npc.friendly) {
        fillColor = '#4444FF'; // Blue for friendly
      } else if (npc.level >= 50) {
        fillColor = '#FF00FF'; // Purple for high level
      } else if (npc.level >= 25) {
        fillColor = '#FF8800'; // Orange for mid level
      }

      const marker = new google.maps.Marker({
        position: { lat: npc.lat, lng: npc.lng },
        map: this.minimap,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 3,
          fillColor: fillColor,
          fillOpacity: 0.9,
          strokeColor: '#000',
          strokeWeight: 1
        },
        zIndex: 400,
        title: `${npc.name} (Lvl ${npc.level})`
      });

      this.minimapNPCMarkers.set(npc.id, marker);
    });
  }

  // Create home marker on minimap
  createMinimapHomeMarker(position) {
    if (!this.minimap) return;

    // Remove existing home marker
    if (this.minimapHomeMarker) {
      this.minimapHomeMarker.setMap(null);
    }

    this.minimapHomeMarker = new google.maps.Marker({
      position: position,
      map: this.minimap,
      icon: {
        path: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
        fillColor: '#00BFFF',
        fillOpacity: 1,
        strokeColor: '#000',
        strokeWeight: 1,
        scale: 0.8,
        anchor: new google.maps.Point(12, 20)
      },
      zIndex: 600,
      title: 'Home'
    });
  }

  // Initialize 3D view
  async init3D() {
    const container = document.getElementById('map');

    if (!container) {
      console.error('Map container not found');
      return this.init2D();
    }

    try {
      // Create 3D manager
      this.map3d = new Map3D(container, this.apiKey);
      await this.map3d.init();
    } catch (error) {
      console.error('Failed to initialize 3D view:', error);
      // Fall back to 2D
      this.map3d = null;
      return this.init2D();
    }

    // Initialize weather manager
    this.weatherManager = new WeatherManager(this.map3d);
    await this.weatherManager.init();

    // Initialize skills manager and connect to weather
    this.skillsManager = new SkillsManager();
    this.skillsManager.init();
    this.skillsManager.setMap3D(this.map3d);
    this.weatherManager.skillsManager = this.skillsManager;

    // Expose skillsManager globally (needed by map3d.js for equipment rendering)
    window.skillsManager = this.skillsManager;

    // Hook into the animation loop for weather updates
    const originalAnimate = this.map3d.animate.bind(this.map3d);
    this.map3d.animate = () => {
      originalAnimate();
      if (this.weatherManager) {
        this.weatherManager.update();
      }
    };
    // Restart animation with new hook
    this.map3d.animate();

    // Set up click handler with NPC detection
    this.map3d.onClick2D((latLng) => {
      this.handleMapClick(latLng);
    });

    // Set up NPC click handling
    this.setupNPCInteraction();

    // NPCs are now loaded from server via world:state event
    // No need to initialize locally - skillsManager.loadNPCsFromServer() handles it
  }

  // Set up NPC interaction handling
  setupNPCInteraction() {
    if (!this.map3d) return;

    // Add click listener for NPCs, players, and home shop
    this.map3d.renderer.domElement.addEventListener('click', (event) => {
      // Check if clicking on an NPC, player, or home shop
      const clickResult = this.map3d.getClickTarget(event);
      if (clickResult && this.skillsManager) {
        if (clickResult.type === 'homeShop') {
          // Show home choice dialog (Bank or Shop)
          this.skillsManager.showHomeChoice();
        } else if (clickResult.type === 'npc') {
          // Show NPC tooltip menu at click position
          this.skillsManager.showNPCDialog(clickResult.npcId, event.clientX, event.clientY);
        } else if (clickResult.type === 'player') {
          // Show player interaction menu at click position
          this.skillsManager.showPlayerInteractionMenu(clickResult.playerId, event.clientX, event.clientY);
        }
      }
    });
  }

  // Fallback to 2D Google Maps view
  async init2D() {
    // Original Google Maps implementation
    this.map = new google.maps.Map(document.getElementById('map'), {
      center: GAME_CONFIG.defaultPosition,
      zoom: GAME_CONFIG.map.defaultZoom,
      minZoom: GAME_CONFIG.map.minZoom,
      maxZoom: GAME_CONFIG.map.maxZoom,
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: this.getMapStyle()
    });

    // Click to move
    this.map.addListener('click', (e) => {
      this.handleMapClick({
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      });
    });
  }

  handleMapClick(latLng) {
    if (this.onMoveCallback) {
      const position = {
        lat: latLng.lat,
        lng: latLng.lng
      };
      this.onMoveCallback(position);
    }
  }

  onMove(callback) {
    this.onMoveCallback = callback;
  }

  // Create player marker (3D sprite or 2D overlay)
  createPlayerMarker(player, isSelf = false) {
    if (this.map3d) {
      // 3D mode
      const sprite = this.map3d.createPlayerSprite(player, isSelf);
      this.markers.set(player.id, { sprite, isSelf, playerId: player.id });

      if (isSelf) {
        this.selfMarker = sprite;
        this.selfPlayerId = player.id;
        this.centerOn(player.position);

        // Fetch weather for initial position
        if (this.weatherManager) {
          this.weatherManager.fetchWeather(player.position.lat, player.position.lng);
        }
      } else {
        // Create minimap marker for other players
        this.createMinimapPlayerMarker(player.id, player.position, player.username);
      }

      return sprite;
    } else {
      // 2D fallback
      return this.createPlayerMarker2D(player, isSelf);
    }
  }

  // 2D player marker (original implementation)
  createPlayerMarker2D(player, isSelf = false) {
    const markerElement = document.createElement('div');
    markerElement.className = `player-marker ${isSelf ? 'self' : ''}`;
    const flag = player.flag || '?';
    markerElement.innerHTML = `
      <div class="name">${player.username}</div>
      <div class="player-sprite">${flag}</div>
    `;

    const PlayerOverlay = this.createPlayerOverlayClass();
    const overlay = new PlayerOverlay(player.position, markerElement, isSelf);
    overlay.setMap(this.map);

    this.markers.set(player.id, { overlay, element: markerElement, flag });

    if (isSelf) {
      this.selfMarker = overlay;
      this.centerOn(player.position);
    }

    return overlay;
  }

  // Custom Player Marker Overlay class (for 2D fallback)
  createPlayerOverlayClass() {
    class PlayerOverlay extends google.maps.OverlayView {
      constructor(position, element, isSelf) {
        super();
        this.position = position;
        this.element = element;
        this.isSelf = isSelf;
      }

      onAdd() {
        const panes = this.getPanes();
        panes.overlayMouseTarget.appendChild(this.element);
      }

      draw() {
        const overlayProjection = this.getProjection();
        if (!overlayProjection) return;

        const pos = overlayProjection.fromLatLngToDivPixel(
          new google.maps.LatLng(this.position.lat, this.position.lng)
        );

        if (pos) {
          this.element.style.position = 'absolute';
          this.element.style.left = `${pos.x - 20}px`;
          this.element.style.top = `${pos.y - 50}px`;
        }
      }

      onRemove() {
        if (this.element.parentElement) {
          this.element.parentElement.removeChild(this.element);
        }
      }

      setPosition(position) {
        this.position = position;
        this.draw();
      }
    }

    return PlayerOverlay;
  }

  // Update player position
  updatePlayerPosition(playerId, position, animate = true) {
    if (this.map3d) {
      this.map3d.updatePlayerPosition(playerId, position, animate);
    } else {
      const markerData = this.markers.get(playerId);
      if (!markerData) return;

      if (animate) {
        this.animateMarker(markerData.overlay, position);
      } else {
        markerData.overlay.setPosition(position);
      }
    }

    // Update minimap marker
    this.updateMinimapPlayerMarker(playerId, position);
  }

  // Simple animation between positions (2D fallback)
  animateMarker(overlay, targetPos) {
    const currentPos = { ...overlay.position };
    const steps = 20;
    let step = 0;

    const animate = () => {
      step++;
      const progress = step / steps;
      const lat = currentPos.lat + (targetPos.lat - currentPos.lat) * progress;
      const lng = currentPos.lng + (targetPos.lng - currentPos.lng) * progress;

      overlay.setPosition({ lat, lng });

      if (step < steps) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  // Remove player marker
  removePlayer(playerId) {
    if (this.map3d) {
      this.map3d.removePlayer(playerId);
    } else {
      const markerData = this.markers.get(playerId);
      if (markerData) {
        markerData.overlay.setMap(null);
      }
    }

    this.markers.delete(playerId);
    this.removeChatBubble(playerId);

    // Remove minimap marker
    this.removeMinimapPlayerMarker(playerId);
  }

  // Center map on position
  centerOn(position) {
    if (this.map3d) {
      this.map3d.centerOn(position.lat, position.lng);
    } else if (this.map) {
      this.map.setCenter(position);
    }

    // Always update minimap
    if (this.minimap) {
      this.minimap.setCenter(position);
    }

    // Update self marker on minimap
    if (this.minimapSelfMarker) {
      this.minimapSelfMarker.setPosition(position);
    }
  }

  // Update self position
  updateSelfPosition(position) {
    if (this.map3d && this.selfPlayerId) {
      // 3D mode
      this.map3d.updatePlayerPosition(this.selfPlayerId, position, true);
    } else if (this.selfMarker) {
      this.selfMarker.setPosition(position);
    }

    // Update minimap
    if (this.minimap) {
      this.minimap.setCenter(position);
    }

    // Update self marker on minimap
    if (this.minimapSelfMarker) {
      this.minimapSelfMarker.setPosition(position);
    }

    // Update coordinates display
    document.getElementById('player-coords').textContent =
      `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`;

    // Update weather for new position (isolated - won't affect player state)
    this.currentPosition = position;
    if (this.weatherManager) {
      // Weather fetch is rate-limited and only updates visual effects
      this.weatherManager.fetchWeather(position.lat, position.lng).catch(err => {
        console.warn('Weather fetch failed:', err);
        // Silently fail - weather is cosmetic only
      });
    }

    // Update skills manager with player position (for dropped items)
    if (this.skillsManager) {
      this.skillsManager.setPlayerPosition(position);
    }
  }

  // Show chat bubble above player
  showChatBubble(playerId, message) {
    if (this.map3d) {
      this.map3d.showChatBubble(playerId, message);
    } else {
      this.showChatBubble2D(playerId, message);
    }
  }

  // 2D chat bubble (original implementation)
  showChatBubble2D(playerId, message) {
    const markerData = this.markers.get(playerId);
    if (!markerData) return;

    // Remove existing bubble
    this.removeChatBubble(playerId);

    // Create bubble element
    const bubbleElement = document.createElement('div');
    bubbleElement.className = 'chat-bubble';
    bubbleElement.textContent = message;

    // Create overlay
    class ChatBubbleOverlay extends google.maps.OverlayView {
      constructor(position, element) {
        super();
        this.position = position;
        this.element = element;
      }

      onAdd() {
        const panes = this.getPanes();
        panes.floatPane.appendChild(this.element);
      }

      draw() {
        const overlayProjection = this.getProjection();
        if (!overlayProjection) return;

        const pos = overlayProjection.fromLatLngToDivPixel(this.position);

        if (pos) {
          this.element.style.position = 'absolute';
          this.element.style.left = `${pos.x - 100}px`;
          this.element.style.top = `${pos.y - 80}px`;
        }
      }

      onRemove() {
        if (this.element.parentElement) {
          this.element.parentElement.removeChild(this.element);
        }
      }
    }

    const position = new google.maps.LatLng(
      markerData.overlay.position.lat,
      markerData.overlay.position.lng
    );
    const overlay = new ChatBubbleOverlay(position, bubbleElement);
    overlay.setMap(this.map);

    this.chatBubbles.set(playerId, overlay);

    // Remove after duration
    setTimeout(() => {
      this.removeChatBubble(playerId);
    }, GAME_CONFIG.chatBubbleDuration);
  }

  removeChatBubble(playerId) {
    if (this.map3d) {
      this.map3d.removeChatBubble(playerId);
    } else {
      const bubble = this.chatBubbles.get(playerId);
      if (bubble) {
        bubble.setMap(null);
      }
    }
    this.chatBubbles.delete(playerId);
  }

  // Update player's avatar on the marker
  updatePlayerAvatar(playerId, avatar) {
    if (this.map3d) {
      this.map3d.updatePlayerAvatar(playerId, avatar);
    } else {
      const markerData = this.markers.get(playerId);
      if (!markerData) return;

      const sprite = markerData.element.querySelector('.player-sprite');
      if (sprite) {
        sprite.textContent = avatar.text || ':-)';
        if (avatar.color) {
          sprite.style.borderColor = avatar.color;
          sprite.style.color = avatar.color;
        }
      }
      markerData.avatar = avatar;
    }
  }

  // Legacy: Update player's flag on the marker
  updatePlayerFlag(playerId, flag) {
    this.updatePlayerAvatar(playerId, { text: flag, color: '#ffb000' });
  }

  // OSRS-inspired map style (darker, more game-like)
  getMapStyle() {
    return [
      {
        "elementType": "geometry",
        "stylers": [{ "color": "#212121" }]
      },
      {
        "elementType": "labels.icon",
        "stylers": [{ "visibility": "off" }]
      },
      {
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#757575" }]
      },
      {
        "elementType": "labels.text.stroke",
        "stylers": [{ "color": "#212121" }]
      },
      {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [{ "color": "#2c2c2c" }]
      },
      {
        "featureType": "road",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#8a8a8a" }]
      },
      {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [{ "color": "#000000" }]
      },
      {
        "featureType": "water",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#3d3d3d" }]
      },
      {
        "featureType": "poi",
        "elementType": "geometry",
        "stylers": [{ "color": "#1a1a1a" }]
      },
      {
        "featureType": "poi.park",
        "elementType": "geometry",
        "stylers": [{ "color": "#1a3d1a" }]
      },
      {
        "featureType": "landscape",
        "elementType": "geometry",
        "stylers": [{ "color": "#1a1a1a" }]
      }
    ];
  }
}

// Export for use in other modules
window.MapManager = MapManager;
