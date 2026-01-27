// Map3D - Core 3D Scene Management
// Handles Three.js scene, player sprites, and raycasting for click-to-move
class Map3D {
  constructor(container, apiKey) {
    this.container = container;
    this.apiKey = apiKey;

    // Three.js components
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.cameraController = null;

    // Managers
    this.tileManager = null;

    // Players
    this.playerSprites = new Map(); // socketId -> { sprite, group, nameLabel }
    this.selfPlayerId = null;

    // Raycasting
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.groundPlane = null;

    // Click callback
    this.onClickCallback = null;

    // Center position (for coordinate conversion)
    this.centerLat = 0;
    this.centerLng = 0;

    // Animation
    this.animationId = null;

    // HTML overlays (chat bubbles and name labels)
    this.chatBubbles = new Map();
    this.nameLabels = new Map();
  }

  async init() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a);

    // Create camera
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 2000);

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    // Create camera controller
    this.cameraController = new OSRSCamera(this.camera, this.renderer.domElement);

    // Create invisible ground plane for raycasting
    const groundGeometry = new THREE.PlaneGeometry(10000, 10000);
    const groundMaterial = new THREE.MeshBasicMaterial({
      visible: false,
      side: THREE.DoubleSide
    });
    this.groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
    this.groundPlane.rotation.x = -Math.PI / 2;
    this.groundPlane.position.y = 0;
    this.scene.add(this.groundPlane);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    this.scene.add(ambientLight);

    // Create tile manager
    this.tileManager = new TileManager();
    this.tileManager.setScene(this.scene);

    // Bind events
    this.bindEvents();

    // Start animation loop
    this.animate();

    return this;
  }

  bindEvents() {
    // Click for movement
    this.renderer.domElement.addEventListener('click', (e) => this.onClick(e));

    // Window resize
    window.addEventListener('resize', () => this.onResize());
  }

  onClick(e) {
    // Ignore if we were rotating the camera
    if (this.cameraController && this.cameraController.isRotating) return;

    // Calculate mouse position in normalized device coordinates
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycast to ground
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.groundPlane);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      const latLng = this.worldToLatLng(point.x, point.z);

      if (this.onClickCallback) {
        this.onClickCallback(latLng);
      }
    }
  }

  onResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    // Update camera controller (for keyboard input)
    if (this.cameraController) {
      this.cameraController.update();
    }

    // Update HTML overlay positions (name labels and chat bubbles)
    this.updateOverlayPositions();

    this.renderer.render(this.scene, this.camera);
  }

  // Coordinate conversion - lat/lng to world
  latLngToWorld(lat, lng) {
    const scale = GAME_CONFIG.view3d.worldScale;
    const x = (lng - this.centerLng) * scale * Math.cos(this.centerLat * Math.PI / 180);
    const z = (this.centerLat - lat) * scale;
    return { x, y: 0, z };
  }

  // Coordinate conversion - world to lat/lng
  worldToLatLng(x, z) {
    const scale = GAME_CONFIG.view3d.worldScale;
    const lng = this.centerLng + x / (scale * Math.cos(this.centerLat * Math.PI / 180));
    const lat = this.centerLat - z / scale;
    return { lat, lng };
  }

  // Set center position (usually player's spawn position)
  setCenter(lat, lng) {
    this.centerLat = lat;
    this.centerLng = lng;
    this.tileManager.centerLat = lat;
    this.tileManager.centerLng = lng;
  }

  // Create a player sprite (flag emoji as texture)
  createPlayerSprite(player, isSelf = false) {
    const flag = player.flag || '🏳️';
    const username = player.username || 'Unknown';

    // Create a group to hold sprite
    const group = new THREE.Group();

    // Create canvas for flag sprite with emoji
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Draw circular background
    ctx.beginPath();
    ctx.arc(64, 64, 56, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fill();

    // Draw border
    ctx.strokeStyle = isSelf ? '#ffb000' : '#5d5447';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Draw flag emoji - use large size for clarity
    ctx.font = '60px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(flag, 64, 66);

    // Create sprite texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;

    // Create sprite material
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true
    });

    // Create sprite
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(
      GAME_CONFIG.view3d.playerSpriteSize,
      GAME_CONFIG.view3d.playerSpriteSize,
      1
    );
    sprite.position.y = GAME_CONFIG.view3d.playerSpriteSize / 2;
    group.add(sprite);

    // Position group
    const worldPos = this.latLngToWorld(player.position.lat, player.position.lng);
    group.position.set(worldPos.x, 0, worldPos.z);

    // Add to scene
    this.scene.add(group);

    // Create HTML name label (stays same size when zooming)
    const nameLabel = this.createNameLabel(player.id, username, isSelf);

    // Store reference
    this.playerSprites.set(player.id, { sprite, group, canvas, ctx, isSelf, nameLabel });

    // If self, set camera target and load tiles
    if (isSelf) {
      this.selfPlayerId = player.id;
      this.setCenter(player.position.lat, player.position.lng);
      this.cameraController.setTarget(worldPos.x, 0, worldPos.z);
      this.tileManager.updateTiles(player.position.lat, player.position.lng);
    }

    return group;
  }

  // Create HTML name label (like chat bubbles, stays same size)
  createNameLabel(playerId, name, isSelf = false) {
    const label = document.createElement('div');
    label.className = 'player-name-label' + (isSelf ? ' self' : '');
    label.textContent = name;

    this.container.appendChild(label);
    this.nameLabels.set(playerId, { element: label });

    return label;
  }

  // Update all HTML overlay positions (names and chat bubbles)
  updateOverlayPositions() {
    // Update name labels
    this.nameLabels.forEach((labelData, playerId) => {
      const playerData = this.playerSprites.get(playerId);
      if (!playerData || !labelData.element) return;

      const worldPos = playerData.group.position.clone();
      worldPos.y += GAME_CONFIG.view3d.playerSpriteSize + 0.5;

      const screenPos = worldPos.clone().project(this.camera);
      const x = (screenPos.x * 0.5 + 0.5) * this.container.clientWidth;
      const y = (-screenPos.y * 0.5 + 0.5) * this.container.clientHeight;

      if (screenPos.z < 1) {
        labelData.element.style.display = 'block';
        labelData.element.style.left = `${x}px`;
        labelData.element.style.top = `${y}px`;
      } else {
        labelData.element.style.display = 'none';
      }
    });

    // Update chat bubbles
    this.chatBubbles.forEach((bubble, playerId) => {
      const playerData = this.playerSprites.get(playerId);
      if (!playerData || !bubble.element) return;

      const worldPos = playerData.group.position.clone();
      worldPos.y += GAME_CONFIG.view3d.playerSpriteSize + 2;

      const screenPos = worldPos.clone().project(this.camera);
      const x = (screenPos.x * 0.5 + 0.5) * this.container.clientWidth;
      const y = (-screenPos.y * 0.5 + 0.5) * this.container.clientHeight;

      if (screenPos.z < 1) {
        bubble.element.style.display = 'block';
        bubble.element.style.left = `${x}px`;
        bubble.element.style.top = `${y}px`;
      } else {
        bubble.element.style.display = 'none';
      }
    });
  }

  // Update player position
  updatePlayerPosition(playerId, position, animate = true) {
    const playerData = this.playerSprites.get(playerId);
    if (!playerData) return;

    const targetPos = this.latLngToWorld(position.lat, position.lng);

    if (animate) {
      this.animatePlayerTo(playerData.group, targetPos);
    } else {
      playerData.group.position.set(targetPos.x, 0, targetPos.z);
    }

    // If self player, update camera target and tiles
    if (playerId === this.selfPlayerId) {
      this.cameraController.moveTargetTo(targetPos.x, 0, targetPos.z);
      this.tileManager.updateTiles(position.lat, position.lng);
    }
  }

  // Animate player movement
  animatePlayerTo(group, targetPos) {
    const startPos = group.position.clone();
    const endPos = new THREE.Vector3(targetPos.x, 0, targetPos.z);
    const duration = 300; // ms
    const startTime = performance.now();

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out quad
      const eased = 1 - (1 - progress) * (1 - progress);

      group.position.lerpVectors(startPos, endPos, eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  // Remove a player
  removePlayer(playerId) {
    const playerData = this.playerSprites.get(playerId);
    if (!playerData) return;

    this.scene.remove(playerData.group);

    // Dispose textures and materials
    playerData.sprite.material.map.dispose();
    playerData.sprite.material.dispose();

    // Remove name label
    const labelData = this.nameLabels.get(playerId);
    if (labelData && labelData.element && labelData.element.parentElement) {
      labelData.element.parentElement.removeChild(labelData.element);
    }
    this.nameLabels.delete(playerId);

    this.playerSprites.delete(playerId);
    this.removeChatBubble(playerId);
  }

  // Update player's flag
  updatePlayerFlag(playerId, flag) {
    const playerData = this.playerSprites.get(playerId);
    if (!playerData) return;

    const { ctx, sprite, isSelf } = playerData;

    // Redraw canvas
    ctx.clearRect(0, 0, 128, 128);

    // Draw circular background
    ctx.beginPath();
    ctx.arc(64, 64, 56, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fill();

    // Draw border
    ctx.strokeStyle = isSelf ? '#ffb000' : '#5d5447';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Draw flag emoji
    ctx.font = '60px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(flag, 64, 66);

    // Update texture
    sprite.material.map.needsUpdate = true;
  }

  // Show chat bubble above player
  showChatBubble(playerId, message) {
    this.removeChatBubble(playerId);

    const playerData = this.playerSprites.get(playerId);
    if (!playerData) return;

    // Create HTML overlay bubble
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble-3d';
    bubble.textContent = message;

    // Store bubble
    this.chatBubbles.set(playerId, {
      element: bubble,
      playerId: playerId
    });

    // Add to DOM
    this.container.appendChild(bubble);

    // Remove after duration
    setTimeout(() => {
      this.removeChatBubble(playerId);
    }, GAME_CONFIG.chatBubbleDuration);
  }

  removeChatBubble(playerId) {
    const bubble = this.chatBubbles.get(playerId);
    if (bubble && bubble.element && bubble.element.parentElement) {
      bubble.element.parentElement.removeChild(bubble.element);
    }
    this.chatBubbles.delete(playerId);
  }

  // Set click callback
  onClick2D(callback) {
    this.onClickCallback = callback;
  }

  // Center view on position (used for fast travel)
  centerOn(lat, lng) {
    const worldPos = this.latLngToWorld(lat, lng);
    this.cameraController.setTarget(worldPos.x, 0, worldPos.z);
  }

  // Fast travel to a location
  fastTravelTo(lat, lng) {
    // Update tiles for new location
    this.tileManager.updateTiles(lat, lng);

    // Return the lat/lng for the game to update player position
    return { lat, lng };
  }

  // Dispose everything
  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    // Remove all players
    this.playerSprites.forEach((_, id) => this.removePlayer(id));

    // Remove chat bubbles
    this.chatBubbles.forEach((_, id) => this.removeChatBubble(id));

    // Remove name labels
    this.nameLabels.forEach((labelData) => {
      if (labelData.element && labelData.element.parentElement) {
        labelData.element.parentElement.removeChild(labelData.element);
      }
    });
    this.nameLabels.clear();

    // Dispose tile manager
    if (this.tileManager) {
      this.tileManager.dispose();
    }

    // Dispose renderer
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement.parentElement) {
        this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
      }
    }
  }
}

// Export for use in other modules
window.Map3D = Map3D;
