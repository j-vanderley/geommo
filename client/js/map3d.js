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
    this.playerSprites = new Map(); // socketId -> { sprite, nameSprite, group }
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

    // Chat bubbles (3D or HTML overlay)
    this.chatBubbles = new Map();
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

    // Make all player sprites face the camera (billboarding)
    this.playerSprites.forEach(({ group }) => {
      if (group) {
        // Get camera direction in horizontal plane
        const cameraDir = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDir);
        cameraDir.y = 0;
        cameraDir.normalize();

        // Rotate group to face camera
        const angle = Math.atan2(cameraDir.x, cameraDir.z);
        group.rotation.y = angle + Math.PI;
      }
    });

    // Update chat bubble positions
    this.updateChatBubblePositions();

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
    const flag = player.flag || '?';
    const username = player.username || 'Unknown';

    // Create a group to hold sprite and name
    const group = new THREE.Group();

    // Create canvas for flag sprite
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

    // Draw flag emoji
    ctx.font = '64px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(flag, 64, 68);

    // Create sprite texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

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

    // Create name label
    const nameSprite = this.createNameSprite(username, isSelf);
    nameSprite.position.y = GAME_CONFIG.view3d.playerSpriteSize + 0.5;
    group.add(nameSprite);

    // Position group
    const worldPos = this.latLngToWorld(player.position.lat, player.position.lng);
    group.position.set(worldPos.x, 0, worldPos.z);

    // Add to scene
    this.scene.add(group);

    // Store reference
    this.playerSprites.set(player.id, { sprite, nameSprite, group, canvas, ctx, isSelf });

    // If self, set camera target and load tiles
    if (isSelf) {
      this.selfPlayerId = player.id;
      this.setCenter(player.position.lat, player.position.lng);
      this.cameraController.setTarget(worldPos.x, 0, worldPos.z);
      this.tileManager.updateTiles(player.position.lat, player.position.lng);
    }

    return group;
  }

  // Create name label sprite
  createNameSprite(name, isSelf = false) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    const textWidth = ctx.measureText(name).width + 16;
    ctx.fillRect((256 - textWidth) / 2, 16, textWidth, 32);

    // Draw text
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isSelf ? '#ffb000' : '#ffff00';
    ctx.fillText(name, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(4, 1, 1);

    return sprite;
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
    playerData.nameSprite.material.map.dispose();
    playerData.nameSprite.material.dispose();

    this.playerSprites.delete(playerId);
    this.removeChatBubble(playerId);
  }

  // Update player's flag
  updatePlayerFlag(playerId, flag) {
    const playerData = this.playerSprites.get(playerId);
    if (!playerData) return;

    const { ctx, canvas, sprite, isSelf } = playerData;

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
    ctx.font = '64px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(flag, 64, 68);

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

    // Store bubble and position data
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

  // Update chat bubble positions (project 3D to 2D)
  updateChatBubblePositions() {
    this.chatBubbles.forEach((bubble, playerId) => {
      const playerData = this.playerSprites.get(playerId);
      if (!playerData || !bubble.element) return;

      // Get world position above player
      const worldPos = playerData.group.position.clone();
      worldPos.y += GAME_CONFIG.view3d.playerSpriteSize + 1.5;

      // Project to screen coordinates
      const screenPos = worldPos.clone().project(this.camera);

      // Convert to CSS coordinates
      const x = (screenPos.x * 0.5 + 0.5) * this.container.clientWidth;
      const y = (-screenPos.y * 0.5 + 0.5) * this.container.clientHeight;

      // Check if in front of camera
      if (screenPos.z < 1) {
        bubble.element.style.display = 'block';
        bubble.element.style.left = `${x}px`;
        bubble.element.style.top = `${y}px`;
      } else {
        bubble.element.style.display = 'none';
      }
    });
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

  // Center view on position
  centerOn(lat, lng) {
    const worldPos = this.latLngToWorld(lat, lng);
    this.cameraController.setTarget(worldPos.x, 0, worldPos.z);
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
