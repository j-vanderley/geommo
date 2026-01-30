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

    // Center position (for coordinate conversion) - use default position
    this.centerLat = GAME_CONFIG.defaultPosition.lat;
    this.centerLng = GAME_CONFIG.defaultPosition.lng;

    // Animation
    this.animationId = null;

    // HTML overlays (chat bubbles and name labels)
    this.chatBubbles = new Map();
    this.nameLabels = new Map();

    // Dropped items on the ground
    this.droppedItems = new Map(); // id -> { sprite, group }

    // NPCs
    this.npcSprites = new Map(); // npcId -> { sprite, group, particles, nameLabel, healthBar }
    this.npcInteractionCallback = null;

    // Particle systems
    this.particleSystems = new Map(); // entityId -> particleSystem
  }

  async init() {
    try {
      // Check if container has valid dimensions
      if (!this.container.clientWidth || !this.container.clientHeight) {
        console.warn('Map3D: Container has no dimensions, waiting for layout...');
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Create scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x1a1a1a);

      // Create camera
      const aspect = this.container.clientWidth / this.container.clientHeight || 1;
      this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 2000);

      // Create renderer with error handling
      try {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
      } catch (webglError) {
        console.error('WebGL not available:', webglError);
        throw new Error('WebGL is required but not available');
      }

      this.renderer.setSize(this.container.clientWidth || 800, this.container.clientHeight || 600);
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

      // Load initial tiles at default position
      console.log('Map3D: Loading initial tiles at', this.centerLat, this.centerLng);
      this.tileManager.updateTiles(this.centerLat, this.centerLng);

      // Bind events
      this.bindEvents();

      // Start animation loop
      this.animate();

      console.log('Map3D: Initialization complete');
      return this;
    } catch (error) {
      console.error('Map3D initialization failed:', error);
      throw error;
    }
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

    // Update dropped items animation
    this.updateDroppedItems();

    // Update particle systems
    this.updateParticleSystems();

    // Update player aura particles
    this.updatePlayerAuras();

    // Update NPC overlays
    this.updateNPCOverlays();

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

  // Create a player sprite (custom avatar with text and color)
  createPlayerSprite(player, isSelf = false) {
    const avatar = player.avatar || { text: ':-)', color: '#ffb000' };
    const avatarText = avatar.text || player.flag || ':-)';
    const avatarColor = avatar.color || '#ffb000';
    const username = player.username || 'Unknown';
    const equipment = player.equipment || {};

    // Create a group to hold sprite and equipment
    const group = new THREE.Group();

    // Create canvas for avatar sprite
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Draw the player avatar with equipment
    this.drawPlayerCanvas(ctx, avatarText, avatarColor, equipment);

    // Create sprite texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;

    // Create sprite material
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true
    });

    // Create main sprite
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(
      GAME_CONFIG.view3d.playerSpriteSize,
      GAME_CONFIG.view3d.playerSpriteSize,
      1
    );
    sprite.position.y = GAME_CONFIG.view3d.playerSpriteSize / 2;
    group.add(sprite);

    // Create aura particle system if equipped
    let auraParticles = null;
    if (equipment.aura && window.skillsManager) {
      const auraData = window.skillsManager.equipmentTypes[equipment.aura];
      if (auraData && auraData.particle) {
        auraParticles = this.createPlayerAura(player.id, auraData.particle, auraData.color, group);
      }
    }

    // Position group
    const worldPos = this.latLngToWorld(player.position.lat, player.position.lng);
    group.position.set(worldPos.x, 0, worldPos.z);

    // Add to scene
    this.scene.add(group);

    // Create HTML name label (stays same size when zooming)
    const nameLabel = this.createNameLabel(player.id, username, isSelf, avatarColor);

    // Store reference
    this.playerSprites.set(player.id, {
      sprite, group, canvas, ctx, isSelf, nameLabel, avatarColor,
      equipment, auraParticles, texture
    });

    // If self, set camera target and load tiles
    if (isSelf) {
      this.selfPlayerId = player.id;
      this.setCenter(player.position.lat, player.position.lng);
      this.cameraController.setTarget(worldPos.x, 0, worldPos.z);
      this.tileManager.updateTiles(player.position.lat, player.position.lng);
    }

    return group;
  }

  // Draw player avatar with equipment on canvas
  drawPlayerCanvas(ctx, avatarText, avatarColor, equipment) {
    const skillsManager = window.skillsManager;

    // Clear canvas
    ctx.clearRect(0, 0, 128, 128);

    // Get skin data if equipped
    const skinData = equipment.skin && skillsManager ?
      skillsManager.equipmentTypes[equipment.skin] : null;
    const skinColor = skinData ? skinData.color : null;

    // Draw circular background (skin changes the color)
    ctx.beginPath();
    ctx.arc(64, 64, 56, 0, Math.PI * 2);
    if (skinData) {
      // Skin equipped - use gradient with skin color
      const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 56);
      gradient.addColorStop(0, this.hexToRgba(skinColor, 0.9));
      gradient.addColorStop(0.7, this.hexToRgba(skinColor, 0.5));
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    }
    ctx.fill();

    // Draw border with player's color (or skin color)
    ctx.strokeStyle = skinColor || avatarColor;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Draw hat if equipped (above avatar)
    if (equipment.hat && skillsManager) {
      const hatData = skillsManager.equipmentTypes[equipment.hat];
      if (hatData) {
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = hatData.color;
        ctx.fillText(hatData.icon, 64, 22);
      }
    }

    // Draw avatar text in center
    const fontSize = avatarText.length <= 2 ? 40 : avatarText.length === 3 ? 32 : 24;
    ctx.font = `bold ${fontSize}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = skinColor || avatarColor;
    ctx.fillText(avatarText, 64, 64);

    // Draw held item if equipped (to the right)
    if (equipment.held && skillsManager) {
      const heldData = skillsManager.equipmentTypes[equipment.held];
      if (heldData) {
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = heldData.color;
        ctx.fillText(heldData.icon, 100, 80);
      }
    }

    // Draw skin icon if equipped (bottom left indicator)
    if (skinData) {
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = skinData.color;
      ctx.fillText(skinData.icon, 28, 100);
    }
  }

  // Create aura particle effect for player
  createPlayerAura(playerId, particleType, color, group) {
    const particleCount = 20;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const colorObj = new THREE.Color(color);

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 1.5 + Math.random() * 0.5;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.random() * 3 + 1;
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      colors[i * 3] = colorObj.r;
      colors[i * 3 + 1] = colorObj.g;
      colors[i * 3 + 2] = colorObj.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);
    particles.userData = { type: particleType, playerId, time: 0 };
    group.add(particles);

    return particles;
  }

  // Update player equipment visuals
  updatePlayerEquipment(playerId, equipment) {
    const playerData = this.playerSprites.get(playerId);
    if (!playerData) return;

    // Store new equipment
    playerData.equipment = equipment;

    // Redraw the canvas with new equipment
    const avatar = playerData.isSelf && window.game?.selectedAvatar ?
      window.game.selectedAvatar : { text: ':-)', color: playerData.avatarColor };
    this.drawPlayerCanvas(playerData.ctx, avatar.text, avatar.color, equipment);

    // Update texture
    playerData.texture.needsUpdate = true;

    // Handle aura changes
    if (playerData.auraParticles) {
      playerData.group.remove(playerData.auraParticles);
      playerData.auraParticles.geometry.dispose();
      playerData.auraParticles.material.dispose();
      playerData.auraParticles = null;
    }

    if (equipment.aura && window.skillsManager) {
      const auraData = window.skillsManager.equipmentTypes[equipment.aura];
      if (auraData && auraData.particle) {
        playerData.auraParticles = this.createPlayerAura(playerId, auraData.particle, auraData.color, playerData.group);
      }
    }

    console.log(`Updated equipment for player ${playerId}:`, equipment);
  }

  // Create HTML name label (like chat bubbles, stays same size)
  createNameLabel(playerId, name, isSelf = false, color = '#ffb000') {
    const label = document.createElement('div');
    label.className = 'player-name-label' + (isSelf ? ' self' : '');
    label.textContent = name;

    // Apply player's color
    if (!isSelf) {
      label.style.color = color;
      label.style.borderColor = color;
    }

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

  // Update player's avatar (text and color)
  updatePlayerAvatar(playerId, avatar) {
    const playerData = this.playerSprites.get(playerId);
    if (!playerData) return;

    const { ctx, sprite, isSelf, nameLabel } = playerData;
    const avatarText = avatar.text || ':-)';
    const avatarColor = avatar.color || '#ffb000';

    // Update stored color
    playerData.avatarColor = avatarColor;

    // Redraw canvas
    ctx.clearRect(0, 0, 128, 128);

    // Draw circular background
    ctx.beginPath();
    ctx.arc(64, 64, 56, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fill();

    // Draw border with player's color
    ctx.strokeStyle = avatarColor;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Draw avatar text
    const fontSize = avatarText.length <= 2 ? 48 : avatarText.length === 3 ? 36 : 28;
    ctx.font = `bold ${fontSize}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = avatarColor;
    ctx.fillText(avatarText, 64, 66);

    // Update texture
    sprite.material.map.needsUpdate = true;

    // Update name label color
    if (nameLabel && !isSelf) {
      nameLabel.style.color = avatarColor;
      nameLabel.style.borderColor = avatarColor;
    }
  }

  // Legacy: Update player's flag
  updatePlayerFlag(playerId, flag) {
    this.updatePlayerAvatar(playerId, { text: flag, color: '#ffb000' });
  }

  // Update player's display name
  updatePlayerName(playerId, newName) {
    const labelData = this.nameLabels.get(playerId);
    if (labelData && labelData.element) {
      labelData.element.textContent = newName;
    }
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

  // Fast travel to a location - resets coordinate system to keep world coordinates small
  fastTravelTo(lat, lng) {
    console.log(`Fast travel to: ${lat}, ${lng}`);

    // 1. Update coordinate center (affects lat/lng <-> world conversion)
    this.centerLat = lat;
    this.centerLng = lng;

    // 2. Clear old tiles and load new ones at new center
    this.tileManager.setCenter(lat, lng);
    this.tileManager.updateTiles(lat, lng);

    // 3. Move self player to origin (since they're now at the center lat/lng)
    if (this.selfPlayerId) {
      const playerData = this.playerSprites.get(this.selfPlayerId);
      if (playerData) {
        playerData.group.position.set(0, 0, 0);
      }
    }

    // 4. Move camera to origin
    this.cameraController.setTarget(0, 0, 0);

    // 5. Reposition all NPCs relative to new center
    for (const [npcId, npcData] of this.npcSprites) {
      if (npcData.latLng) {
        const worldPos = this.latLngToWorld(npcData.latLng.lat, npcData.latLng.lng);
        npcData.group.position.set(worldPos.x, 0, worldPos.z);
        console.log(`NPC ${npcId} repositioned to world: ${worldPos.x.toFixed(0)}, ${worldPos.z.toFixed(0)}`);
      }
    }

    return { lat, lng };
  }

  // Create a dropped item sprite on the ground
  createDroppedItem(id, item, position) {
    // Create canvas for item sprite
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Draw glowing background
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 100, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 200, 50, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 150, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    // Draw item icon
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(item.icon, 32, 32);

    // Create sprite texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;

    // Create sprite material
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true
    });

    // Create sprite - larger size for visibility
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(4, 4, 1); // Even larger for better visibility
    sprite.position.y = 50; // Start high in the sky for fall animation

    // Create group
    const group = new THREE.Group();
    group.add(sprite);

    // Position in world
    const worldPos = this.latLngToWorld(position.lat, position.lng);
    group.position.set(worldPos.x, 0, worldPos.z);

    // Add falling animation data
    group.userData = {
      baseY: 1.5,
      bobOffset: Math.random() * Math.PI * 2,
      falling: true,
      fallStartTime: performance.now(),
      fallDuration: 1500, // 1.5 seconds to fall
      bounceCount: 0
    };

    // Add to scene
    this.scene.add(group);

    // Store reference
    this.droppedItems.set(id, { sprite, group, canvas });

    return group;
  }

  // Remove a dropped item
  removeDroppedItem(id) {
    const itemData = this.droppedItems.get(id);
    if (!itemData) return;

    // Remove from scene
    this.scene.remove(itemData.group);

    // Dispose resources
    itemData.sprite.material.map.dispose();
    itemData.sprite.material.dispose();

    this.droppedItems.delete(id);
  }

  // Update dropped items (falling + bobbing animation) - called in animate loop
  updateDroppedItems() {
    const time = performance.now();
    const timeSec = time / 1000;

    this.droppedItems.forEach((itemData) => {
      if (itemData.group && itemData.group.userData) {
        const userData = itemData.group.userData;
        const sprite = itemData.group.children[0];

        if (userData.falling) {
          // Falling animation
          const elapsed = time - userData.fallStartTime;
          const progress = Math.min(elapsed / userData.fallDuration, 1);

          // Easing for natural fall (accelerate down)
          const fallEase = progress * progress;
          const startY = 50;
          const groundY = userData.baseY;

          if (progress < 1) {
            // Still falling
            sprite.position.y = startY - (startY - groundY) * fallEase;
          } else {
            // Landed - do bounce
            const bounceTime = elapsed - userData.fallDuration;
            const bounceDuration = 300; // 300ms per bounce
            const bounceHeight = Math.max(0, 3 - userData.bounceCount * 1.5); // Decreasing bounce height

            if (bounceHeight > 0.2 && bounceTime < bounceDuration) {
              // Bouncing up and down
              const bounceProgress = bounceTime / bounceDuration;
              const bounceEase = Math.sin(bounceProgress * Math.PI);
              sprite.position.y = groundY + bounceHeight * bounceEase;
            } else if (bounceHeight > 0.2) {
              // Start next bounce
              userData.bounceCount++;
              userData.fallStartTime = time - userData.fallDuration;
            } else {
              // Done bouncing - switch to bobbing
              userData.falling = false;
              sprite.position.y = groundY;
            }
          }
        } else {
          // Normal bobbing animation
          const bobOffset = userData.bobOffset || 0;
          sprite.position.y = userData.baseY + Math.sin(timeSec * 2 + bobOffset) * 0.3;
        }

        // Slow spin always
        sprite.material.rotation += 0.015;
      }
    });
  }

  // Create an NPC sprite
  createNPC(npc, position) {
    // Get equipment data for the NPC
    const equipment = window.skillsManager?.equipmentTypes[npc.equipment];
    const aura = window.skillsManager?.equipmentTypes[npc.equippedAura];
    const color = npc.color || '#ff6600';

    // Create a group for the NPC
    const group = new THREE.Group();

    // Create canvas for NPC sprite
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Draw glowing circular background
    const gradient = ctx.createRadialGradient(64, 64, 20, 64, 64, 60);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.5, this.hexToRgba(color, 0.6));
    gradient.addColorStop(1, this.hexToRgba(color, 0.2));
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(64, 64, 56, 0, Math.PI * 2);
    ctx.fill();

    // Draw border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw NPC icon (use NPC's own icon, fallback to equipment icon)
    const icon = npc.icon || equipment?.icon || '👤';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(icon, 64, 64);

    // Create sprite texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;

    // Create sprite
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(6, 6, 1); // Larger than players
    sprite.position.y = 3;
    group.add(sprite);

    // Position group
    const worldPos = this.latLngToWorld(position.lat, position.lng);
    group.position.set(worldPos.x, 0, worldPos.z);

    // Add to scene
    this.scene.add(group);

    // Create particle system for aura
    let particles = null;
    if (aura && aura.particle) {
      particles = this.createParticleSystem(npc.id, aura.particle, color, group);
    }

    // Create NPC name label
    const nameLabel = this.createNPCLabel(npc.id, npc.name, npc.title, color);

    // Create health bar
    const healthBar = this.createNPCHealthBar(npc.id);

    // Store reference (include lat/lng for repositioning on fast travel)
    this.npcSprites.set(npc.id, {
      sprite, group, canvas, ctx, particles, nameLabel, healthBar, npc,
      health: npc.health, maxHealth: npc.maxHealth,
      latLng: { lat: position.lat, lng: position.lng }
    });

    // Make NPC clickable
    group.userData = { type: 'npc', npcId: npc.id };

    return group;
  }

  // Create NPC name label
  createNPCLabel(npcId, name, title, color) {
    const label = document.createElement('div');
    label.className = 'npc-name-label';
    label.innerHTML = `<span class="npc-name">${name}</span><span class="npc-title">${title}</span>`;
    label.style.color = color;
    label.style.borderColor = color;
    this.container.appendChild(label);
    return label;
  }

  // Create NPC health bar
  createNPCHealthBar(npcId) {
    const bar = document.createElement('div');
    bar.className = 'npc-health-bar';
    bar.innerHTML = `<div class="npc-health-fill" style="width: 100%"></div>`;
    this.container.appendChild(bar);
    return bar;
  }

  // Update NPC health display
  updateNPCHealth(npcId, health, maxHealth) {
    const npcData = this.npcSprites.get(npcId);
    if (!npcData) return;

    npcData.health = health;
    const percent = (health / maxHealth) * 100;
    const fill = npcData.healthBar.querySelector('.npc-health-fill');
    if (fill) {
      fill.style.width = `${percent}%`;
      // Color based on health
      if (percent > 60) fill.style.background = '#4CAF50';
      else if (percent > 30) fill.style.background = '#ffcc00';
      else fill.style.background = '#f44336';
    }
  }

  // Show combat visual effect (attack particles and damage numbers)
  showCombatEffect(type, npcId, icon, damage) {
    const npcData = this.npcSprites.get(npcId);
    if (!npcData) return;

    // Get self player position
    const selfPlayerData = this.selfPlayerId ? this.playerSprites.get(this.selfPlayerId) : null;
    if (!selfPlayerData) return;

    const npcPosition = npcData.group.position.clone();
    const playerPosition = selfPlayerData.group.position.clone();

    if (type === 'player_attack') {
      // Player attacking NPC - projectile from player to NPC
      this.createAttackProjectile(playerPosition, npcPosition, icon, '#ffff00');
      // Show damage number on NPC
      setTimeout(() => {
        this.showDamageNumber(npcPosition, damage, '#ff4444');
      }, 300);
    } else if (type === 'npc_attack') {
      // NPC attacking player - projectile from NPC to player
      this.createAttackProjectile(npcPosition, playerPosition, icon, npcData.npc.color || '#ff0000');
      // Show damage number on player
      setTimeout(() => {
        this.showDamageNumber(playerPosition, damage, '#ff0000');
      }, 300);
    }
  }

  // Create attack projectile that travels from source to target
  createAttackProjectile(from, to, icon, color) {
    // Create a simple sprite projectile
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Draw glow
    const gradient = ctx.createRadialGradient(32, 32, 5, 32, 32, 30);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.5, this.hexToRgba(color, 0.5));
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    // Draw icon
    ctx.font = '32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(icon, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(2, 2, 1);
    sprite.position.copy(from);
    sprite.position.y += 2;

    this.scene.add(sprite);

    // Animate projectile
    const startPos = from.clone();
    startPos.y += 2;
    const endPos = to.clone();
    endPos.y += 2;

    const duration = 300; // ms
    const startTime = Date.now();

    const animateProjectile = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Lerp position
      sprite.position.lerpVectors(startPos, endPos, progress);

      // Add some arc
      sprite.position.y += Math.sin(progress * Math.PI) * 2;

      if (progress < 1) {
        requestAnimationFrame(animateProjectile);
      } else {
        // Remove projectile and show impact
        this.scene.remove(sprite);
        material.dispose();
        texture.dispose();
        this.createImpactEffect(endPos, color);
      }
    };

    animateProjectile();
  }

  // Create impact particle effect
  createImpactEffect(position, color) {
    const particleCount = 15;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;

      // Random outward velocity
      velocities.push({
        x: (Math.random() - 0.5) * 0.3,
        y: Math.random() * 0.2,
        z: (Math.random() - 0.5) * 0.3
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: new THREE.Color(color),
      size: 0.3,
      transparent: true,
      opacity: 1
    });

    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);

    // Animate particles
    const startTime = Date.now();
    const duration = 500;

    const animateParticles = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress < 1) {
        const posArray = particles.geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
          posArray[i * 3] += velocities[i].x;
          posArray[i * 3 + 1] += velocities[i].y;
          posArray[i * 3 + 2] += velocities[i].z;
          velocities[i].y -= 0.01; // gravity
        }
        particles.geometry.attributes.position.needsUpdate = true;
        material.opacity = 1 - progress;

        requestAnimationFrame(animateParticles);
      } else {
        this.scene.remove(particles);
        geometry.dispose();
        material.dispose();
      }
    };

    animateParticles();
  }

  // Show floating damage number
  showDamageNumber(position, damage, color) {
    const damageEl = document.createElement('div');
    damageEl.className = 'damage-number';
    damageEl.textContent = `-${damage}`;
    damageEl.style.color = color;
    this.container.appendChild(damageEl);

    // Position the element
    const updatePosition = () => {
      const screenPos = this.worldToScreen(position.x, position.y + 3, position.z);
      if (screenPos) {
        damageEl.style.left = `${screenPos.x}px`;
        damageEl.style.top = `${screenPos.y}px`;
      }
    };

    updatePosition();

    // Animate upward and fade
    let offset = 0;
    const startTime = Date.now();
    const duration = 1000;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress < 1) {
        offset = progress * 50;
        damageEl.style.transform = `translate(-50%, -${offset}px)`;
        damageEl.style.opacity = 1 - progress;
        requestAnimationFrame(animate);
      } else {
        damageEl.remove();
      }
    };

    animate();
  }

  // Convert world position to screen position
  worldToScreen(x, y, z) {
    const vector = new THREE.Vector3(x, y, z);
    vector.project(this.camera);

    const halfWidth = this.container.clientWidth / 2;
    const halfHeight = this.container.clientHeight / 2;

    return {
      x: (vector.x * halfWidth) + halfWidth,
      y: -(vector.y * halfHeight) + halfHeight
    };
  }

  // Remove NPC
  removeNPC(npcId) {
    const npcData = this.npcSprites.get(npcId);
    if (!npcData) return;

    this.scene.remove(npcData.group);
    npcData.sprite.material.map.dispose();
    npcData.sprite.material.dispose();

    // Remove particles
    if (npcData.particles) {
      this.removeParticleSystem(npcId);
    }

    // Remove labels
    if (npcData.nameLabel && npcData.nameLabel.parentElement) {
      npcData.nameLabel.parentElement.removeChild(npcData.nameLabel);
    }
    if (npcData.healthBar && npcData.healthBar.parentElement) {
      npcData.healthBar.parentElement.removeChild(npcData.healthBar);
    }

    this.npcSprites.delete(npcId);
  }

  // Create particle system
  createParticleSystem(entityId, type, color, parentGroup) {
    const particleCount = 30;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const velocities = [];

    // Parse color
    const colorObj = new THREE.Color(color);

    for (let i = 0; i < particleCount; i++) {
      // Random position around center
      const angle = Math.random() * Math.PI * 2;
      const radius = 1 + Math.random() * 2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.random() * 4;
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      // Color variation
      colors[i * 3] = colorObj.r * (0.8 + Math.random() * 0.2);
      colors[i * 3 + 1] = colorObj.g * (0.8 + Math.random() * 0.2);
      colors[i * 3 + 2] = colorObj.b * (0.8 + Math.random() * 0.2);

      sizes[i] = 0.2 + Math.random() * 0.3;

      // Velocity based on particle type
      velocities.push({
        x: (Math.random() - 0.5) * 0.02,
        y: type === 'fire' || type === 'holy' ? 0.02 + Math.random() * 0.02 : (Math.random() - 0.5) * 0.01,
        z: (Math.random() - 0.5) * 0.02
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);
    parentGroup.add(particles);

    // Store particle system data
    this.particleSystems.set(entityId, {
      points: particles,
      velocities: velocities,
      type: type,
      parent: parentGroup
    });

    return particles;
  }

  // Update particle systems
  updateParticleSystems() {
    this.particleSystems.forEach((system, entityId) => {
      const positions = system.points.geometry.attributes.position;
      const velocities = system.velocities;

      for (let i = 0; i < positions.count; i++) {
        positions.array[i * 3] += velocities[i].x;
        positions.array[i * 3 + 1] += velocities[i].y;
        positions.array[i * 3 + 2] += velocities[i].z;

        // Reset particle if too far
        const y = positions.array[i * 3 + 1];
        if (y > 6 || y < 0) {
          const angle = Math.random() * Math.PI * 2;
          const radius = 1 + Math.random() * 2;
          positions.array[i * 3] = Math.cos(angle) * radius;
          positions.array[i * 3 + 1] = Math.random() * 2;
          positions.array[i * 3 + 2] = Math.sin(angle) * radius;
        }
      }

      positions.needsUpdate = true;
    });
  }

  // Remove particle system
  removeParticleSystem(entityId) {
    const system = this.particleSystems.get(entityId);
    if (!system) return;

    system.parent.remove(system.points);
    system.points.geometry.dispose();
    system.points.material.dispose();
    this.particleSystems.delete(entityId);
  }

  // Update player aura particles
  updatePlayerAuras() {
    const time = performance.now() * 0.001;

    for (const [playerId, playerData] of this.playerSprites) {
      if (!playerData.auraParticles) continue;

      const positions = playerData.auraParticles.geometry.attributes.position;
      const particleType = playerData.auraParticles.userData.type;

      for (let i = 0; i < positions.count; i++) {
        const baseAngle = (i / positions.count) * Math.PI * 2;
        const angle = baseAngle + time * 0.5;
        const radius = 1.5 + Math.sin(time * 2 + i) * 0.3;

        positions.array[i * 3] = Math.cos(angle) * radius;
        positions.array[i * 3 + 1] = 1 + Math.sin(time * 3 + i * 0.5) * 1.5 + 1;
        positions.array[i * 3 + 2] = Math.sin(angle) * radius;
      }

      positions.needsUpdate = true;
    }
  }

  // Update player cosmetics (visual appearance)
  updatePlayerCosmetics(playerId, cosmeticsData) {
    const playerData = this.playerSprites.get(playerId);
    if (!playerData) return;

    const { ctx, sprite, isSelf, group } = playerData;

    // Get base avatar data
    const player = window.playerManager?.getPlayer(playerId);
    const avatar = player?.avatar || { text: ':-)', color: '#ffb000' };
    let avatarText = avatar.text;
    let avatarColor = avatar.color;

    // Apply skin cosmetic (changes color/icon)
    if (cosmeticsData.skin) {
      avatarColor = cosmeticsData.skin.color;
      avatarText = cosmeticsData.skin.icon;
    }

    // Redraw canvas with cosmetics
    ctx.clearRect(0, 0, 128, 128);

    // Draw circular background
    ctx.beginPath();
    ctx.arc(64, 64, 56, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fill();

    // Draw border with color
    ctx.strokeStyle = avatarColor;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Draw hat if equipped (above avatar)
    if (cosmeticsData.hat) {
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = cosmeticsData.hat.color;
      ctx.fillText(cosmeticsData.hat.icon, 64, 25);
    }

    // Draw main avatar
    const fontSize = avatarText.length <= 2 ? 48 : avatarText.length === 3 ? 36 : 28;
    ctx.font = `bold ${fontSize}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = avatarColor;
    ctx.fillText(avatarText, 64, 66);

    // Draw held item if equipped (to the side)
    if (cosmeticsData.held) {
      ctx.font = 'bold 20px Arial';
      ctx.fillStyle = cosmeticsData.held.color;
      ctx.fillText(cosmeticsData.held.icon, 100, 80);
    }

    // Update texture
    sprite.material.map.needsUpdate = true;

    // Update or create aura particle system
    if (cosmeticsData.aura) {
      // Remove existing particles
      this.removeParticleSystem(playerId);
      // Create new particle system
      this.createParticleSystem(playerId, cosmeticsData.aura.particle, cosmeticsData.aura.color, group);
    } else {
      // Remove particles if aura unequipped
      this.removeParticleSystem(playerId);
    }
  }

  // Helper: Convert hex to rgba
  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // Set NPC interaction callback
  setNPCInteractionCallback(callback) {
    this.npcInteractionCallback = callback;
  }

  // Check if click hit an NPC
  checkNPCClick(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Check NPCs
    for (const [npcId, npcData] of this.npcSprites) {
      const intersects = this.raycaster.intersectObject(npcData.sprite);
      if (intersects.length > 0) {
        return npcId;
      }
    }
    return null;
  }

  // Update NPC overlay positions
  updateNPCOverlays() {
    this.npcSprites.forEach((npcData, npcId) => {
      if (!npcData.nameLabel || !npcData.healthBar) return;

      const worldPos = npcData.group.position.clone();

      // Name label position (above NPC)
      const nameLabelPos = worldPos.clone();
      nameLabelPos.y += 8;
      const screenPos = nameLabelPos.project(this.camera);
      const x = (screenPos.x * 0.5 + 0.5) * this.container.clientWidth;
      const y = (-screenPos.y * 0.5 + 0.5) * this.container.clientHeight;

      if (screenPos.z < 1) {
        npcData.nameLabel.style.display = 'block';
        npcData.nameLabel.style.left = `${x}px`;
        npcData.nameLabel.style.top = `${y}px`;

        npcData.healthBar.style.display = 'block';
        npcData.healthBar.style.left = `${x}px`;
        npcData.healthBar.style.top = `${y + 35}px`;
      } else {
        npcData.nameLabel.style.display = 'none';
        npcData.healthBar.style.display = 'none';
      }
    });
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

    // Remove dropped items
    this.droppedItems.forEach((_, id) => this.removeDroppedItem(id));

    // Remove NPCs
    this.npcSprites.forEach((_, id) => this.removeNPC(id));

    // Remove particle systems
    this.particleSystems.forEach((_, id) => this.removeParticleSystem(id));

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
