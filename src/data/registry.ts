import abilitiesData from '../../data/abilities/dd2_abilities.json';
import defensesData from '../../data/defenses/dd2_defenses.json';
import shardsData from '../../data/shards/dd2_shards_data.json';
import modsData from '../../data/mods/dd2_mods_data.json';
import linksData from '../../data/links/dd2_links.json';
import type {
  Ability,
  DataRegistry,
  Defense,
  Hero,
  Mod,
  Tower,
  ResourceLink,
  Shard
} from '../types';
import { DUAL_WIELD_SLOTS, SHIELD_SLOTS, STANDARD_SLOTS } from '../constants';
import { slugify } from '../utils';

export const normalizeShard = (raw: any, heroes: Hero[]): Shard => {
  const heroName = raw.heroes?.[0]?.name;
  const compatibleSlots = Array.isArray(raw.compatibleSlots) && raw.compatibleSlots.length
    ? raw.compatibleSlots
    : raw.heroes?.map((h: any) => h.slot).filter(Boolean) || ['relic', 'weapon', 'helmet', 'chest', 'gloves', 'boots'];

  const heroId = heroName ? heroes.find(h => h.name.toLowerCase() === heroName.toLowerCase())?.id : undefined;
  const source =
    typeof raw.source === 'object'
      ? raw.source
      : typeof raw.source === 'string'
        ? raw.source
        : raw.source?.difficulty || 'Unknown';

  return {
    id: raw.id || `s_${slugify(raw.name || 'shard')}`,
    name: raw.name || 'Unknown Shard',
    description: typeof raw.description === 'string' ? raw.description : (raw.description?.text || 'No description'),
    source,
    compatibleSlots: compatibleSlots.map((slot: string) => String(slot).toLowerCase()),
    iconUrl: raw.heroes?.[0]?.image || raw.iconUrl || raw.image,
    heroId,
    heroes: Array.isArray(raw.heroes) ? raw.heroes : [],
    upgradeLevels: raw.upgradeLevels
  };
};

export const normalizeMod = (raw: any, heroes: Hero[]): Mod => {
  const heroName = raw.hero;
  const heroId = typeof heroName === 'string' ? heroes.find(h => h.name.toLowerCase() === heroName.toLowerCase())?.id : undefined;
  const type = raw.type || 'Any';
  const slotMap: Record<string, string[]> = {
    Weapon: ['weapon', 'weapon1', 'weapon2'],
    Relic: ['relic'],
    Armor: ['helmet', 'chest', 'gloves', 'boots']
  };
  const compatibleSlots = slotMap[type] || ['relic'];

  return {
    id: raw.id || `m_${slugify(raw.name || 'mod')}`,
    name: raw.name || 'Unknown Mod',
    description: raw.description || 'No description',
    source: raw.drop || raw.source || 'Unknown',
    compatibleSlots: compatibleSlots.map(s => s.toLowerCase()),
    type,
    heroId,
    iconUrl: raw.image || raw.iconUrl || raw.icons?.plain
  };
};

export const normalizeLink = (raw: any): ResourceLink => ({
  author: raw.author || 'Unknown',
  name: raw.name || 'Untitled',
  description: raw.description || 'No description',
  link: raw.link || '#'
});

export const normalizeDefense = (raw: any, heroes: Hero[]) => {
  const heroName = raw.hero || raw.heroId;
  const heroId = heroName ? heroes.find(h => h.name.toLowerCase() === String(heroName).toLowerCase())?.id : undefined;

  return {
    ...raw,
    name: raw.name || 'Unknown Defense',
    iconUrl: raw.image_url || raw.iconUrl || raw.icons?.plain,
    hero: heroName || '',
    heroId
  };
};

