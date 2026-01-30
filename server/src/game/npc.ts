import { NPC, Position } from '../types';

// Major cities data (server-side copy for NPC positioning)
const MAJOR_CITIES: { name: string; lat: number; lng: number }[] = [
  { name: 'New York', lat: 40.758896, lng: -73.985130 },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
  { name: 'London', lat: 51.5074, lng: -0.1278 },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
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

export class NPCManager {
  private npcs: Map<string, NPC> = new Map();

  constructor() {
    this.initializeNPCs();
  }

  private initializeNPCs(): void {
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
      console.log(`Initialized NPC: ${npc.name} (${npc.icon}) at ${npc.baseCity} - Position: ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`);
    }

    console.log(`NPCManager initialized with ${this.npcs.size} NPCs`);
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
