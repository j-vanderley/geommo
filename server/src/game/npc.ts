import { NPC, Position } from '../types';

// Major cities data (server-side copy for NPC positioning)
const MAJOR_CITIES: { name: string; lat: number; lng: number }[] = [
  { name: 'New York', lat: 40.758896, lng: -73.985130 },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
  { name: 'London', lat: 51.5074, lng: -0.1278 },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
  { name: 'Paris', lat: 48.8566, lng: 2.3522 },
  { name: 'Dubai', lat: 25.2048, lng: 55.2708 },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { name: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
  { name: 'Berlin', lat: 52.5200, lng: 13.4050 },
  { name: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729 },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'Cairo', lat: 30.0444, lng: 31.2357 },
];

// NPC templates - each NPC is a legendary boss at a specific city
const NPC_TEMPLATES = {
  glacius: {
    id: 'npc_frost_warden',
    name: 'Glacius',
    title: 'Frost Warden',
    icon: '🧊',
    equipment: 'skin_snowball',
    sellsEquipment: 'aura_frost',
    baseCity: 'Sydney',
    offsetLat: 0.018,
    offsetLng: 0,
    baseHealth: 8000,
    baseDamage: 75,
    attackItems: ['lightningshard', 'mistessence'],
    color: '#88ddff',
    particle: 'frost',
    equippedAura: 'aura_frost'
  },
  voltarus: {
    id: 'npc_storm_herald',
    name: 'Voltarus',
    title: 'Storm Herald',
    icon: '⛈️',
    equipment: 'skin_lightning',
    sellsEquipment: 'aura_lightning',
    baseCity: 'Tokyo',
    offsetLat: 0,
    offsetLng: 0.022,
    baseHealth: 10000,
    baseDamage: 90,
    attackItems: ['lightningshard', 'mistessence'],
    color: '#ffff00',
    particle: 'lightning',
    equippedAura: 'aura_lightning'
  },
  nyx: {
    id: 'npc_void_walker',
    name: 'Nyx',
    title: 'Void Walker',
    icon: '🌀',
    equipment: 'skin_void',
    sellsEquipment: 'aura_void',
    baseCity: 'London',
    offsetLat: 0.018,
    offsetLng: 0,
    baseHealth: 12000,
    baseDamage: 110,
    attackItems: ['mistessence', 'lightningshard'],
    color: '#660099',
    particle: 'void',
    equippedAura: 'aura_void'
  },
  solara: {
    id: 'npc_light_bringer',
    name: 'Solara',
    title: 'Light Bringer',
    icon: '🌟',
    equipment: 'skin_flame',
    sellsEquipment: 'aura_holy',
    baseCity: 'New York',
    offsetLat: 0,
    offsetLng: -0.022,
    baseHealth: 15000,
    baseDamage: 130,
    attackItems: ['lightningshard', 'mistessence'],
    color: '#ffffaa',
    particle: 'holy',
    equippedAura: 'aura_holy'
  }
};

