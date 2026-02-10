export interface Position {
  lat: number;
  lng: number;
}

export interface Avatar {
  text: string;
  color: string;
}

export interface Equipment {
  skin?: string;
  hat?: string;
  held?: string;
  aura?: string;
}

export interface Player {
  id: string;
  odId: string;
  username: string;
  position: Position;
  homePosition?: Position;
  flag: string;
  avatar?: Avatar;
  equipment?: Equipment;
  lastSeen: Date;
  // Combat stats
  health?: number;
  maxHealth?: number;
  combatLevel?: number;
}

export interface ChatMessage {
  id: string;
  from: string;
  fromId: string;
  message: string;
  type: 'global' | 'local';
  position?: Position;
  timestamp: Date;
}

// NPC (Non-Player Character) entity
export interface NPC {
  id: string;
  name: string;
  title: string;
  icon: string;
  equipment?: string;           // Optional - boss NPCs have equipment
  sellsEquipment?: string;      // Optional - what the NPC sells
  baseCity: string;
  position: Position;
  health: number;
  maxHealth: number;
  damage: number;
  attackItems: string[];
  color: string;
  particle: string;
  equippedAura?: string;        // Optional - aura visual
  // Battle-only NPC fields
  isBattleOnly?: boolean;       // If true, NPC doesn't trade, only fights
  isTraining?: boolean;         // If true, NPC is a weak training mob
  drops?: string[];             // Item keys that can drop on defeat
  dropChance?: number;          // Probability of dropping an item (0-1)
}

export interface WorldState {
  players: Player[];
  npcs: NPC[];
}

// Combat attack data
export interface CombatAttack {
  attackerId: string;
  targetId: string;
  itemKey: string;
  damage: number;
}

// Socket.io event types
export interface ClientToServerEvents {
  'player:move': (data: { lat: number; lng: number }) => void;
  'chat:send': (data: { message: string; type: 'global' | 'local' }) => void;
  'player:authenticate': (data: {
    token?: string;
    walletAddress?: string;
    username?: string;
    flag?: string;
    avatar?: Avatar;
    authType: 'firebase' | 'wallet';
  }) => void;
  'player:updateFlag': (data: { flag: string }) => void;
  'player:updateAvatar': (data: { avatar: Avatar }) => void;
  'player:updateName': (data: { username: string }) => void;
  'player:updateEquipment': (data: { equipment: Equipment }) => void;
  'player:setHome': (data: { position: Position }) => void;
  'player:updateCombatStats': (data: { health: number; maxHealth: number; combatLevel: number }) => void;
  'combat:attack': (data: { targetId: string; itemKey: string; damage: number }) => void;
  // NPC Combat events
  'npc:attack': (data: { npcId: string; itemKey: string; accuracy: number; maxHit: number }) => void;
  'npc:startCombat': (data: { npcId: string }) => void;
  'npc:endCombat': (data: { npcId: string }) => void;
  // PvP Combat events
  'pvp:attack': (data: { targetId: string; itemKey: string; accuracy: number; maxHit: number }) => void;
}

export interface ServerToClientEvents {
  'player:joined': (data: Player) => void;
  'player:left': (data: { id: string }) => void;
  'player:moved': (data: { id: string; position: Position }) => void;
  'player:flagUpdated': (data: { id: string; flag: string }) => void;
  'player:avatarUpdated': (data: { id: string; avatar: Avatar }) => void;
  'player:nameUpdated': (data: { id: string; username: string }) => void;
  'player:equipmentUpdated': (data: { id: string; equipment: Equipment }) => void;
  'player:homeUpdated': (data: { position: Position }) => void;
  'player:healthUpdated': (data: { id: string; health: number; maxHealth: number }) => void;
  'chat:message': (data: ChatMessage) => void;
  'world:state': (data: WorldState) => void;
  'auth:success': (data: { player: Player }) => void;
  'auth:error': (data: { message: string }) => void;
  'combat:attacked': (data: { attackerId: string; attackerName: string; damage: number; itemKey: string }) => void;
  'combat:hit': (data: { targetId: string; damage: number; targetHealth: number }) => void;
  'combat:died': (data: { playerId: string; killerName: string }) => void;
  'combat:blocked': (data: { reason: string }) => void;
  // NPC Combat events
  'npc:healthUpdate': (data: { npcId: string; health: number; maxHealth: number }) => void;
  'npc:attackResult': (data: { npcId: string; damage: number; didHit: boolean; npcHealth: number; npcMaxHealth: number }) => void;
  'npc:attackPlayer': (data: { npcId: string; npcName: string; damage: number; playerHealth: number; playerMaxHealth: number }) => void;
  'npc:defeated': (data: { npcId: string; npcName: string; drops: string[] }) => void;
  'npc:respawned': (data: { npcId: string }) => void;
  // PvP Combat events
  'pvp:attackResult': (data: { targetId: string; damage: number; didHit: boolean; targetHealth: number; targetMaxHealth: number }) => void;
  'pvp:damaged': (data: { attackerId: string; attackerName: string; damage: number; health: number; maxHealth: number }) => void;
  'pvp:defeated': (data: { killerId: string; killerName: string }) => void;
  'pvp:combatEffect': (data: { attackerId: string; attackerName: string; targetId: string; targetName: string; itemKey: string; damage: number; didHit: boolean }) => void;
}
