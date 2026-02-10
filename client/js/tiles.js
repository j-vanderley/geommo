// Tile Loading System - OpenStreetMap/Satellite tiles on ground plane
class TileManager {
  constructor() {
    this.tiles = new Map(); // key: "z_x_y" -> { mesh, overlayMesh, loading, texture, overlayTexture, loadGeneration }
    this.zoom = GAME_CONFIG.view3d.tileZoom;
    this.tilesPerSide = GAME_CONFIG.view3d.tilesPerSide;
    this.scene = null;
    this.centerLat = 0;
    this.centerLng = 0;
    this.isInitialized = false;

    // Load generation - increments on each fast travel to cancel stale loads
    this.loadGeneration = 0;

    // Calculate world scale: how many world units per degree of latitude
    // This determines the overall scale of the 3D world
    this.worldScale = GAME_CONFIG.view3d.worldScale;

    // Track tile meshes by unique ID for cleanup
    this.tileMeshIds = new Set();

    // Satellite blend (0 = streets only, 1 = satellite only, between = hybrid)
    const savedBlend = localStorage.getItem('geommo_satelliteBlend');
    this.satelliteBlend = savedBlend !== null ? parseFloat(savedBlend) : 0;
  }

  // Get current effective mode based on blend value
  getEffectiveMode() {
    if (this.satelliteBlend <= 0) return 'streets';
    if (this.satelliteBlend >= 1) return 'satellite';
    return 'hybrid';
  }

  // Set satellite blend (0-1) and reload tiles if mode changes
  setSatelliteBlend(blend) {
    const oldMode = this.getEffectiveMode();
    this.satelliteBlend = Math.max(0, Math.min(1, blend));
    localStorage.setItem('geommo_satelliteBlend', this.satelliteBlend.toString());
    const newMode = this.getEffectiveMode();

    // If mode changed (streets<->hybrid<->satellite), reload tiles
    if (oldMode !== newMode) {
      this.reloadAllTiles();
    } else if (newMode === 'hybrid') {
      // Just update opacity of existing overlay meshes
      for (const [key, tile] of this.tiles.entries()) {
        if (tile.overlayMesh && tile.overlayMesh.material) {
          tile.overlayMesh.material.opacity = this.satelliteBlend;
        }
      }
    }
  }

  // Reload all tiles (used when switching map modes)
  reloadAllTiles() {
    // Store current tile positions
    const tilePositions = [];
    for (const [key, tile] of this.tiles.entries()) {
      const [z, x, y] = key.split('_').map(Number);
      tilePositions.push({ x, y, z });
    }

    // Clear all tiles
    this.clearAllTiles();

    // Increment generation
    this.loadGeneration++;

    // Reload tiles at same positions
    const currentGen = this.loadGeneration;
    for (const pos of tilePositions) {
      this.loadTileForMode(pos.x, pos.y, pos.z, currentGen);
    }
  }

  // Load tile(s) based on current blend mode
  async loadTileForMode(tileX, tileY, zoom, currentGen) {
    const key = `${zoom}_${tileX}_${tileY}`;
    const mode = this.getEffectiveMode();

    if (mode === 'hybrid') {
      // Load both street and satellite for hybrid mode
      try {
        const [streetTexture, satTexture] = await Promise.all([
          this.loadTileTexture(tileX, tileY, zoom, 'streets'),
          this.loadTileTexture(tileX, tileY, zoom, 'satellite')
        ]);

        if (this.loadGeneration !== currentGen) {
          streetTexture.dispose();
          satTexture.dispose();
          return;
        }

        const baseMesh = this.createTileMesh(tileX, tileY, zoom, streetTexture, false);
        const overlayMesh = this.createTileMesh(tileX, tileY, zoom, satTexture, true);

        this.scene.add(baseMesh);
        this.scene.add(overlayMesh);

        this.tiles.set(key, {
          mesh: baseMesh,
          overlayMesh: overlayMesh,
          texture: streetTexture,
          overlayTexture: satTexture,
          loading: false,
          loadGeneration: currentGen
        });
      } catch (err) {
        console.warn(`Failed to load hybrid tile ${key}:`, err);
      }
    } else {
      // Single layer mode (streets or satellite)
      try {
        const tileType = mode === 'satellite' ? 'satellite' : 'streets';
        const texture = await this.loadTileTexture(tileX, tileY, zoom, tileType);

        if (this.loadGeneration !== currentGen) {
          texture.dispose();
          return;
        }

        const mesh = this.createTileMesh(tileX, tileY, zoom, texture);
        this.scene.add(mesh);

        this.tiles.set(key, {
          mesh,
          texture,
          loading: false,
          loadGeneration: currentGen
        });
      } catch (err) {
        console.warn(`Failed to load tile ${key}:`, err);
      }
    }
  }

