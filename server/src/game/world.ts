import { WorldState, Player } from '../types';
import { PlayerManager } from './player';

export class WorldManager {
  private playerManager: PlayerManager;

  constructor(playerManager: PlayerManager) {
    this.playerManager = playerManager;
  }

  getWorldState(): WorldState {
    return {
      players: this.playerManager.getAllPlayers()
    };
  }

  // Get a subset of world state relevant to a specific player
  // (could be used for view distance optimization)
  getWorldStateForPlayer(socketId: string): WorldState {
    const player = this.playerManager.getPlayer(socketId);
    if (!player) {
      return { players: [] };
    }

    // For now, return all players
    // In production, could limit to nearby players for performance
    return this.getWorldState();
  }
}