const INITIAL_REGISTRY: DataRegistry = {
  heroes: [
    { id: 'h20', name: 'Squire', class: 'Squire', roleTags: ['Tank', 'Builder'], color: 'bg-orange-600', equipmentSlots: SHIELD_SLOTS, iconUrl: 'https://static.wikia.nocookie.net/dungeondefenders/images/9/91/Squire_Icon.png' },
    { id: 'h3', name: 'Apprentice', class: 'Apprentice', roleTags: ['DPS', 'Builder'], color: 'bg-blue-600', equipmentSlots: STANDARD_SLOTS, iconUrl: 'https://static.wikia.nocookie.net/dungeondefenders/images/2/2d/Apprentice_Icon.png' },
    { id: 'h13', name: 'Huntress', class: 'Huntress', roleTags: ['DPS', 'Builder'], color: 'bg-green-600', equipmentSlots: STANDARD_SLOTS, iconUrl: 'https://static.wikia.nocookie.net/dungeondefenders/images/9/96/Huntress_Icon.png' },
    { id: 'h17', name: 'Monk', class: 'Monk', roleTags: ['Support', 'Builder'], color: 'bg-yellow-600', equipmentSlots: STANDARD_SLOTS, iconUrl: 'https://static.wikia.nocookie.net/dungeondefenders/images/3/3d/Monk_Icon.png' },
    { id: 'h1', name: 'Abyss Lord', class: 'Abyss Lord', roleTags: ['Builder', 'Tank'], color: 'bg-purple-700', equipmentSlots: STANDARD_SLOTS, iconUrl: 'https://static.wikia.nocookie.net/dungeondefenders/images/6/65/Abyss_Lord_Icon.png' },
    { id: 'h2', name: 'Adept', class: 'Adept', roleTags: ['DPS', 'Builder'], color: 'bg-violet-600', equipmentSlots: STANDARD_SLOTS, iconUrl: 'https://static.wikia.nocookie.net/dungeondefenders/images/8/88/Adept_Icon.png' },
    { id: 'h4', name: 'Aquarion', class: 'Aquarion', roleTags: ['DPS', 'Builder'], color: 'bg-cyan-500', equipmentSlots: STANDARD_SLOTS, iconUrl: 'https://static.wikia.nocookie.net/dungeondefenders/images/c/c2/Aquarion_Icon.png' },
    { id: 'h5', name: 'Barbarian', class: 'Barbarian', roleTags: ['DPS'], color: 'bg-red-700', equipmentSlots: DUAL_WIELD_SLOTS, iconUrl: 'https://static.wikia.nocookie.net/dungeondefenders/images/a/a2/Barbarian_Icon.png' },
    { id: 'h6', name: 'Countess', class: 'Countess', roleTags: ['Tank', 'Builder'], color: 'bg-orange-500', equipmentSlots: SHIELD_SLOTS, iconUrl: 'https://static.wikia.nocookie.net/dungeondefenders/images/c/c5/Countess_Icon.png' },
    { id: 'h7', name: 'Cyborg', class: 'Cyborg', roleTags: ['DPS', 'Builder'], color: 'bg-zinc-600', equipmentSlots: STANDARD_SLOTS, iconUrl: 'https://static.wikia.nocookie.net/dungeondefenders/images/5/5f/Cyborg_Icon.png' },
    { id: 'h8', name: 'Dryad', class: 'Dryad', roleTags: ['Builder', 'Support'], color: 'bg-emerald-600', equipmentSlots: STANDARD_SLOTS, iconUrl: 'https://static.wikia.nocookie.net/dungeondefenders/images/4/4d/Dryad_Icon.png' },
    { id: 'h9', name: 'Engineer', class: 'Engineer', roleTags: ['Builder', 'DPS'], color: 'bg-teal-700', equipmentSlots: STANDARD_SLOTS, iconUrl: 'https://static.wikia.nocookie.net/dungeondefenders/images/a/a7/Engineer_Icon.png' },
    { id: 'h10', name: 'Frostweaver', class: 'Frostweaver', roleTags: ['Builder', 'CC'], color: 'bg-sky-500', equipmentSlots: STANDARD_SLOTS, iconUrl: 'https://static.wikia.nocookie.net/dungeondefenders/images/5/5d/Frostweaver_Icon.png' },
    { id: 'h11', name: 'Gunwitch', class: 'Gunwitch', roleTags: ['DPS'], color: 'bg-pink-700', equipmentSlots: STANDARD_SLOTS, iconUrl: 'https://static.wikia.nocookie.net/dungeondefenders/images/8/8f/Gunwitch_Icon.png' },
    { id: 'h12', name: 'Hunter', class: 'Hunter', roleTags: ['DPS', 'Builder'], color: 'bg-emerald-700', equipmentSlots: STANDARD_SLOTS, iconUrl: 'https://static.wikia.nocookie.net/dungeondefenders/images/f/f6/Hunter_Icon.png' },
    { id: 'h14', name: 'Initiate', class: 'Initiate', roleTags: ['Support', 'Builder'], color: 'bg-amber-500', equipmentSlots: STANDARD_SLOTS, iconUrl: 'https://static.wikia.nocookie.net/dungeondefenders/images/8/88/Initiate_Icon.png' },
    { id: 'h15', name: 'Lavamancer', class: 'Lavamancer', roleTags: ['Tank', 'Builder'], color: 'bg-red-800', equipmentSlots: STANDARD_SLOTS, iconUrl: 'https://static.wikia.nocookie.net/dungeondefenders/images/c/c8/Lavamancer_Icon.png' },
    { id: 'h16', name: 'Mercenary', class: 'Mercenary', roleTags: ['DPS'], color: 'bg-slate-700', equipmentSlots: STANDARD_SLOTS, iconUrl: 'https://static.wikia.nocookie.net/dungeondefenders/images/3/36/Mercenary_Icon.png' },
    { id: 'h18', name: 'Mystic', class: 'Mystic', roleTags: ['Builder', 'Support'], color: 'bg-indigo-600', equipmentSlots: STANDARD_SLOTS, iconUrl: 'https://static.wikia.nocookie.net/dungeondefenders/images/8/8f/Mystic_Icon.png' },
    { id: 'h19', name: 'Series EV2', class: 'Series EV2', roleTags: ['Builder', 'DPS'], color: 'bg-teal-600', equipmentSlots: STANDARD_SLOTS, iconUrl: 'https://static.wikia.nocookie.net/dungeondefenders/images/d/d3/Series_EV2_Icon.png' },
    { id: 'h21', name: 'Jester', class: 'Jester', roleTags: ['Support', 'DPS'], color: 'bg-fuchsia-700', equipmentSlots: STANDARD_SLOTS, iconUrl: 'https://static.wikia.nocookie.net/dungeondefenders/images/9/9d/Jester_Icon.png' }
  ],
  maps: [
    { id: 'm1', name: 'The Gates of Dragonfall', maxDU: 1000, difficulty: 'campaign' },
    { id: 'm2', name: 'Nimbus Reach', maxDU: 1200, difficulty: 'chaos' }
  ],
  towers: [],
  shards: [],
  mods: [],
  checklists: [],
  builds: [],
  abilities: [],
  defenses: [],
  links: []
};