  setScene(scene) {
    this.scene = scene;
  }

  // Set new center point (call before updateTiles when fast traveling)
  setCenter(lat, lng) {
    // Clear all existing tiles first
    this.clearAllTiles();

    // Update center
    this.centerLat = lat;
    this.centerLng = lng;
    this.isInitialized = true;

    // Increment generation to invalidate any in-flight tile loads
    this.loadGeneration++;
  }

  // Clear all tiles from scene and memory
  clearAllTiles() {
    // First, remove all tracked tiles
    for (const [key, tile] of this.tiles.entries()) {
      if (tile.mesh) {
        this.scene.remove(tile.mesh);
        tile.mesh.geometry.dispose();
        tile.mesh.material.dispose();
      }
      if (tile.overlayMesh) {
        this.scene.remove(tile.overlayMesh);
        tile.overlayMesh.geometry.dispose();
        tile.overlayMesh.material.dispose();
      }
      if (tile.texture) {
        tile.texture.dispose();
      }
      if (tile.overlayTexture) {
        tile.overlayTexture.dispose();
      }
    }
    this.tiles.clear();

    // Also scan scene for any orphaned tile meshes and remove them
    if (this.scene) {
      const toRemove = [];
      this.scene.traverse((obj) => {
        if (obj.userData && obj.userData.isTileMesh) {
          toRemove.push(obj);
        }
      });
      for (const mesh of toRemove) {
        this.scene.remove(mesh);
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (mesh.material.map) mesh.material.map.dispose();
          mesh.material.dispose();
        }
      }
    }
  }

  // Standard Web Mercator: lat/lng to tile coordinates
  latLngToTileCoords(lat, lng, zoom) {
    const n = Math.pow(2, zoom);
    const x = Math.floor((lng + 180) / 360 * n);
    const latRad = lat * Math.PI / 180;
    const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
    return { x, y };
  }

  // Tile coordinates to lat/lng (top-left corner of tile)
  tileCoordsToLatLng(x, y, zoom) {
    const n = Math.pow(2, zoom);
    const lng = x / n * 360 - 180;
    const latRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n)));
    const lat = latRad * 180 / Math.PI;
    return { lat, lng };
  }

  // Get the bounds of a tile in lat/lng
  getTileBounds(tileX, tileY, zoom) {
    const topLeft = this.tileCoordsToLatLng(tileX, tileY, zoom);
    const bottomRight = this.tileCoordsToLatLng(tileX + 1, tileY + 1, zoom);
    return {
      north: topLeft.lat,
      south: bottomRight.lat,
      west: topLeft.lng,
      east: bottomRight.lng
    };
  }

  // Get tile URL - type can be 'streets', 'satellite', or auto (uses mapMode)
  getTileUrl(tileX, tileY, zoom, type = null) {
    const tileType = type || this.mapMode;
    if (tileType === 'satellite' || tileType === 'hybrid') {
      // For hybrid, this returns satellite URL (streets is loaded separately)
      if (type === 'streets') {
        const subdomains = ['a', 'b', 'c'];
        const subdomain = subdomains[Math.abs(tileX + tileY) % subdomains.length];
        return `https://${subdomain}.tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`;
      }
      // ESRI World Imagery - free satellite tiles
      return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${tileY}/${tileX}`;
    } else {
      // OpenStreetMap - street map tiles
      const subdomains = ['a', 'b', 'c'];
      const subdomain = subdomains[Math.abs(tileX + tileY) % subdomains.length];
      return `https://${subdomain}.tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`;
    }
  }

  // Load tile texture - type can be 'streets' or 'satellite'
  loadTileTexture(tileX, tileY, zoom, type = null) {
    return new Promise((resolve) => {
      const url = this.getTileUrl(tileX, tileY, zoom, type);
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const texture = new THREE.Texture(img);
        texture.needsUpdate = true;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        resolve(texture);
      };

      img.onerror = () => {
        // Create fallback gray texture
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#444444';
        ctx.fillRect(0, 0, 256, 256);
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 256; i += 32) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, 256);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, i);
          ctx.lineTo(256, i);
          ctx.stroke();
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        resolve(texture);
      };

      img.src = url;
    });
  }

  // Convert lat/lng to world position
  latLngToWorld(lat, lng) {
    const x = (lng - this.centerLng) * this.worldScale * Math.cos(this.centerLat * Math.PI / 180);
    const z = (this.centerLat - lat) * this.worldScale;
    return { x, z };
  }

  // Create mesh for a tile - positioned and sized to match its geographic bounds
  // isOverlay: if true, creates a transparent overlay mesh slightly above base
  createTileMesh(tileX, tileY, zoom, texture, isOverlay = false) {
    const bounds = this.getTileBounds(tileX, tileY, zoom);

    // Convert tile corners to world coordinates
    const topLeft = this.latLngToWorld(bounds.north, bounds.west);
    const bottomRight = this.latLngToWorld(bounds.south, bounds.east);

    // Calculate tile size in world units
    const width = bottomRight.x - topLeft.x;
    const height = bottomRight.z - topLeft.z;

    // Calculate tile center in world units
    const centerX = (topLeft.x + bottomRight.x) / 2;
    const centerZ = (topLeft.z + bottomRight.z) / 2;

    const geometry = new THREE.PlaneGeometry(width, height);

    let material;
    if (isOverlay) {
      // Transparent overlay for hybrid mode - satellite layer
      material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.FrontSide,
        transparent: true,
        opacity: this.satelliteBlend,
        depthWrite: false // Prevent z-fighting with base layer
      });
    } else {
      material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.FrontSide
      });
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2; // Lay flat

    // Position tiles BELOW ground level so they don't intersect with entities
    // Base layer at y = -0.2, overlay at y = -0.1 (both below entity level at y >= 0)
    const yPos = isOverlay ? -0.1 : -0.2;
    mesh.position.set(centerX, yPos, centerZ);

    // Set render order so tiles render first (behind everything else)
    mesh.renderOrder = isOverlay ? -1 : -2;

    // Mark as tile mesh for cleanup
    mesh.userData.isTileMesh = true;
    mesh.userData.isOverlay = isOverlay;
    mesh.userData.tileKey = `${zoom}_${tileX}_${tileY}`;

    return mesh;
  }

  // Update tiles around player position
  async updateTiles(playerLat, playerLng) {
    if (!this.scene) return;

    // Set center on first call
    if (!this.isInitialized) {
      this.centerLat = playerLat;
      this.centerLng = playerLng;
      this.isInitialized = true;
    }

    const currentGeneration = this.loadGeneration;
    const halfTiles = Math.floor(this.tilesPerSide / 2);
    const baseTile = this.latLngToTileCoords(playerLat, playerLng, this.zoom);
    const neededTiles = new Set();

    // Load tiles in grid around player
    for (let dx = -halfTiles; dx <= halfTiles; dx++) {
      for (let dy = -halfTiles; dy <= halfTiles; dy++) {
        const tileX = baseTile.x + dx;
        const tileY = baseTile.y + dy;
        const key = `${this.zoom}_${tileX}_${tileY}`;
        neededTiles.add(key);

        // Skip if already loaded or loading for this generation
        const existing = this.tiles.get(key);
        if (existing && existing.loadGeneration === currentGeneration) continue;

        // Mark as loading with current generation
        this.tiles.set(key, { mesh: null, overlayMesh: null, loading: true, texture: null, overlayTexture: null, loadGeneration: currentGeneration });

        // Load tile(s) based on mode
        this.loadTileForMode(tileX, tileY, this.zoom, currentGeneration);
      }
    }

    // Remove tiles that are no longer needed
    for (const [key, tile] of this.tiles.entries()) {
      if (!neededTiles.has(key) || tile.loadGeneration !== currentGeneration) {
        if (tile.mesh) {
          this.scene.remove(tile.mesh);
          tile.mesh.geometry.dispose();
          tile.mesh.material.dispose();
        }
        if (tile.overlayMesh) {
          this.scene.remove(tile.overlayMesh);
          tile.overlayMesh.geometry.dispose();
          tile.overlayMesh.material.dispose();
        }
        if (tile.texture) {
          tile.texture.dispose();
        }
        if (tile.overlayTexture) {
          tile.overlayTexture.dispose();
        }
        this.tiles.delete(key);
      }
    }
  }

  // Clean up
  dispose() {
    for (const [key, tile] of this.tiles.entries()) {
      if (tile.mesh) {
        this.scene.remove(tile.mesh);
        tile.mesh.geometry.dispose();
        tile.mesh.material.dispose();
      }
      if (tile.overlayMesh) {
        this.scene.remove(tile.overlayMesh);
        tile.overlayMesh.geometry.dispose();
        tile.overlayMesh.material.dispose();
      }
      if (tile.texture) {
        tile.texture.dispose();
      }
      if (tile.overlayTexture) {
        tile.overlayTexture.dispose();
      }
    }
    this.tiles.clear();
  }
}

// Export
window.TileManager = TileManager;