// Battle-only NPCs - weaker enemies that can appear in multiple locations
// These drop rare items when defeated
const BATTLE_NPC_TEMPLATES = {
  shadow_imp: {
    name: 'Shadow Imp',
    title: 'Dark Minion',
    icon: '🦇',
    baseHealth: 1500,
    baseDamage: 25,
    attackItems: ['mistessence'],
    color: '#4a0080',
    particle: 'void',
    drops: ['shadow_essence', 'dark_fragment'],
    dropChance: 0.15, // 15% chance
    isBattleOnly: true
  },
  ember_sprite: {
    name: 'Ember Sprite',
    title: 'Fire Spirit',
    icon: '🔥',
    baseHealth: 1800,
    baseDamage: 30,
    attackItems: ['lightningshard'],
    color: '#ff4400',
    particle: 'fire',
    drops: ['ember_shard', 'flame_core'],
    dropChance: 0.15,
    isBattleOnly: true
  },
  moss_golem: {
    name: 'Moss Golem',
    title: 'Ancient Guardian',
    icon: '🌿',
    baseHealth: 2500,
    baseDamage: 20,
    attackItems: ['mistessence'],
    color: '#228b22',
    particle: 'nature',
    drops: ['ancient_bark', 'living_vine'],
    dropChance: 0.12,
    isBattleOnly: true
  },
  crystal_wisp: {
    name: 'Crystal Wisp',
    title: 'Gem Spirit',
    icon: '💎',
    baseHealth: 1200,
    baseDamage: 35,
    attackItems: ['lightningshard'],
    color: '#00ffff',
    particle: 'crystal',
    drops: ['crystal_shard', 'prismatic_gem'],
    dropChance: 0.10, // Rarer drops
    isBattleOnly: true
  },
  dust_devil: {
    name: 'Dust Devil',
    title: 'Wind Elemental',
    icon: '🌪️',
    baseHealth: 1600,
    baseDamage: 28,
    attackItems: ['mistessence', 'lightningshard'],
    color: '#c2b280',
    particle: 'wind',
    drops: ['wind_fragment', 'storm_dust'],
    dropChance: 0.15,
    isBattleOnly: true
  },
  frost_minion: {
    name: 'Frost Minion',
    title: 'Ice Servant',
    icon: '❄️',
    baseHealth: 2000,
    baseDamage: 32,
    attackItems: ['mistessence'],
    color: '#b0e0e6',
    particle: 'frost',
    drops: ['frost_shard', 'frozen_heart'],
    dropChance: 0.12,
    isBattleOnly: true
  }
};

// Training NPCs - very weak enemies for beginners (Level 1-10)
const TRAINING_NPC_TEMPLATES = {
  slime: {
    name: 'Slime',
    title: 'Weak Creature',
    icon: '🟢',
    baseHealth: 200,
    baseDamage: 5,
    attackItems: ['cloudwisp'],
    color: '#44ff44',
    particle: 'none',
    drops: ['cloudwisp'],
    dropChance: 0.25,
    isBattleOnly: true,
    isTraining: true
  },
  rat: {
    name: 'Giant Rat',
    title: 'Pest',
    icon: '🐀',
    baseHealth: 300,
    baseDamage: 8,
    attackItems: ['cloudwisp'],
    color: '#888888',
    particle: 'none',
    drops: ['raindrop'],
    dropChance: 0.20,
    isBattleOnly: true,
    isTraining: true
  },
  beetle: {
    name: 'Fire Beetle',
    title: 'Insect',
    icon: '🪲',
    baseHealth: 400,
    baseDamage: 10,
    attackItems: ['sunstone'],
    color: '#ff6600',
    particle: 'fire',
    drops: ['sunstone', 'ember_shard'],
    dropChance: 0.18,
    isBattleOnly: true,
    isTraining: true
  },
  bat: {
    name: 'Cave Bat',
    title: 'Flying Pest',
    icon: '🦇',
    baseHealth: 350,
    baseDamage: 12,
    attackItems: ['mistessence'],
    color: '#553366',
    particle: 'void',
    drops: ['mistessence', 'shadow_essence'],
    dropChance: 0.15,
    isBattleOnly: true,
    isTraining: true
  },
  spider: {
    name: 'Giant Spider',
    title: 'Arachnid',
    icon: '🕷️',
    baseHealth: 500,
    baseDamage: 15,
    attackItems: ['mistessence'],
    color: '#222222',
    particle: 'none',
    drops: ['ancient_bark', 'living_vine'],
    dropChance: 0.12,
    isBattleOnly: true,
    isTraining: true
  }
};

