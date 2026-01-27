// OSRS-Style Camera Controller
// Orbits around player position with rotation and zoom controls
class OSRSCamera {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    // Camera parameters
    this.target = new THREE.Vector3(0, 0, 0);
    this.distance = GAME_CONFIG.view3d.cameraDistance;
    this.angle = 0; // Horizontal rotation around target (radians)
    this.pitch = GAME_CONFIG.view3d.cameraPitch; // Vertical angle (radians, 0 = horizontal, PI/2 = top-down)

    // Control settings
    this.rotateSpeed = GAME_CONFIG.view3d.cameraRotateSpeed;
    this.zoomSpeed = GAME_CONFIG.view3d.cameraZoomSpeed;
    this.minDistance = GAME_CONFIG.view3d.cameraMinDistance;
    this.maxDistance = GAME_CONFIG.view3d.cameraMaxDistance;
    this.minPitch = 0.3; // ~17 degrees
    this.maxPitch = Math.PI / 2 - 0.1; // Almost top-down

    // Mouse state
    this.isRotating = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    // Key state for arrow key rotation
    this.keys = {
      left: false,
      right: false,
      up: false,
      down: false
    };

    this.bindEvents();
    this.update();
  }

  bindEvents() {
    // Mouse events for rotation (middle mouse button or right click + drag)
    this.domElement.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.domElement.addEventListener('mouseup', (e) => this.onMouseUp(e));
    this.domElement.addEventListener('mouseleave', (e) => this.onMouseUp(e));

    // Scroll wheel for zoom
    this.domElement.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

    // Keyboard for rotation
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
    document.addEventListener('keyup', (e) => this.onKeyUp(e));

    // Prevent context menu on right click
    this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  onMouseDown(e) {
    // Middle mouse button (1) or right mouse button (2)
    if (e.button === 1 || e.button === 2) {
      this.isRotating = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      e.preventDefault();
    }
  }

  onMouseMove(e) {
    if (!this.isRotating) return;

    const deltaX = e.clientX - this.lastMouseX;
    const deltaY = e.clientY - this.lastMouseY;

    // Horizontal rotation
    this.angle -= deltaX * this.rotateSpeed;

    // Vertical rotation (pitch)
    this.pitch += deltaY * this.rotateSpeed;
    this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));

    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;

    this.update();
  }

  onMouseUp(e) {
    if (e.button === 1 || e.button === 2) {
      this.isRotating = false;
    }
  }

  onWheel(e) {
    e.preventDefault();

    // Zoom in/out
    const delta = e.deltaY > 0 ? 1 : -1;
    this.distance += delta * this.zoomSpeed;
    this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance));

    this.update();
  }

  onKeyDown(e) {
    // Don't capture keys if user is typing in chat
    if (document.activeElement.tagName === 'INPUT') return;

    switch (e.key) {
      case 'ArrowLeft':
        this.keys.left = true;
        break;
      case 'ArrowRight':
        this.keys.right = true;
        break;
      case 'ArrowUp':
        this.keys.up = true;
        break;
      case 'ArrowDown':
        this.keys.down = true;
        break;
    }
  }

  onKeyUp(e) {
    switch (e.key) {
      case 'ArrowLeft':
        this.keys.left = false;
        break;
      case 'ArrowRight':
        this.keys.right = false;
        break;
      case 'ArrowUp':
        this.keys.up = false;
        break;
      case 'ArrowDown':
        this.keys.down = false;
        break;
    }
  }

  // Update camera position based on current parameters
  update() {
    // Handle keyboard rotation
    const keyRotateSpeed = 0.03;
    if (this.keys.left) {
      this.angle += keyRotateSpeed;
    }
    if (this.keys.right) {
      this.angle -= keyRotateSpeed;
    }
    if (this.keys.up) {
      this.pitch = Math.min(this.maxPitch, this.pitch + keyRotateSpeed);
    }
    if (this.keys.down) {
      this.pitch = Math.max(this.minPitch, this.pitch - keyRotateSpeed);
    }

    // Calculate camera position
    const horizontalDistance = this.distance * Math.cos(this.pitch);
    const verticalDistance = this.distance * Math.sin(this.pitch);

    this.camera.position.x = this.target.x + Math.sin(this.angle) * horizontalDistance;
    this.camera.position.z = this.target.z + Math.cos(this.angle) * horizontalDistance;
    this.camera.position.y = verticalDistance;

    this.camera.lookAt(this.target);
  }

  // Set the target position (player position)
  setTarget(x, y, z) {
    this.target.set(x, y || 0, z);
    this.update();
  }

  // Smoothly move target to new position
  moveTargetTo(x, y, z, duration = 0.3) {
    const startTarget = this.target.clone();
    const endTarget = new THREE.Vector3(x, y || 0, z);
    const startTime = performance.now();

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      this.target.lerpVectors(startTarget, endTarget, eased);
      this.update();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  // Get camera's forward direction (for click-to-move raycasting)
  getForwardDirection() {
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    return direction;
  }

  // Dispose event listeners
  dispose() {
    // Note: We can't easily remove anonymous functions
    // In production, we'd store references to the bound handlers
  }
}

// Export for use in other modules
window.OSRSCamera = OSRSCamera;
