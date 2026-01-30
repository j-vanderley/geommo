import { Player, Position, Avatar, Equipment } from '../types';
import { Firestore, FieldValue } from '@google-cloud/firestore';

export class PlayerManager {
  private players: Map<string, Player> = new Map();
  private db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  // Find if a player with the same odId is already connected (different socket)
  findExistingConnection(odId: string, newSocketId: string): string | null {
    for (const [socketId, player] of this.players) {
      if (player.odId === odId && socketId !== newSocketId) {
        return socketId;
      }
    }
    return null;
  }

  async addPlayer(socketId: string, odId: string, username: string, flag?: string, avatar?: Avatar, position?: Position): Promise<Player> {
    // Try to load existing player data from Firestore
    const playerDoc = await this.db.collection('players').doc(odId).get();

    let playerPosition = position || { lat: 40.7128, lng: -74.0060 }; // Default: NYC
    let playerFlag = flag || '🏳️'; // Default: white flag
    let playerAvatar = avatar || { text: ':-)', color: '#ffb000' }; // Default avatar
    let playerUsername = username; // Default to provided username
    let playerEquipment: Equipment | undefined = undefined; // Equipment loaded from Firestore

    if (playerDoc.exists) {
      const data = playerDoc.data();
      if (data?.position) {
        playerPosition = data.position;
      }
      if (data?.flag && !flag) {
        playerFlag = data.flag;
      }
      // Load saved avatar from Firestore (server-side takes precedence unless new one provided)
      if (data?.avatar && !avatar) {
        playerAvatar = data.avatar;
      }
      // Load saved username from Firestore (persisted display name)
      if (data?.username) {
        playerUsername = data.username;
      }
      // Load saved equipment
      if (data?.equipment) {
        playerEquipment = data.equipment;
      }
    }

    const player: Player = {
      id: socketId,
      odId,
      username: playerUsername,
      position: playerPosition,
      flag: playerFlag,
      avatar: playerAvatar,
      equipment: playerEquipment,
      lastSeen: new Date()
    };

    this.players.set(socketId, player);

    // Save to Firestore
    await this.savePlayer(player);

    return player;
  }

  removePlayer(socketId: string): Player | undefined {
    const player = this.players.get(socketId);
    if (player) {
      this.players.delete(socketId);
      // Update last seen in Firestore
      this.db.collection('players').doc(player.odId).update({
        lastSeen: new Date()
      }).catch(console.error);
    }
    return player;
  }

  getPlayer(socketId: string): Player | undefined {
    return this.players.get(socketId);
  }

  getAllPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  async updatePosition(socketId: string, position: Position): Promise<Player | undefined> {
    const player = this.players.get(socketId);
    if (player) {
      player.position = position;
      player.lastSeen = new Date();

      // Save to Firestore (debounced in production)
      await this.savePlayer(player);
    }
    return player;
  }

  async updateFlag(socketId: string, flag: string): Promise<Player | undefined> {
    const player = this.players.get(socketId);
    if (player) {
      player.flag = flag;
      player.lastSeen = new Date();

      // Save to Firestore
      await this.savePlayer(player);
    }
    return player;
  }

  async updateAvatar(socketId: string, avatar: Avatar): Promise<Player | undefined> {
    const player = this.players.get(socketId);
    if (player) {
      player.avatar = avatar;
      player.flag = avatar.text; // Keep flag in sync for compatibility
      player.lastSeen = new Date();

      // Save to Firestore
      await this.savePlayer(player);
    }
    return player;
  }

  async updateUsername(socketId: string, username: string): Promise<Player | undefined> {
    const player = this.players.get(socketId);
    if (player) {
      player.username = username;
      player.lastSeen = new Date();

      // Save to Firestore
      await this.savePlayer(player);
    }
    return player;
  }

  async updateEquipment(socketId: string, equipment: Equipment): Promise<Player | undefined> {
    const player = this.players.get(socketId);
    if (player) {
      player.equipment = equipment;
      player.lastSeen = new Date();

      // Save to Firestore
      await this.savePlayer(player);
    }
    return player;
  }

  private async savePlayer(player: Player): Promise<void> {
    try {
      await this.db.collection('players').doc(player.odId).set({
        username: player.username,
        position: player.position,
        flag: player.flag,
        avatar: player.avatar,
        equipment: player.equipment,
        lastSeen: player.lastSeen,
        createdAt: FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error saving player to Firestore:', error);
    }
  }

  // Get players within a certain radius (in meters)
  getPlayersNearby(position: Position, radiusMeters: number): Player[] {
    return this.getAllPlayers().filter(player => {
      const distance = this.calculateDistance(position, player.position);
      return distance <= radiusMeters;
    });
  }

  // Haversine formula to calculate distance between two coordinates
  private calculateDistance(pos1: Position, pos2: Position): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = pos1.lat * Math.PI / 180;
    const φ2 = pos2.lat * Math.PI / 180;
    const Δφ = (pos2.lat - pos1.lat) * Math.PI / 180;
    const Δλ = (pos2.lng - pos1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}