// Training NPC spawn locations - cities WITHOUT boss NPCs
// Boss cities to avoid: New York (Solara), London (Nyx), Tokyo (Voltarus), Sydney (Glacius)
const TRAINING_NPC_SPAWNS: { npcType: keyof typeof TRAINING_NPC_TEMPLATES; city: string; offsetLat: number; offsetLng: number }[] = [
  // Paris - main training hub (no boss)
  { npcType: 'slime', city: 'Paris', offsetLat: 0.006, offsetLng: 0.008 },
  { npcType: 'slime', city: 'Paris', offsetLat: -0.008, offsetLng: 0.006 },
  { npcType: 'slime', city: 'Paris', offsetLat: 0.004, offsetLng: -0.007 },
  { npcType: 'rat', city: 'Paris', offsetLat: 0.010, offsetLng: -0.006 },
  { npcType: 'rat', city: 'Paris', offsetLat: -0.005, offsetLng: -0.009 },
  { npcType: 'beetle', city: 'Paris', offsetLat: 0.007, offsetLng: 0.010 },

  // Los Angeles - training area (no boss)
  { npcType: 'slime', city: 'Los Angeles', offsetLat: 0.008, offsetLng: 0.008 },
  { npcType: 'slime', city: 'Los Angeles', offsetLat: -0.007, offsetLng: 0.006 },
  { npcType: 'rat', city: 'Los Angeles', offsetLat: 0.010, offsetLng: -0.008 },
  { npcType: 'beetle', city: 'Los Angeles', offsetLat: -0.006, offsetLng: 0.010 },
  { npcType: 'spider', city: 'Los Angeles', offsetLat: 0.005, offsetLng: -0.010 },

  // Berlin - training area (no boss)
  { npcType: 'slime', city: 'Berlin', offsetLat: 0.006, offsetLng: 0.007 },
  { npcType: 'rat', city: 'Berlin', offsetLat: -0.007, offsetLng: 0.008 },
  { npcType: 'rat', city: 'Berlin', offsetLat: 0.009, offsetLng: -0.005 },
  { npcType: 'bat', city: 'Berlin', offsetLat: -0.005, offsetLng: -0.008 },
  { npcType: 'spider', city: 'Berlin', offsetLat: 0.008, offsetLng: 0.010 },

  // Singapore - training area (no boss)
  { npcType: 'slime', city: 'Singapore', offsetLat: 0.005, offsetLng: 0.006 },
  { npcType: 'slime', city: 'Singapore', offsetLat: -0.006, offsetLng: 0.005 },
  { npcType: 'beetle', city: 'Singapore', offsetLat: 0.008, offsetLng: -0.006 },
  { npcType: 'beetle', city: 'Singapore', offsetLat: -0.004, offsetLng: -0.008 },
  { npcType: 'spider', city: 'Singapore', offsetLat: 0.007, offsetLng: 0.009 },

  // Dubai - training area (no boss)
  { npcType: 'slime', city: 'Dubai', offsetLat: 0.007, offsetLng: 0.006 },
  { npcType: 'rat', city: 'Dubai', offsetLat: -0.006, offsetLng: 0.008 },
  { npcType: 'beetle', city: 'Dubai', offsetLat: 0.009, offsetLng: -0.007 },
  { npcType: 'bat', city: 'Dubai', offsetLat: -0.008, offsetLng: -0.005 },

  // Rio de Janeiro - training area (no boss)
  { npcType: 'slime', city: 'Rio de Janeiro', offsetLat: 0.006, offsetLng: 0.007 },
  { npcType: 'slime', city: 'Rio de Janeiro', offsetLat: -0.007, offsetLng: 0.005 },
  { npcType: 'rat', city: 'Rio de Janeiro', offsetLat: 0.008, offsetLng: -0.006 },
  { npcType: 'beetle', city: 'Rio de Janeiro', offsetLat: -0.005, offsetLng: -0.009 },
  { npcType: 'spider', city: 'Rio de Janeiro', offsetLat: 0.010, offsetLng: 0.008 },

  // Mumbai - training area (no boss)
  { npcType: 'slime', city: 'Mumbai', offsetLat: 0.005, offsetLng: 0.007 },
  { npcType: 'rat', city: 'Mumbai', offsetLat: -0.006, offsetLng: 0.006 },
  { npcType: 'rat', city: 'Mumbai', offsetLat: 0.008, offsetLng: -0.005 },
  { npcType: 'bat', city: 'Mumbai', offsetLat: -0.007, offsetLng: -0.008 },
  { npcType: 'spider', city: 'Mumbai', offsetLat: 0.009, offsetLng: 0.006 },

  // Cairo - training area (no boss)
  { npcType: 'slime', city: 'Cairo', offsetLat: 0.006, offsetLng: 0.006 },
  { npcType: 'slime', city: 'Cairo', offsetLat: -0.005, offsetLng: 0.007 },
  { npcType: 'beetle', city: 'Cairo', offsetLat: 0.008, offsetLng: -0.006 },
  { npcType: 'beetle', city: 'Cairo', offsetLat: -0.007, offsetLng: -0.005 },
  { npcType: 'bat', city: 'Cairo', offsetLat: 0.009, offsetLng: 0.008 },
];

