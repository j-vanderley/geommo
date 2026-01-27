// Tile Loading System - OpenStreetMap tiles on ground plane
class TileManager {
  constructor() {
    this.tiles = new Map(); // key: "z_x_y" -> { mesh, loading, texture }
    this.zoom = GAME_CONFIG.view3d.tileZoom;
    this.tilesPerSide = GAME_CONFIG.view3d.tilesPerSide;
    this.scene = null;
    this.centerLat = 0;
    this.centerLng = 0;

    // Calculate world scale: how many world units per degree of latitude
    // This determines the overall scale of the 3D world
    this.worldScale = GAME_CONFIG.view3d.worldScale;
  }

  setScene(scene) {
    this.scene = scene;
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

  // Get OpenStreetMap tile URL
  getTileUrl(tileX, tileY, zoom) {
    const subdomains = ['a', 'b', 'c'];
    const subdomain = subdomains[Math.abs(tileX + tileY) % subdomains.length];
    return `https://${subdomain}.tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`;
  }

  // Load tile texture (no filter, just raw OSM tile)
  loadTileTexture(tileX, tileY, zoom) {
    return new Promise((resolve) => {
      const url = this.getTileUrl(tileX, tileY, zoom);
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
  createTileMesh(tileX, tileY, zoom, texture) {
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
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.FrontSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2; // Lay flat
    mesh.position.set(centerX, 0, centerZ);

    return mesh;
  }

  // Update tiles around player position
  async updateTiles(playerLat, playerLng) {
    if (!this.scene) return;

    // Set center on first call
    if (this.centerLat === 0 && this.centerLng === 0) {
      this.centerLat = playerLat;
      this.centerLng = playerLng;
    }

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

        if (this.tiles.has(key)) continue;

        // Mark as loading
        this.tiles.set(key, { mesh: null, loading: true, texture: null });

        // Load texture and create mesh
        this.loadTileTexture(tileX, tileY, this.zoom).then(texture => {
          if (!this.tiles.has(key)) {
            texture.dispose();
            return;
          }

          const mesh = this.createTileMesh(tileX, tileY, this.zoom, texture);
          this.scene.add(mesh);
          this.tiles.set(key, { mesh, loading: false, texture });
        });
      }
    }

    // Remove distant tiles
    for (const [key, tile] of this.tiles.entries()) {
      if (!neededTiles.has(key)) {
        if (tile.mesh) {
          this.scene.remove(tile.mesh);
          tile.mesh.geometry.dispose();
          tile.mesh.material.dispose();
        }
        if (tile.texture) {
          tile.texture.dispose();
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
      if (tile.texture) {
        tile.texture.dispose();
      }
    }
    this.tiles.clear();
  }
}

// Export
window.TileManager = TileManager;
