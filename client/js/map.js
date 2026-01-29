// Map Manager - Handles 3D view (Three.js) + Google Maps minimap
class MapManager {
  constructor() {
    // 3D rendering
    this.map3d = null;

    // Weather system
    this.weatherManager = null;

    // Google Maps (minimap only)
    this.minimap = null;

    // Legacy compatibility
    this.markers = new Map(); // socketId -> marker data
    this.chatBubbles = new Map();
    this.selfMarker = null;
    this.selfPlayerId = null;
    this.onMoveCallback = null;

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

    return this;
  }

  // Initialize 3D view
  async init3D() {
    const container = document.getElementById('map');

    // Create 3D manager
    this.map3d = new Map3D(container, this.apiKey);
    await this.map3d.init();

    // Initialize weather manager
    this.weatherManager = new WeatherManager(this.map3d);
    await this.weatherManager.init();

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

    // Set up click handler
    this.map3d.onClick2D((latLng) => {
      this.handleMapClick(latLng);
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

    // Update coordinates display
    document.getElementById('player-coords').textContent =
      `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`;

    // Update weather for new position
    this.currentPosition = position;
    if (this.weatherManager) {
      this.weatherManager.fetchWeather(position.lat, position.lng);
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