// Spawn locations for battle NPCs - each NPC type spawns in multiple cities
const BATTLE_NPC_SPAWNS: { npcType: keyof typeof BATTLE_NPC_TEMPLATES; city: string; offsetLat: number; offsetLng: number }[] = [
  // Shadow Imps - appear in dark/mysterious cities
  { npcType: 'shadow_imp', city: 'London', offsetLat: -0.015, offsetLng: 0.012 },
  { npcType: 'shadow_imp', city: 'Berlin', offsetLat: 0.012, offsetLng: -0.010 },
  { npcType: 'shadow_imp', city: 'Cairo', offsetLat: -0.010, offsetLng: 0.015 },

  // Ember Sprites - appear in hot/passionate cities
  { npcType: 'ember_sprite', city: 'Dubai', offsetLat: 0.015, offsetLng: 0.010 },
  { npcType: 'ember_sprite', city: 'Rio de Janeiro', offsetLat: -0.012, offsetLng: 0.015 },
  { npcType: 'ember_sprite', city: 'Mumbai', offsetLat: 0.010, offsetLng: -0.012 },

  // Moss Golems - appear in green/nature cities
  { npcType: 'moss_golem', city: 'Singapore', offsetLat: -0.010, offsetLng: 0.012 },
  { npcType: 'moss_golem', city: 'Sydney', offsetLat: -0.015, offsetLng: -0.010 },
  { npcType: 'moss_golem', city: 'Rio de Janeiro', offsetLat: 0.015, offsetLng: -0.012 },

  // Crystal Wisps - appear in modern/tech cities
  { npcType: 'crystal_wisp', city: 'Tokyo', offsetLat: -0.015, offsetLng: -0.012 },
  { npcType: 'crystal_wisp', city: 'Singapore', offsetLat: 0.012, offsetLng: -0.010 },
  { npcType: 'crystal_wisp', city: 'Dubai', offsetLat: -0.012, offsetLng: -0.015 },

  // Dust Devils - appear in arid/windy cities
  { npcType: 'dust_devil', city: 'Cairo', offsetLat: 0.015, offsetLng: -0.010 },
  { npcType: 'dust_devil', city: 'Los Angeles', offsetLat: -0.012, offsetLng: 0.015 },
  { npcType: 'dust_devil', city: 'Mumbai', offsetLat: -0.015, offsetLng: 0.010 },

  // Frost Minions - appear in cold/northern cities
  { npcType: 'frost_minion', city: 'Berlin', offsetLat: -0.012, offsetLng: 0.015 },
  { npcType: 'frost_minion', city: 'London', offsetLat: 0.010, offsetLng: -0.015 },
  { npcType: 'frost_minion', city: 'New York', offsetLat: 0.018, offsetLng: 0.015 },
];

export class NPCManager {
  private npcs: Map<string, NPC> = new Map();

  constructor() {
    this.initializeNPCs();
  }

