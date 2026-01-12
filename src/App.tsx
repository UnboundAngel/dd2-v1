import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Folder, Layers, Map, Menu, PawPrint, Plus, Save, Shield, Wrench } from 'lucide-react';
import { Button, SearchInput } from './components/ui';
import { ProfileModal } from './components/ProfileModal';
import { Sidebar } from './components/Sidebar';
import BuildEditor from './pages/BuildEditor';
import ChecklistsPage from './pages/ChecklistsPage';
import EncyclopediaPage from './pages/EncyclopediaPage';
import GoldCalculator from './pages/GoldCalculator';
import HeroesPage from './pages/HeroesPage';
import MapPlanner from './pages/MapPlanner';
import SettingsPage from './pages/SettingsPage';
import { buildInitialRegistry, normalizeDefense, normalizeLink, normalizeMod, normalizeShard } from './data/registry';
import { loadProfile } from './data/profile';
import type { DataRegistry, ProfileData } from './types';
import { fuzzyScore } from './utils';
import { PROFILE_THEME_HEX } from './constants';
import petAbilitiesData from '../data/pets/dd2_pet_abilities.json';

type SearchAction =
  | { type: 'hero'; id: string }
  | { type: 'build'; id: string }
  | { type: 'checklist'; id: string }
  | { type: 'encyclopedia'; tab: 'abilities' | 'defenses' | 'mods' | 'shards' | 'links' | 'pets'; query: string }
  | { type: 'map'; id: string };

type SearchItem = {
  id: string;
  label: string;
  category: string;
  page: string;
  subtitle?: string;
  keywords?: string;
  action?: SearchAction;
};

const FONT_OPTIONS = [
  {
    id: 'code-jetbrains',
    label: 'Code: JetBrains Mono',
    stack: '"JetBrains Mono","Fira Code","Cascadia Code","Consolas","Menlo","Monaco","Liberation Mono","Courier New",monospace'
  },
  {
    id: 'code-fira',
    label: 'Code: Fira Code',
    stack: '"Fira Code","JetBrains Mono","Cascadia Code","Consolas","Menlo","Monaco","Liberation Mono","Courier New",monospace'
  },
  {
    id: 'code-cascadia',
    label: 'Code: Cascadia Code',
    stack: '"Cascadia Code","JetBrains Mono","Fira Code","Consolas","Menlo","Monaco","Liberation Mono","Courier New",monospace'
  },
  {
    id: 'gothic',
    label: 'Gothic: Blackletter',
    stack: '"Pirata One","UnifrakturMaguntia","Old English Text MT","Blackletter","Palatino Linotype","Times New Roman",serif'
  },
  {
    id: 'kawaii',
    label: 'Kawaii: Playful',
    stack: '"Comic Sans MS","Comic Neue","Chalkboard SE","Marker Felt","Segoe Print","Trebuchet MS",cursive'
  },
  {
    id: 'arcade',
    label: 'Arcade: Pixel',
    stack: '"Press Start 2P","VT323","Pixel Operator","Courier New",monospace'
  },
  {
    id: 'system',
    label: 'System UI',
    stack: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif'
  }
];

const hexToRgb = (hex: string) => {
  let cleaned = hex.replace('#', '').trim();
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map(char => char + char).join('');
  }
  const parsed = parseInt(cleaned, 16);
  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255
  };
};

const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;

const mixColor = (a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }, amount: number) => ({
  r: Math.round(a.r + (b.r - a.r) * amount),
  g: Math.round(a.g + (b.g - a.g) * amount),
  b: Math.round(a.b + (b.b - a.b) * amount)
});

