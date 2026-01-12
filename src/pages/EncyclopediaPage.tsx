import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Cpu, ExternalLink, Shield } from 'lucide-react';
import linksData from '../../data/links/dd2_links.json';
import petAbilitiesData from '../../data/pets/dd2_pet_abilities.json';
import { Card, SearchInput, ThemedSelect } from '../components/ui';
import { formatValue } from '../utils';
import type { DataRegistry, Shard } from '../types';

const EncyclopediaPage = ({
  registry,
  focusTab,
  focusQuery,
  focusToken
}: {
  registry: DataRegistry;
  focusTab?: 'abilities' | 'defenses' | 'mods' | 'shards' | 'links' | 'pets';
  focusQuery?: string | null;
  focusToken?: number;
}) => {
  const [activeTab, setActiveTab] = useState('abilities');
  const [search, setSearch] = useState('');
  const [heroFilter, setHeroFilter] = useState<string>('all');
  const [sortMode, setSortMode] = useState<'hero' | 'name'>('hero');

  useEffect(() => {
    if (!focusTab && !focusQuery) return;
    if (focusTab) setActiveTab(focusTab);
    if (focusQuery) setSearch(focusQuery);
    if (focusQuery) setHeroFilter('all');
  }, [focusTab, focusQuery, focusToken]);

  const heroNameById = (id?: string) => registry.heroes.find(h => h.id === id)?.name || '';
  const heroIdFromName = (name?: string) => registry.heroes.find(h => h.name.toLowerCase() === (name || '').toLowerCase())?.id;
  const heroMatches = (id?: string, fallbackName?: string) => {
    if (heroFilter === 'all') return true;
    if (id === heroFilter) return true;
    const filterName = heroNameById(heroFilter).toLowerCase();
    return (!!fallbackName && fallbackName.toLowerCase() === filterName);
  };

  const filteredAbilities = (registry.abilities || [])
    .filter(a => a.name.toLowerCase().includes(search.toLowerCase()))
    .filter(a => {
      if (heroFilter === 'all') return true;
      return (a.heroes || []).some(hName => heroMatches(heroIdFromName(hName), hName));
    });
  const filteredDefenses = (registry.defenses || [])
    .filter(d => d.name.toLowerCase().includes(search.toLowerCase()))
    .filter(d => heroMatches((d as any).heroId, (d as any).hero));
  const filteredShards = (registry.shards || [])
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    .filter(s => heroMatches((s as Shard).heroId, (s as any).heroes?.[0]?.name));
  const filteredMods = (registry.mods || [])
    .filter(m => m.name.toLowerCase().includes(search.toLowerCase()))
    .filter(m => heroMatches((m as any).heroId, (m as any).hero));
  const filteredLinks = ((registry.links && registry.links.length ? registry.links : (linksData as any).resources) || [])
    .filter((l: any) => l.name.toLowerCase().includes(search.toLowerCase()) || (l.description || '').toLowerCase().includes(search.toLowerCase()) || (l.author || '').toLowerCase().includes(search.toLowerCase()));
  const filteredPetAbilities = useMemo(() => {
    const query = search.toLowerCase();
    return (petAbilitiesData as any[])
      .filter((entry) => entry.name.toLowerCase().includes(query) || (entry.description || '').toLowerCase().includes(query) || (entry.type || '').toLowerCase().includes(query))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [search]);

  const sortItems = <T,>(items: T[], getHeroId: (item: T) => string | undefined, getName: (item: T) => string) => {
    const heroLookup = (id?: string) => heroNameById(id).toLowerCase();
    return [...items].sort((a, b) => {
      const aHero = heroLookup(getHeroId(a));
      const bHero = heroLookup(getHeroId(b));
      if (heroFilter !== 'all') {
        const aMatch = getHeroId(a) === heroFilter;
        const bMatch = getHeroId(b) === heroFilter;
        if (aMatch !== bMatch) return aMatch ? -1 : 1;
      }
      if (sortMode === 'hero' && aHero !== bHero) return aHero.localeCompare(bHero);
      return getName(a).toLowerCase().localeCompare(getName(b).toLowerCase());
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'abilities':
        const abilities = sortItems(
          filteredAbilities,
          (a: any) => (a.heroes || []).map((h: string) => heroIdFromName(h)).find(Boolean),
          (a: any) => a.name
        );
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {(abilities).map((ability, index) => (
              <Card key={index} className="flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  <img src={ability.iconUrl} alt={formatValue(ability.name)} className="w-12 h-12" />
                  <div>
                    <h3 className="text-lg font-bold text-white">{formatValue(ability.name)}</h3>
                    <p className="text-sm text-zinc-400">{formatValue(ability.abilityType)}</p>
                    <p className="text-xs text-zinc-500">{formatValue((ability.heroes || []).join(', '))}</p>
                  </div>
                </div>
                <div className="text-xs text-zinc-400 space-y-1">
                  <div className="flex justify-between"><span>Mana</span><span>{formatValue(ability.manaCost)}</span></div>
                  <div className="flex justify-between"><span>Recharge</span><span>{formatValue(ability.recharge)}</span></div>
                  <div className="flex justify-between"><span>Damage Type</span><span>{formatValue(ability.damageType)}</span></div>
                  <div className="flex justify-between"><span>Damage Scalar</span><span>{formatValue(ability.damageScalar)}</span></div>
                  <div className="flex justify-between"><span>Status Effects</span><span>{formatValue((ability.statusEffects || []).join(', '))}</span></div>
                </div>
              </Card>
            ))}
          </div>
        );
      case 'defenses': {
        const defenses = sortItems(filteredDefenses, (d: any) => d.heroId, (d: any) => d.name);
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {defenses.map((defense, index) => {
              const heroName = heroNameById((defense as any).heroId) || (defense as any).hero || 'Any';
              const defenseType = (defense as any).defense_type || 'Unknown';
              return (
                <Card key={index} className="flex flex-col gap-3">
                  <div className="flex items-center gap-4 mb-4">
                    {defense.iconUrl || (defense as any).image_url ? (
                      <img src={defense.iconUrl || (defense as any).image_url} alt={formatValue(defense.name)} className="w-12 h-12 object-contain" />
                    ) : (
                      <div className="w-12 h-12 rounded bg-zinc-800 flex items-center justify-center text-zinc-500">
                        <Shield size={20} />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-white">{formatValue(defense.name)}</h3>
                      <p className="text-sm text-zinc-400">{formatValue(heroName)}</p>
                      <p className="text-[11px] text-zinc-500 uppercase tracking-wide">{formatValue(defenseType)}</p>
                    </div>
                  </div>
                  <div className="text-xs text-zinc-400 space-y-1">
                    <div className="flex justify-between"><span>Mana</span><span>{formatValue((defense as any).mana_cost || defense.duCost || '0')}</span></div>
                    <div className="flex justify-between"><span>Damage Type</span><span>{(defense as any).damage_type || 'A›ѓ,Єѓ??'}</span></div>
                    <div className="flex justify-between"><span>Status</span><span>{(defense as any).status_effects || 'A›ѓ,Єѓ??'}</span></div>
                    <div className="flex justify-between"><span>Base Power</span><span>{formatValue((defense as any).base_def_power)}</span></div>
                    <div className="flex justify-between"><span>Base Health</span><span>{formatValue((defense as any).base_def_health)}</span></div>
                    <div className="flex justify-between"><span>Atk Rate</span><span>{(defense as any).base_atk_rate || '-'} ѓ+' {(defense as any).max_atk_rate || '-'}</span></div>
                    <div className="flex justify-between"><span>Range</span><span>{(defense as any).base_range || '-'} ѓ+' {(defense as any).max_range || '-'}</span></div>
                    <div className="flex justify-between"><span>Ascension</span><span>Power {formatValue((defense as any).asc_def_power)} / Health {formatValue((defense as any).asc_def_health)}</span></div>
                  </div>
                </Card>
              );
            })}
          </div>
        );
      }
      case 'mods': {
        const mods = sortItems(filteredMods, (m: any) => m.heroId, (m: any) => m.name);
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {mods.map((mod, index) => {
              const heroName = heroNameById((mod as any).heroId) || (mod as any).hero || 'Any';
              const iconSrc = (mod as any).iconUrl || (mod as any).image || (mod as any).icons?.plain;
              return (
                <Card key={index} className="flex flex-col gap-3">
                  <div className="flex items-center gap-4">
                    {iconSrc ? (
                      <img src={iconSrc} alt={formatValue(mod.name)} className="w-12 h-12 object-contain" />
                    ) : (
                      <div className="w-12 h-12 rounded bg-zinc-800 flex items-center justify-center text-zinc-500">
                        <Cpu size={18} />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-white">{formatValue(mod.name)}</h3>
                      <p className="text-sm text-zinc-400">{formatValue(heroName)}</p>
                      <p className="text-[11px] text-zinc-500 uppercase tracking-wide">{formatValue((mod as any).type || 'Mod')}</p>
                    </div>
                  </div>
                  <div className="text-xs text-zinc-400 space-y-1">
                    <div className="flex justify-between"><span>Source</span><span>{formatValue((mod as any).source || 'Unknown')}</span></div>
                    <div className="flex justify-between"><span>Slots</span><span>{formatValue((mod as any).compatibleSlots?.join(', ') || '-')}</span></div>
                  </div>
                  <div className="text-sm text-zinc-300 leading-snug">{formatValue(mod.description)}</div>
                </Card>
              );
            })}
          </div>
        );
      }
      case 'links': {
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLinks.map((link, index) => (
              <Card key={index} className="flex flex-col gap-3">
                <div>
                  <h3 className="text-lg font-bold text-white">{link.name}</h3>
                  <p className="text-sm text-zinc-400">By {link.author}</p>
                </div>
                <p className="text-sm text-zinc-300 leading-snug line-clamp-3">{link.description || 'No description'}</p>
                <a href={link.link} target="_blank" className="text-sm text-red-400 hover:text-red-300 inline-flex items-center gap-1">
                  <ExternalLink size={14} /> Open
                </a>
              </Card>
            ))}
          </div>
        );
      }
      case 'pets': {
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPetAbilities.map((ability, index) => {
              const imageName = `image url ${index + 1}.jpg`;
              const imageSrc = `/pet-ability-images/${encodeURIComponent(imageName)}`;
              return (
                <Card key={`${ability.name}-${index}`} className="flex flex-col gap-3">
                  <div className="flex items-center gap-4">
                    <img src={imageSrc} alt={formatValue(ability.name)} className="w-12 h-12 object-contain" />
                    <div>
                      <h3 className="text-lg font-bold text-white">{formatValue(ability.name)}</h3>
                      <p className="text-sm text-zinc-400">{formatValue(ability.type)}</p>
                      <p className="text-[11px] text-zinc-500 uppercase tracking-wide">Cooldown {formatValue(ability.cooldownSec)}s</p>
                    </div>
                  </div>
                  <div className="text-sm text-zinc-300 leading-snug">{formatValue(ability.description)}</div>
                  {ability.notes && <div className="text-xs text-zinc-500">{formatValue(ability.notes)}</div>}
                </Card>
              );
            })}
          </div>
        );
      }
      case 'shards': {
        const shards = sortItems(filteredShards, (s: Shard) => s.heroId, (s: Shard) => s.name);
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {shards.map((shard, index) => {
              const heroesList = (shard as any).heroes || [];
              const heroName = heroNameById(shard.heroId) || heroesList[0]?.name || '';
              const sourceLabel = typeof shard.source === 'string' ? shard.source : (shard as any).source?.difficulty || 'Unknown';
              const rawSource = (shard as any).source;
              const difficultyIcon = rawSource && typeof rawSource === 'object' ? rawSource.difficultyIcon : undefined;
              const shardIcon = shard.iconUrl || heroesList[0]?.image;
              return (
                <Card key={index} className="flex flex-col gap-3">
                  <div className="flex items-center gap-4">
                    {shardIcon ? (
                      <img src={shardIcon} alt={formatValue(shard.name)} className="w-12 h-12" />
                    ) : (
                      <div className="w-12 h-12 rounded bg-zinc-800 flex items-center justify-center text-zinc-500">
                        <Shield size={18} />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-white">{formatValue(shard.name)}</h3>
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        {difficultyIcon && <img src={difficultyIcon} className="w-4 h-4 object-contain" />}
                        <span>{formatValue(sourceLabel)}</span>
                      </div>
                      {heroName && <p className="text-xs text-zinc-500">{formatValue(heroName)}</p>}
                    </div>
                  </div>
                  <div className="text-xs text-zinc-400 space-y-1">
                    <div className="flex justify-between"><span>Upgrade Levels</span><span>{formatValue((shard as any).upgradeLevels)}</span></div>
                    <div>
                      <span className="text-[11px] uppercase tracking-wide text-zinc-500">Heroes</span>
                      <div className="text-xs text-zinc-300">
                        {formatValue(
                          heroesList
                            .map((h: any) => `${h.name || ''}${h.slot ? ` (${h.slot})` : ''}${h.gilded ? ` - ${h.gilded}` : ''}`)
                            .join('; ')
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-zinc-300 leading-snug">{formatValue(shard.description)}</div>
                </Card>
              );
            })}
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3"><BookOpen className="text-red-500" />Encyclopedia</h1>
          <p className="text-zinc-400">Browse all the data from the game.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3 items-end md:items-center">
            <div className="w-64">
              <SearchInput value={search} onChange={setSearch} placeholder="Search..." />
            </div>
            {activeTab !== 'pets' && (
              <div className="flex gap-2">
                <ThemedSelect value={heroFilter} onChange={(e: any) => setHeroFilter(e.target.value)} className="min-w-[140px]">
                  <option value="all">All Heroes</option>
                  {registry.heroes.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </ThemedSelect>
                <ThemedSelect value={sortMode} onChange={(e: any) => setSortMode(e.target.value as 'hero' | 'name')} className="min-w-[140px]">
                  <option value="hero">Sort by Hero</option>
                  <option value="name">Sort by Name</option>
                </ThemedSelect>
              </div>
            )}
        </div>
      </div>
      {search.trim().length > 0 && (
        <div className="mb-4 flex items-center gap-3 text-xs text-zinc-500">
          <span className="px-3 py-1 rounded-full border border-zinc-800 bg-zinc-950/60 text-zinc-300">
            Filter: {search}
          </span>
          <button
            onClick={() => setSearch('')}
            className="text-xs text-zinc-500 hover:text-zinc-200 border border-zinc-800 rounded-full px-3 py-1"
          >
            Clear filter
          </button>
        </div>
      )}
      <div className="flex border-b border-zinc-800 mb-6">
        <button onClick={() => setActiveTab('abilities')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'abilities' ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-400 hover:text-white'}`}>Abilities</button>
        <button onClick={() => setActiveTab('defenses')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'defenses' ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-400 hover:text-white'}`}>Defenses</button>
        <button onClick={() => setActiveTab('mods')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'mods' ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-400 hover:text-white'}`}>Mods</button>
        <button onClick={() => setActiveTab('shards')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'shards' ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-400 hover:text-white'}`}>Shards</button>
        <button onClick={() => setActiveTab('links')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'links' ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-400 hover:text-white'}`}>Links</button>
        <button onClick={() => setActiveTab('pets')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'pets' ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-400 hover:text-white'}`}>Pet Abilities</button>
      </div>
      {renderContent()}
    </div>
  );
};

export default EncyclopediaPage;
