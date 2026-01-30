import { WorldState, Player } from '../types';
import { PlayerManager } from './player';
import { NPCManager } from './npc';

export class WorldManager {
  private playerManager: PlayerManager;
  private npcManager: NPCManager;

  constructor(playerManager: PlayerManager, npcManager: NPCManager) {
    this.playerManager = playerManager;
    this.npcManager = npcManager;
  }

  getWorldState(): WorldState {
    return {
      players: this.playerManager.getAllPlayers(),
      npcs: this.npcManager.getAllNPCs()
    };
  }

  // Get a subset of world state relevant to a specific player
  // (could be used for view distance optimization)
  getWorldStateForPlayer(socketId: string): WorldState {
    const player = this.playerManager.getPlayer(socketId);
    if (!player) {
      return { players: [], npcs: [] };
    }

    // For now, return all players and NPCs
    // In production, could limit to nearby entities for performance
    return this.getWorldState();
  }

  // Get NPC manager for direct access
  getNPCManager(): NPCManager {
    return this.npcManager;
  }
}
