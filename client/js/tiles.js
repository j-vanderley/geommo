// Tile Loading System - Procedural OSRS-style ground tiles
class TileManager {
  constructor(apiKey, mapStyle) {
    this.apiKey = apiKey;
    this.tiles = new Map(); // key: "x_y" -> { mesh, loading }
    this.tileSize = GAME_CONFIG.view3d.tileSize;
    this.zoom = GAME_CONFIG.view3d.tileZoom;
    this.tilesPerSide = GAME_CONFIG.view3d.tilesPerSide;
    this.worldTileSize = GAME_CONFIG.view3d.worldTileSize;
    this.scene = null;
    this.centerLat = 0;
    this.centerLng = 0;

    // Pre-generate tile textures for variety
    this.tileTextures = [];
    this.generateTileTextures();
  }

  setScene(scene) {
    this.scene = scene;
  }

  // Generate procedural OSRS-style ground textures
  generateTileTextures() {
    const variations = 4;
    for (let i = 0; i < variations; i++) {
      this.tileTextures.push(this.createProceduralTexture(i));
    }
  }

  // Create a procedural ground texture
  createProceduralTexture(seed) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base dark ground color
    const baseColors = ['#1a1a1a', '#1c1c1c', '#181818', '#1e1e1e'];
    ctx.fillStyle = baseColors[seed % baseColors.length];
    ctx.fillRect(0, 0, 512, 512);

    // Add noise/texture
    const imageData = ctx.getImageData(0, 0, 512, 512);
    const data = imageData.data;
    const random = this.seededRandom(seed);

    for (let i = 0; i < data.length; i += 4) {
      const noise = (random() - 0.5) * 15;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
    }
    ctx.putImageData(imageData, 0, 0);

    // Add road grid pattern (like OSRS paths)
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 8;

    // Horizontal roads
    if (random() > 0.5) {
      const y = 256 + (random() - 0.5) * 100;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();

      // Road edge
      ctx.strokeStyle = '#222222';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, y - 5);
      ctx.lineTo(512, y - 5);
      ctx.moveTo(0, y + 5);
      ctx.lineTo(512, y + 5);
      ctx.stroke();
    }

    // Vertical roads
    if (random() > 0.5) {
      ctx.strokeStyle = '#2a2a2a';
      ctx.lineWidth = 8;
      const x = 256 + (random() - 0.5) * 100;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();

      ctx.strokeStyle = '#222222';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 5, 0);
      ctx.lineTo(x - 5, 512);
      ctx.moveTo(x + 5, 0);
      ctx.lineTo(x + 5, 512);
      ctx.stroke();
    }

    // Add some random features (grass patches, rocks)
    const numFeatures = Math.floor(random() * 8) + 3;
    for (let i = 0; i < numFeatures; i++) {
      const fx = random() * 512;
      const fy = random() * 512;
      const featureType = random();

      if (featureType < 0.4) {
        // Dark grass/dirt patch
        ctx.fillStyle = `rgba(26, 61, 26, ${0.3 + random() * 0.3})`;
        ctx.beginPath();
        ctx.ellipse(fx, fy, 20 + random() * 30, 15 + random() * 20, random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      } else if (featureType < 0.7) {
        // Rock/stone
        ctx.fillStyle = `rgba(60, 60, 60, ${0.5 + random() * 0.3})`;
        ctx.beginPath();
        ctx.ellipse(fx, fy, 5 + random() * 10, 4 + random() * 8, random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Water puddle (dark blue)
        ctx.fillStyle = `rgba(0, 20, 40, ${0.4 + random() * 0.3})`;
        ctx.beginPath();
        ctx.ellipse(fx, fy, 15 + random() * 25, 10 + random() * 15, random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Add grid lines (subtle)
    ctx.strokeStyle = 'rgba(40, 40, 40, 0.3)';
    ctx.lineWidth = 1;
    const gridSize = 64;
    for (let x = 0; x <= 512; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y <= 512; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    // Add border/edge highlight
    ctx.strokeStyle = 'rgba(50, 50, 50, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 510, 510);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  // Seeded random number generator for consistent tiles
  seededRandom(seed) {
    let s = seed + 1;
    return function() {
      s = Math.sin(s * 9999) * 10000;
      return s - Math.floor(s);
    };
  }

  // Calculate tile coordinates from lat/lng
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

  // Get texture for a tile based on its coordinates (deterministic)
  getTextureForTile(tileX, tileY) {
    const hash = Math.abs((tileX * 73856093) ^ (tileY * 19349663));
    const index = hash % this.tileTextures.length;
    return this.tileTextures[index];
  }

  // Create a ground plane mesh for a tile
  createTileMesh(worldX, worldZ, texture) {
    const geometry = new THREE.PlaneGeometry(this.worldTileSize, this.worldTileSize);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide
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

        // Skip if tile already exists
        if (this.tiles.has(key)) continue;

        // Get tile center lat/lng
        const tileCenter = this.getTileCenter(tileX, tileY, this.zoom);

        // Calculate world position
        const worldPos = this.latLngToWorld(tileCenter.lat, tileCenter.lng);

        // Get deterministic texture for this tile
        const texture = this.getTextureForTile(tileX, tileY);

        // Create mesh
        const mesh = this.createTileMesh(worldPos.x, worldPos.z, texture);
        this.scene.add(mesh);
        this.tiles.set(key, { mesh });
      }
    }

    // Remove tiles that are too far away
    for (const [key, tile] of this.tiles.entries()) {
      if (!neededTiles.has(key) && tile.mesh) {
        this.scene.remove(tile.mesh);
        tile.mesh.material.dispose();
        tile.mesh.geometry.dispose();
        this.tiles.delete(key);
      }
    }
  }

  // Clean up all tiles
  dispose() {
    for (const [key, tile] of this.tiles.entries()) {
      if (tile.mesh) {
        this.scene.remove(tile.mesh);
        tile.mesh.material.dispose();
        tile.mesh.geometry.dispose();
      }
    }
    this.tiles.clear();

    // Dispose textures
    this.tileTextures.forEach(texture => texture.dispose());
    this.tileTextures = [];
  }
}

// Export for use in other modules
window.TileManager = TileManager;