  private initializeNPCs(): void {
    // Initialize legendary boss NPCs (tradeable)
    for (const [key, template] of Object.entries(NPC_TEMPLATES)) {
      const position = this.getNPCPosition(template);
      if (!position) {
        console.warn(`Failed to get position for NPC: ${template.name} at ${template.baseCity}`);
        continue;
      }

      const npc: NPC = {
        id: template.id,
        name: template.name,
        title: template.title,
        icon: template.icon,
        equipment: template.equipment,
        sellsEquipment: template.sellsEquipment,
        baseCity: template.baseCity,
        position,
        health: template.baseHealth,
        maxHealth: template.baseHealth,
        damage: template.baseDamage,
        attackItems: [...template.attackItems],
        color: template.color,
        particle: template.particle,
        equippedAura: template.equippedAura
      };

      this.npcs.set(npc.id, npc);
      console.log(`Initialized Boss NPC: ${npc.name} (${npc.icon}) at ${npc.baseCity} - Position: ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`);
    }

    // Initialize battle-only NPCs (can spawn multiple times in different cities)
    for (let i = 0; i < BATTLE_NPC_SPAWNS.length; i++) {
      const spawn = BATTLE_NPC_SPAWNS[i];
      const template = BATTLE_NPC_TEMPLATES[spawn.npcType];
      const city = MAJOR_CITIES.find(c => c.name === spawn.city);

      if (!city) {
        console.warn(`Failed to find city for battle NPC: ${spawn.city}`);
        continue;
      }

      const position = {
        lat: city.lat + spawn.offsetLat,
        lng: city.lng + spawn.offsetLng
      };

      // Create unique ID for each spawn (e.g., battle_shadow_imp_0, battle_shadow_imp_1)
      const npcId = `battle_${spawn.npcType}_${i}`;

      const npc: NPC = {
        id: npcId,
        name: template.name,
        title: template.title,
        icon: template.icon,
        baseCity: spawn.city,
        position,
        health: template.baseHealth,
        maxHealth: template.baseHealth,
        damage: template.baseDamage,
        attackItems: [...template.attackItems],
        color: template.color,
        particle: template.particle,
        isBattleOnly: true,
        drops: template.drops,
        dropChance: template.dropChance
      };

      this.npcs.set(npc.id, npc);
      console.log(`Initialized Battle NPC: ${npc.name} (${npc.icon}) at ${spawn.city} - Position: ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`);
    }

    // Initialize training NPCs (weak enemies for beginners)
    for (let i = 0; i < TRAINING_NPC_SPAWNS.length; i++) {
      const spawn = TRAINING_NPC_SPAWNS[i];
      const template = TRAINING_NPC_TEMPLATES[spawn.npcType];
      const city = MAJOR_CITIES.find(c => c.name === spawn.city);

      if (!city) {
        console.warn(`Failed to find city for training NPC: ${spawn.city}`);
        continue;
      }

      const position = {
        lat: city.lat + spawn.offsetLat,
        lng: city.lng + spawn.offsetLng
      };

      const npcId = `training_${spawn.npcType}_${i}`;

      const npc: NPC = {
        id: npcId,
        name: template.name,
        title: template.title,
        icon: template.icon,
        baseCity: spawn.city,
        position,
        health: template.baseHealth,
        maxHealth: template.baseHealth,
        damage: template.baseDamage,
        attackItems: [...template.attackItems],
        color: template.color,
        particle: template.particle,
        isBattleOnly: true,
        isTraining: true,
        drops: template.drops,
        dropChance: template.dropChance
      };

      this.npcs.set(npc.id, npc);
      console.log(`Initialized Training NPC: ${npc.name} (${npc.icon}) at ${spawn.city} - Position: ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`);
    }

    console.log(`NPCManager initialized with ${this.npcs.size} NPCs (4 bosses + ${BATTLE_NPC_SPAWNS.length} battle + ${TRAINING_NPC_SPAWNS.length} training)`);
  }

  private getNPCPosition(template: typeof NPC_TEMPLATES[keyof typeof NPC_TEMPLATES]): Position | null {
    const city = MAJOR_CITIES.find(c => c.name === template.baseCity);
    if (!city) return null;
    return {
      lat: city.lat + template.offsetLat,
      lng: city.lng + template.offsetLng
    };
  }

  getNPC(id: string): NPC | undefined {
    return this.npcs.get(id);
  }

  getAllNPCs(): NPC[] {
    return Array.from(this.npcs.values());
  }

  // Damage an NPC (returns remaining health)
  damageNPC(id: string, damage: number): number {
    const npc = this.npcs.get(id);
    if (!npc) return 0;

    npc.health = Math.max(0, npc.health - damage);
    return npc.health;
  }

  // Reset NPC health (for respawn)
  resetNPCHealth(id: string): void {
    const npc = this.npcs.get(id);
    if (npc) {
      npc.health = npc.maxHealth;
    }
  }

  // Check if NPC is defeated
  isNPCDefeated(id: string): boolean {
    const npc = this.npcs.get(id);
    return npc ? npc.health <= 0 : true;
  }
}
