// Tile Loading System - OpenStreetMap tiles with OSRS dark filter
class TileManager {
  constructor(apiKey) {
    this.tiles = new Map(); // key: "x_y" -> { mesh, loading }
    this.zoom = GAME_CONFIG.view3d.tileZoom;
    this.tilesPerSide = GAME_CONFIG.view3d.tilesPerSide;
    this.worldTileSize = GAME_CONFIG.view3d.worldTileSize;
    this.textureLoader = new THREE.TextureLoader();
    this.scene = null;
    this.centerLat = 0;
    this.centerLng = 0;

    // Enable cross-origin loading
    this.textureLoader.crossOrigin = 'anonymous';
  }

  setScene(scene) {
    this.scene = scene;
  }

  // Calculate tile coordinates from lat/lng (standard Web Mercator)
  latLngToTileCoords(lat, lng, zoom) {
    const n = Math.pow(2, zoom);
    const x = Math.floor((lng + 180) / 360 * n);
    const latRad = lat * Math.PI / 180;
    const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
    return { x, y };
  }

  // Calculate lat/lng from tile coordinates
  tileCoordsToLatLng(x, y, zoom) {
    const n = Math.pow(2, zoom);
    const lng = x / n * 360 - 180;
    const latRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n)));
    const lat = latRad * 180 / Math.PI;
    return { lat, lng };
  }

  // Get the center lat/lng for a tile
  getTileCenter(tileX, tileY, zoom) {
    return this.tileCoordsToLatLng(tileX + 0.5, tileY + 0.5, zoom);
  }

  // Get OpenStreetMap tile URL
  getTileUrl(tileX, tileY, zoom) {
    // Use multiple subdomains for parallel loading
    const subdomains = ['a', 'b', 'c'];
    const subdomain = subdomains[Math.abs(tileX + tileY) % subdomains.length];
    return `https://${subdomain}.tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`;
  }

  // Load and darken a tile texture
  async loadTileTexture(tileX, tileY, zoom) {
    return new Promise((resolve, reject) => {
      const url = this.getTileUrl(tileX, tileY, zoom);

      // Load image manually to apply dark filter
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        // Create canvas and apply dark OSRS filter
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Draw the original tile
        ctx.drawImage(img, 0, 0, 256, 256);

        // Apply dark filter (similar to minimap style)
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(0, 0, 256, 256);

        // Add slight color tint
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = 'rgba(30, 25, 20, 0.3)';
        ctx.fillRect(0, 0, 256, 256);

        // Increase contrast slightly
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, 256, 256);

        // Create Three.js texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        resolve(texture);
      };

      img.onerror = () => {
        // Create fallback dark texture
        resolve(this.createFallbackTexture());
      };

      img.src = url;
    });
  }

  // Create a fallback dark texture
  createFallbackTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Dark background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, 256, 256);

    // Grid lines
    ctx.strokeStyle = '#2a2a2a';
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
    return texture;
  }

  // Convert lat/lng to world position (relative to center)
  latLngToWorld(lat, lng) {
    const scale = GAME_CONFIG.view3d.worldScale;
    const x = (lng - this.centerLng) * scale * Math.cos(this.centerLat * Math.PI / 180);
    const z = (this.centerLat - lat) * scale;
    return { x, y: 0, z };
  }

  // Convert world position to lat/lng
  worldToLatLng(x, z) {
    const scale = GAME_CONFIG.view3d.worldScale;
    const lng = this.centerLng + x / (scale * Math.cos(this.centerLat * Math.PI / 180));
    const lat = this.centerLat - z / scale;
    return { lat, lng };
  }

  // Create a ground plane mesh for a tile
  createTileMesh(worldX, worldZ, texture) {
    const geometry = new THREE.PlaneGeometry(this.worldTileSize, this.worldTileSize);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.FrontSide
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    mesh.position.set(worldX, 0, worldZ);
    return mesh;
  }

  // Update tiles based on player position
  async updateTiles(playerLat, playerLng) {
    if (!this.scene) return;

    // Set center if not set
    if (this.centerLat === 0 && this.centerLng === 0) {
      this.centerLat = playerLat;
      this.centerLng = playerLng;
    }

    const halfTiles = Math.floor(this.tilesPerSide / 2);

    // Calculate the base tile coordinates for the player position
    const baseTile = this.latLngToTileCoords(playerLat, playerLng, this.zoom);

    // Track which tiles should exist
    const neededTiles = new Set();

    // Create/update tiles in a grid around the player
    for (let dx = -halfTiles; dx <= halfTiles; dx++) {
      for (let dy = -halfTiles; dy <= halfTiles; dy++) {
        const tileX = baseTile.x + dx;
        const tileY = baseTile.y + dy;
        const key = `${tileX}_${tileY}`;
        neededTiles.add(key);

        // Skip if tile already exists or is loading
        if (this.tiles.has(key)) continue;

        // Mark as loading
        this.tiles.set(key, { mesh: null, loading: true });

        // Get tile center lat/lng
        const tileCenter = this.getTileCenter(tileX, tileY, this.zoom);

        // Calculate world position
        const worldPos = this.latLngToWorld(tileCenter.lat, tileCenter.lng);

        // Load texture and create mesh (async)
        this.loadTileTexture(tileX, tileY, this.zoom).then(texture => {
          // Check if tile is still needed
          if (!this.tiles.has(key)) {
            texture.dispose();
            return;
          }

          const mesh = this.createTileMesh(worldPos.x, worldPos.z, texture);
          this.scene.add(mesh);
          this.tiles.set(key, { mesh, loading: false, texture });
        });
      }
    }

    // Remove tiles that are too far away
    for (const [key, tile] of this.tiles.entries()) {
      if (!neededTiles.has(key)) {
        if (tile.mesh) {
          this.scene.remove(tile.mesh);
          if (tile.texture) {
            tile.texture.dispose();
          }
          tile.mesh.material.dispose();
          tile.mesh.geometry.dispose();
        }
        this.tiles.delete(key);
      }
    }
  }

  // Clean up all tiles
  dispose() {
    for (const [key, tile] of this.tiles.entries()) {
      if (tile.mesh) {
        this.scene.remove(tile.mesh);
        if (tile.texture) {
          tile.texture.dispose();
        }
        tile.mesh.material.dispose();
        tile.mesh.geometry.dispose();
      }
    }
    this.tiles.clear();
  }
}

// Export for use in other modules
window.TileManager = TileManager;
