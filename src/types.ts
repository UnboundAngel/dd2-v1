export type Rarity = 'common' | 'sturdy' | 'powerful' | 'mythical' | 'legendary' | 'godly';
export type ItemType = 'weapon' | 'armor' | 'medallion' | 'relic' | 'chip' | 'servo' | 'helmet' | 'chest' | 'gloves' | 'boots' | 'shield' | 'weapon1' | 'weapon2';

export interface Shard {
  id: string;
  name: string;
  description: string;
  source?: any;
  compatibleSlots: string[];
  iconUrl?: string;
  heroId?: string;
  heroes?: any[];
  upgradeLevels?: any;
}

export interface Mod {
  id: string;
  name: string;
  description: string;
  source?: string;
  compatibleSlots: string[];
  type?: string;
  heroId?: string;
  iconUrl?: string;
}

export interface ResourceLink {
  author: string;
  name: string;
  description: string;
  link: string;
}

export interface Ability {
  name: string;
  statusEffects: string[];
  abilityType: string;
  manaCost: number;
  recharge: string;
  damageType: string;
  damageScalar: number;
  heroes: string[];
  iconUrl: string;
}

export interface Defense {
  name: string;
  status_effects: string;
  damage_type: string;
  defense_type: string;
  mana_cost: string;
  base_def_power: string;
  base_def_health: string;
  t1_atk_scalar: string;
  t2_atk_scalar: string;
  t3_atk_scalar: string;
  t4_atk_scalar: string;
  t5_atk_scalar: string;
  t1_hp_scalar: string;
  t2_hp_scalar: string;
  t3_hp_scalar: string;
  t4_hp_scalar: string;
  t5_hp_scalar: string;
  base_atk_rate: string;
  max_atk_rate: string;
  base_range: string;
  max_range: string;
  base_atk_range: string;
  max_atk_range: string;
  range_scalar: string;
  asc_def_power: string;
  asc_def_health: string;
  asc_gambit: string;
  hero: string;
  image_url: string;
  iconUrl?: string;
  heroId?: string;
}

export interface Hero {
  id: string;
  name: string;
  class: string;
  roleTags: string[];
  color: string;
  iconUrl?: string;
  equipmentSlots?: string[];
  stats?: {
    health: number;
    damage: number;
    speed: number;
  };
}

export type ProfileIconType = 'hero' | 'generic' | 'upload';

export interface ProfileData {
  name: string;
  title: string;
  status: string;
  tagline: string;
  bio: string;
  iconType: ProfileIconType;
  iconId?: string;
  imageUrl?: string;
  themeColor: string;
  badges: string[];
}

export interface BuildSlot {
  slotId: string;
  shards: (string | null)[];
  mods: (string | null)[];
}

export interface Build {
  id: string;
  name: string;
  heroId: string;
  customColor: string;
  slots: Record<string, BuildSlot>;
  lastEdited: number;
}

export interface Tower {
  id: string;
  name: string;
  duCost: number;
  heroId: string;
  iconUrl?: string;
  stats?: any;
}

export interface MapData {
  id: string;
  name: string;
  maxDU: number;
  imageUrl?: string;
  difficulty: 'campaign' | 'chaos' | 'mastery' | 'onslaught';
}

export interface ChecklistItem {
  id: string;
  label: string;
  isCompleted: boolean;
  type: 'note' | 'level' | 'hero';
  currentValue?: number;
  maxValue?: number;
  linkedHeroId?: string;
  notes?: string;
  imageUrl?: string;
}

export interface Checklist {
  id: string;
  title: string;
  category: string;
  icon?: string;
  sections: {
    id: string;
    title: string;
    items: ChecklistItem[];
  }[];
}

export interface DataRegistry {
  heroes: Hero[];
  maps: MapData[];
  towers: Tower[];
  shards: Shard[];
  mods: Mod[];
  checklists: Checklist[];
  builds: Build[];
  abilities: Ability[];
  defenses: Defense[];
  links: ResourceLink[];
}