export const buildInitialRegistry = (): DataRegistry => {
  const saved = localStorage.getItem('dd2_planner_data');
  const savedData = saved ? JSON.parse(saved) : null;
  const base = savedData ? { ...INITIAL_REGISTRY, ...savedData } : INITIAL_REGISTRY;
  const heroIdByName = (name?: string) => {
    if (!name) return undefined;
    return base.heroes.find(h => h.name.toLowerCase() === String(name).toLowerCase())?.id;
  };
  const normalizedDefenses = ([...(savedData?.defenses || []), ...((defensesData as any).defenses || [])] as any[])
    .map((d: any) => normalizeDefense(d, base.heroes))
    .reduce((acc: any[], item: any) => {
      const exists = acc.find(d => d.name === item.name);
      if (!exists) acc.push(item);
      return acc;
    }, []);
  const parseManaCost = (value: any) => {
    const cleaned = String(value || '').replace(/[^0-9]/g, '');
    return parseInt(cleaned, 10) || 0;
  };
  const derivedTowers: Tower[] = normalizedDefenses
    .filter((defense: any) => defense?.name)
    .map((defense: any) => ({
      id: `t_${slugify(defense.name)}`,
      name: defense.name,
      duCost: parseManaCost(defense.mana_cost || defense.duCost),
      heroId: defense.heroId || heroIdByName(defense.hero),
      iconUrl: defense.iconUrl,
      stats: defense
    }));
  const mergedTowers = ([...(base.towers || []), ...derivedTowers] as Tower[])
    .reduce((acc: Tower[], tower: Tower) => {
      const exists = acc.find(t => t.name === tower.name);
      if (!exists) acc.push(tower);
      return acc;
    }, []);
  const normalizedShards = ([...(savedData?.shards || []), ...(shardsData as any[])] as any[])
    .map((s: any) => normalizeShard(s, base.heroes))
    .reduce((acc: any[], item: any) => {
      const exists = acc.find(s => s.name === item.name);
      if (!exists) {
        acc.push(item);
      } else {
        const merged: any = { ...exists, ...item };
        merged.iconUrl = item.iconUrl || exists.iconUrl;
        merged.source = item.source || exists.source;
        merged.upgradeLevels = item.upgradeLevels ?? exists.upgradeLevels;
        merged.compatibleSlots = (item.compatibleSlots && item.compatibleSlots.length) ? item.compatibleSlots : exists.compatibleSlots;
        merged.heroes = (item.heroes && item.heroes.length ? item.heroes : exists.heroes) || [];
        merged.heroId = exists.heroId || item.heroId || heroIdByName(merged.heroes?.[0]?.name);
        acc[acc.indexOf(exists)] = merged;
      }
      return acc;
    }, []);
  const normalizedMods = ([...(savedData?.mods || []), ...(modsData as any[])] as any[])
    .map((m: any) => normalizeMod(m, base.heroes))
    .reduce((acc: any[], item: any) => {
      const exists = acc.find(s => s.name === item.name);
      if (!exists) {
        acc.push(item);
      } else {
        const merged: any = { ...exists, ...item };
        merged.iconUrl = item.iconUrl || exists.iconUrl;
        merged.image = item.image || exists.image;
        merged.hero = exists.hero || item.hero;
        merged.heroId = exists.heroId || item.heroId || heroIdByName(merged.hero);
        merged.type = item.type || exists.type;
        merged.compatibleSlots = (item.compatibleSlots && item.compatibleSlots.length) ? item.compatibleSlots : exists.compatibleSlots;
        acc[acc.indexOf(exists)] = merged;
      }
      return acc;
    }, []);
  const normalizedLinks = ([...(savedData?.links || []), ...((linksData as any).resources || [])] as any[])
    .map((l: any) => normalizeLink(l))
    .reduce((acc: any[], item: any) => {
      const exists = acc.find(s => s.name === item.name);
      if (!exists) acc.push(item);
      return acc;
    }, []);
  const ensuredLinks = normalizedLinks.length ? normalizedLinks : ((linksData as any).resources || []).map((l: any) => normalizeLink(l));

  return {
    ...base,
    abilities: abilitiesData as Ability[],
    defenses: normalizedDefenses as Defense[],
    towers: mergedTowers,
    shards: normalizedShards,
    mods: normalizedMods,
    links: ensuredLinks
  };
};
