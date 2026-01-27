// Map Manager - Handles Google Maps integration
class MapManager {
  constructor() {
    this.map = null;
    this.minimap = null;
    this.markers = new Map(); // socketId -> marker overlay
    this.chatBubbles = new Map(); // socketId -> overlay
    this.selfMarker = null;
    this.onMoveCallback = null;
  }

  async init() {
    // Wait for Google Maps to load
    if (!window.google || !window.google.maps) {
      await new Promise(resolve => {
        window.onMapReady = resolve;
        if (window.mapReady) resolve();
      });
    }

    // Initialize main map
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

    // Initialize minimap
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

    // Click to move
    this.map.addListener('click', (e) => {
      this.handleMapClick(e.latLng);
    });

    return this;
  }

  handleMapClick(latLng) {
    if (this.onMoveCallback) {
      const position = {
        lat: latLng.lat(),
        lng: latLng.lng()
      };
      this.onMoveCallback(position);
    }
  }

  onMove(callback) {
    this.onMoveCallback = callback;
  }

  // Custom Player Marker Overlay class
  createPlayerOverlayClass() {
    const self = this;

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

  // Create player marker
  createPlayerMarker(player, isSelf = false) {
    const markerElement = document.createElement('div');
    markerElement.className = `player-marker ${isSelf ? 'self' : ''}`;
    const flag = player.flag || '🏳️';
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

  // Update player position with animation
  updatePlayerPosition(playerId, position, animate = true) {
    const markerData = this.markers.get(playerId);
    if (!markerData) return;

    if (animate) {
      this.animateMarker(markerData.overlay, position);
    } else {
      markerData.overlay.setPosition(position);
    }
  }

  // Simple animation between positions
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
    const markerData = this.markers.get(playerId);
    if (markerData) {
      markerData.overlay.setMap(null);
      this.markers.delete(playerId);
    }

    this.removeChatBubble(playerId);
  }

  // Center map on position
  centerOn(position) {
    this.map.setCenter(position);
    this.minimap.setCenter(position);
  }

  // Update self position
  updateSelfPosition(position) {
    if (this.selfMarker) {
      this.selfMarker.setPosition(position);
    }
    this.minimap.setCenter(position);

    // Update coordinates display
    document.getElementById('player-coords').textContent =
      `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`;
  }

  // Show chat bubble above player
  showChatBubble(playerId, message) {
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
    const bubble = this.chatBubbles.get(playerId);
    if (bubble) {
      bubble.setMap(null);
      this.chatBubbles.delete(playerId);
    }
  }

  // Update player's flag on the marker
  updatePlayerFlag(playerId, flag) {
    const markerData = this.markers.get(playerId);
    if (!markerData) return;

    const sprite = markerData.element.querySelector('.player-sprite');
    if (sprite) {
      sprite.textContent = flag;
    }
    markerData.flag = flag;
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