export default function App() {
  const [activePage, setActivePage] = useState('checklists');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [registry, setRegistry] = useState<DataRegistry>(() => buildInitialRegistry());
  const [profile, setProfile] = useState<ProfileData>(() => loadProfile());
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTarget, setSearchTarget] = useState<{ action: SearchAction; token: number } | null>(null);
  const [fontChoice, setFontChoice] = useState(() => localStorage.getItem('dd2_font') || 'code-jetbrains');
  const searchRef = useRef<HTMLDivElement>(null);
  const activeAction = searchTarget?.action;
  const activeFont = FONT_OPTIONS.find(option => option.id === fontChoice) || FONT_OPTIONS[0];
  const accentHex = PROFILE_THEME_HEX[profile.themeColor] || PROFILE_THEME_HEX.red;
  const accentRgb = hexToRgb(accentHex);
  const lightMix = mixColor(accentRgb, { r: 255, g: 255, b: 255 }, 0.35);
  const darkMix = mixColor(accentRgb, { r: 0, g: 0, b: 0 }, 0.35);
  const accentLight = rgbToHex(lightMix.r, lightMix.g, lightMix.b);
  const accentDark = rgbToHex(darkMix.r, darkMix.g, darkMix.b);

  useEffect(() => {
    localStorage.setItem('dd2_planner_data', JSON.stringify(registry));
  }, [registry]);

  useEffect(() => {
    localStorage.setItem('dd2_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('dd2_font', fontChoice);
  }, [fontChoice]);

  useEffect(() => {
    if (activePage !== 'encyclopedia') {
      setSearchTarget(null);
      setSearchQuery('');
      setSearchOpen(false);
    }
  }, [activePage, searchTarget]);

  useEffect(() => {
    if (!searchOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [searchOpen]);

  const searchItems = useMemo<SearchItem[]>(() => {
    const items: SearchItem[] = [
      { id: 'tool-maps', label: 'Map Planner', category: 'Tools', page: 'maps', subtitle: 'Layouts, DU, lanes', keywords: 'maps planner' },
      { id: 'tool-gold', label: 'Gold Calculator', category: 'Tools', page: 'gold', subtitle: 'Runs, resets, projections', keywords: 'gold calculator' },
      { id: 'tool-builds', label: 'Build Editor', category: 'Tools', page: 'builds', subtitle: 'Shards, mods, builds', keywords: 'builds editor' },
      { id: 'tool-heroes', label: 'Heroes Library', category: 'Tools', page: 'heroes', subtitle: 'Roster and loadouts', keywords: 'heroes library' },
      { id: 'tool-checklists', label: 'Collection Tracker', category: 'Tools', page: 'checklists', subtitle: 'Lists and notes', keywords: 'collections tracker' },
      { id: 'tool-encyclopedia', label: 'Encyclopedia', category: 'Tools', page: 'encyclopedia', subtitle: 'Game data index', keywords: 'encyclopedia data' },
      { id: 'tool-settings', label: 'Settings', category: 'Tools', page: 'settings', subtitle: 'Imports and preferences', keywords: 'settings' }
    ];

    registry.maps.forEach(map => {
      items.push({
        id: `map-${map.id}`,
        label: map.name,
        category: 'Maps',
        page: 'maps',
        subtitle: map.difficulty,
        action: { type: 'map', id: map.id }
      });
    });

    registry.heroes.forEach(hero => {
      items.push({
        id: `hero-${hero.id}`,
        label: hero.name,
        category: 'Heroes',
        page: 'heroes',
        subtitle: hero.class,
        keywords: hero.roleTags.join(' '),
        action: { type: 'hero', id: hero.id }
      });
    });

    registry.builds.forEach(build => {
      const heroName = registry.heroes.find(h => h.id === build.heroId)?.name || 'Unknown';
      items.push({
        id: `build-${build.id}`,
        label: build.name,
        category: 'Builds',
        page: 'builds',
        subtitle: heroName,
        action: { type: 'build', id: build.id }
      });
    });

    registry.checklists.forEach(list => {
      items.push({
        id: `checklist-${list.id}`,
        label: list.title,
        category: 'Collections',
        page: 'checklists',
        subtitle: list.category,
        action: { type: 'checklist', id: list.id }
      });
    });

    (registry.abilities || []).forEach(ability => {
      items.push({
        id: `ability-${ability.name}`,
        label: ability.name,
        category: 'Abilities',
        page: 'encyclopedia',
        subtitle: ability.abilityType,
        keywords: (ability.heroes || []).join(' '),
        action: { type: 'encyclopedia', tab: 'abilities', query: ability.name }
      });
    });

    (registry.defenses || []).forEach(defense => {
      items.push({
        id: `defense-${defense.name}`,
        label: defense.name,
        category: 'Defenses',
        page: 'encyclopedia',
        subtitle: (defense as any).defense_type || 'Defense',
        keywords: (defense as any).hero || '',
        action: { type: 'encyclopedia', tab: 'defenses', query: defense.name }
      });
    });

    registry.shards.forEach(shard => {
      items.push({
        id: `shard-${shard.id}`,
        label: shard.name,
        category: 'Shards',
        page: 'encyclopedia',
        subtitle: typeof shard.source === 'string' ? shard.source : (shard as any).source?.difficulty || 'Shard',
        keywords: (shard.compatibleSlots || []).join(' '),
        action: { type: 'encyclopedia', tab: 'shards', query: shard.name }
      });
    });

    registry.mods.forEach(mod => {
      items.push({
        id: `mod-${mod.id}`,
        label: mod.name,
        category: 'Mods',
        page: 'encyclopedia',
        subtitle: mod.type || 'Mod',
        keywords: (mod.compatibleSlots || []).join(' '),
        action: { type: 'encyclopedia', tab: 'mods', query: mod.name }
      });
    });

    registry.links.forEach(link => {
      items.push({
        id: `link-${link.name}`,
        label: link.name,
        category: 'Links',
        page: 'encyclopedia',
        subtitle: link.author,
        keywords: link.description || '',
        action: { type: 'encyclopedia', tab: 'links', query: link.name }
      });
    });

    (petAbilitiesData as any[]).forEach((pet, index) => {
      items.push({
        id: `pet-${index}-${pet.name}`,
        label: pet.name,
        category: 'Pet Abilities',
        page: 'encyclopedia',
        subtitle: pet.type || 'Pet Ability',
        keywords: `${pet.description || ''} ${pet.notes || ''}`,
        action: { type: 'encyclopedia', tab: 'pets', query: pet.name }
      });
    });

    return items;
  }, [registry]);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim();
    if (!query) return [];
    return searchItems
      .map(item => {
        const text = `${item.label} ${item.subtitle || ''} ${item.keywords || ''} ${item.category}`;
        const score = fuzzyScore(query, text);
        if (score === null) return null;
        return { item, score };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 60)
      .map((entry: any) => entry.item as SearchItem);
  }, [searchItems, searchQuery]);

  const categoryOrder = ['Tools', 'Heroes', 'Maps', 'Builds', 'Collections', 'Abilities', 'Defenses', 'Shards', 'Mods', 'Links', 'Pet Abilities'];
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchItem[]> = {};
    searchResults.forEach(result => {
      if (!groups[result.category]) groups[result.category] = [];
      if (groups[result.category].length < 6) groups[result.category].push(result);
    });
    return groups;
  }, [searchResults]);

  const handleResultSelect = (item: SearchItem) => {
    setActivePage(item.page);
    setMobileOpen(false);
    setSearchOpen(false);
    if (item.action) {
      setSearchTarget({ action: item.action, token: Date.now() });
    } else {
      setSearchTarget(null);
    }
  };

  const handleDataImport = ({ type, data, filename }: any) => {
    setRegistry(prev => {
      const next = { ...prev };
      const getHeroIdByName = (name: string) => prev.heroes.find(h => h.name.toLowerCase() === name?.toLowerCase())?.id || 'unknown';

      if (type === 'towers' || filename.includes('defenses')) {
        const rawTowers = Array.isArray(data) ? data : (data.materials || []);
        const newTowers = rawTowers
          .filter((t: any) => t.defense_type === 'Tower' || t.base_def_power)
          .map((t: any) => ({
            id: `t_${Math.random().toString(36).slice(2, 9)}`,
            name: t.name || t.material,
            duCost: parseInt(t.mana_cost, 10) || 0,
            heroId: getHeroIdByName(t.hero),
            iconUrl: t.image_url || t.icons?.plain,
            stats: t
          }));
        next.towers = [...next.towers, ...newTowers];
        next.defenses = [...next.defenses, ...rawTowers.map((d: any) => normalizeDefense(d, prev.heroes))];
      }

      if (type === 'shards' || filename.includes('shards')) {
        const rawShards = Array.isArray(data) ? data : (data.shards || []);
        const newShards = rawShards.map((s: any) => normalizeShard(s, prev.heroes));
        next.shards = [...next.shards, ...newShards];
      }

      if (type === 'mods' || filename.includes('mods')) {
        const rawMods = Array.isArray(data) ? data : (data.mods || []);
        const newMods = rawMods.map((m: any) => normalizeMod(m, prev.heroes));
        next.mods = [...next.mods, ...newMods];
      }

      if (type === 'links' || filename.includes('links')) {
        const rawLinks = Array.isArray(data) ? data : (data.resources || []);
        const newLinks = rawLinks.map((l: any) => normalizeLink(l));
        next.links = [...next.links, ...newLinks];
      }

      if (filename.includes('abilities')) {
        next.abilities = data;
      }

      return next;
    });
  };

  const forceSave = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(registry));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', 'dd2_planner_backup.json');
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const renderContent = () => {
    switch (activePage) {
      case 'maps':
        return <MapPlanner registry={registry} />;
      case 'gold':
        return <GoldCalculator />;
      case 'builds':
        return (
          <BuildEditor
            registry={registry}
            setRegistry={setRegistry}
            focusBuildId={activeAction?.type === 'build' ? activeAction.id : null}
            focusHeroId={activeAction?.type === 'hero' ? activeAction.id : null}
            focusToken={searchTarget?.token}
          />
        );
      case 'heroes':
        return (
          <HeroesPage
            registry={registry}
            focusHeroId={activeAction?.type === 'hero' ? activeAction.id : null}
            focusToken={searchTarget?.token}
          />
        );
      case 'checklists':
        return (
          <ChecklistsPage
            registry={registry}
            setRegistry={setRegistry}
            focusListId={activeAction?.type === 'checklist' ? activeAction.id : null}
            focusToken={searchTarget?.token}
          />
        );
      case 'encyclopedia':
        return (
          <EncyclopediaPage
            registry={registry}
            focusTab={activeAction?.type === 'encyclopedia' ? activeAction.tab : undefined}
            focusQuery={activeAction?.type === 'encyclopedia' ? activeAction.query : null}
            focusToken={searchTarget?.token}
          />
        );
      case 'settings':
        return (
          <SettingsPage
            onImport={handleDataImport}
            fontChoice={fontChoice}
            onFontChange={setFontChoice}
            fontOptions={FONT_OPTIONS}
          />
        );
      default:
        return <HeroesPage registry={registry} />;
    }
  };

  return (
    <div
      className="accent-theme flex h-screen bg-zinc-950 text-zinc-200 font-sans"
      style={{
        fontFamily: activeFont.stack,
        ['--accent' as any]: accentHex,
        ['--accent-rgb' as any]: `${accentRgb.r} ${accentRgb.g} ${accentRgb.b}`,
        ['--accent-light' as any]: accentLight,
        ['--accent-dark' as any]: accentDark
      }}
    >
      <Sidebar
        activePage={activePage}
        setPage={setActivePage}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        profile={profile}
        registry={registry}
        onOpenProfile={() => { setProfileOpen(true); setMobileOpen(false); }}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4 flex-1">
            <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-zinc-100"><Menu size={20} /></button>
            <div className="max-w-md w-full hidden md:block relative" ref={searchRef} onFocus={() => setSearchOpen(true)}>
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search tools, heroes, shards..."
                onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
                  if (event.key === 'Escape') setSearchOpen(false);
                }}
              />
              {searchQuery.trim().length > 0 && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSearchOpen(false);
                    setSearchTarget(null);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200"
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
              {searchOpen && (
                <div className="absolute mt-2 w-full rounded-2xl border border-zinc-800 bg-zinc-950/95 backdrop-blur-xl shadow-2xl z-40 overflow-hidden">
                  {searchQuery.trim().length === 0 ? (
                    <div className="p-4 text-sm text-zinc-500">Type to search the entire app.</div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-4 text-sm text-zinc-500">No matches found.</div>
                  ) : (
                    <div className="max-h-[420px] overflow-y-auto red-scrollbar">
                      {categoryOrder.map(category => {
                        const items = groupedResults[category];
                        if (!items || items.length === 0) return null;
                        let Icon = Folder;
                        if (category === 'Tools') Icon = Wrench;
                        if (category === 'Heroes') Icon = Shield;
                        if (category === 'Maps') Icon = Map;
                        if (category === 'Builds') Icon = Layers;
                        if (category === 'Collections') Icon = Layers;
                        if (category === 'Abilities') Icon = BookOpen;
                        if (category === 'Defenses') Icon = Shield;
                        if (category === 'Shards') Icon = Shield;
                        if (category === 'Mods') Icon = Wrench;
                        if (category === 'Links') Icon = BookOpen;
                        if (category === 'Pet Abilities') Icon = PawPrint;
                        return (
                          <div key={category} className="border-b border-zinc-900 last:border-b-0">
                            <div className="flex items-center gap-2 px-4 py-2 text-[10px] uppercase tracking-widest text-zinc-500">
                              <Icon size={12} className="text-zinc-500" /> {category}
                            </div>
                            <div className="px-2 pb-2 space-y-1">
                              {items.map(item => (
                                <button
                                  key={item.id}
                                  onClick={() => handleResultSelect(item)}
                                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-900/80 transition-colors"
                                >
                                  <div className="text-sm text-white">{item.label}</div>
                                  <div className="text-[11px] text-zinc-500">{item.subtitle || item.category}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="icon" icon={Save} onClick={forceSave} />
            <Button variant="primary" size="sm" icon={Plus} onClick={() => setActivePage('builds')}>Quick Add</Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-black/20">{renderContent()}</main>
      </div>

      <ProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        profile={profile}
        setProfile={setProfile}
        registry={registry}
      />
    </div>
  );
}
