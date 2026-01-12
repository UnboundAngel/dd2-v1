import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Filter, Flame, Shield, Sparkles, Sword, User } from 'lucide-react';
import { HeroImage } from '../components/HeroImage';
import { Modal, SearchInput } from '../components/ui';
import type { DataRegistry, Hero } from '../types';

type SelectOption = { value: string; label: string; hero?: Hero; icon?: React.ReactNode };

const highlightText = (text: string, query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return text;
  const lower = text.toLowerCase();
  const parts: React.ReactNode[] = [];
  let start = 0;
  let idx = lower.indexOf(q, start);
  while (idx !== -1) {
    if (idx > start) parts.push(text.slice(start, idx));
    parts.push(
      <span key={`${text}-${idx}`} className="px-1 rounded bg-red-900/30 text-red-100">
        {text.slice(idx, idx + q.length)}
      </span>
    );
    start = idx + q.length;
    idx = lower.indexOf(q, start);
  }
  if (start < text.length) parts.push(text.slice(start));
  return <>{parts}</>;
};

const GlassSelect = ({
  value,
  options,
  onChange,
  className = '',
  placeholder = 'Select...'
}: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const current = options.find(option => option.value === value);
  const hasIcons = options.some(option => option.hero || option.icon);

  const renderIcon = (option?: SelectOption) => {
    if (option?.icon) {
      return (
        <div className="w-6 h-6 rounded-full bg-zinc-900/60 border border-zinc-700 flex items-center justify-center">
          {option.icon}
        </div>
      );
    }
    if (option?.hero) {
      return (
        <div className={`w-6 h-6 rounded-full ${option.hero.color} flex items-center justify-center overflow-hidden border border-white/10`}>
          <HeroImage hero={option.hero} className="w-full h-full object-cover" fallback={<User size={12} className="text-white" />} />
        </div>
      );
    }
    return (
      <div className="w-6 h-6 rounded-full border border-zinc-700 bg-zinc-900/60" />
    );
  };

  useEffect(() => {
    if (!open) return;
    const handleOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpen(prev => !prev);
    }
    if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center justify-between px-4 py-2 rounded-full border text-sm font-medium transition-all bg-gradient-to-r from-zinc-950/80 via-zinc-950 to-zinc-900/90 text-zinc-200 ${
          open ? 'border-red-600 shadow-[0_0_18px_rgba(var(--accent-rgb),0.2)]' : 'border-zinc-800 hover:border-zinc-700'
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          {hasIcons && renderIcon(current)}
          <span className={current ? 'text-zinc-200' : 'text-zinc-500'}>{current?.label || placeholder}</span>
        </span>
        <ChevronDown size={14} className={`text-red-300 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute z-50 mt-2 w-full rounded-2xl border border-zinc-800/80 bg-zinc-950/95 backdrop-blur-xl shadow-2xl overflow-hidden"
        >
          <div className="max-h-64 overflow-y-auto red-scrollbar p-1">
            {options.map(option => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
                  option.value === value
                    ? 'bg-zinc-900 border border-red-700/40 text-white'
                    : 'text-zinc-300 hover:bg-zinc-900/80 border border-transparent'
                }`}
              >
                {hasIcons && renderIcon(option)}
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const HeroCard = ({
  hero,
  isActive,
  onClick,
  query
}: {
  hero: Hero;
  isActive: boolean;
  onClick: () => void;
  query: string;
}) => {
  const tagPreview = hero.roleTags.slice(0, 2);
  const extraTags = Math.max(0, hero.roleTags.length - tagPreview.length);
  const showTags = isActive || query.trim().length > 0;
  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-3xl border p-4 text-left transition-all backdrop-blur-lg ${
        isActive
          ? 'border-red-500/60 bg-zinc-900/70 shadow-[0_0_18px_rgba(var(--accent-rgb),0.18)]'
          : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-900/60'
      }`}
    >
      <div className={`absolute inset-y-0 left-0 w-1 ${hero.color} opacity-60`} />
      <div className="relative flex items-center gap-4">
        <div className={`w-14 h-14 rounded-2xl ${hero.color} bg-opacity-40 flex items-center justify-center overflow-hidden border border-white/10`}>
          <HeroImage hero={hero} className="w-full h-full object-cover" fallback={<User size={20} className="text-white" />} />
        </div>
        <div className="flex-1">
          <div className="text-base font-semibold text-white">{highlightText(hero.name, query)}</div>
          <div className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">{highlightText(hero.class, query)}</div>
        </div>
        <div className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-red-500 shadow-[0_0_10px_rgba(var(--accent-rgb),0.7)]' : 'bg-zinc-700'}`} />
      </div>
      <div
        className={`relative mt-3 flex flex-wrap gap-2 text-[9px] uppercase tracking-widest transition-all ${
          showTags ? 'opacity-100' : 'opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0'
        }`}
      >
        {tagPreview.map(tag => (
          <span key={tag} className="px-2 py-0.5 rounded-full border border-zinc-800 text-zinc-300 bg-zinc-900/60">
            {highlightText(tag, query)}
          </span>
        ))}
        {extraTags > 0 && (
          <span className="px-2 py-0.5 rounded-full border border-zinc-800 text-zinc-400 bg-zinc-900/40">
            +{extraTags}
          </span>
        )}
      </div>
    </button>
  );
};

const HeroesPage = ({
  registry,
  focusHeroId,
  focusToken
}: {
  registry: DataRegistry;
  focusHeroId?: string | null;
  focusToken?: number;
}) => {
  const [search, setSearch] = useState('');
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(registry.heroes[0]?.id || null);
  const [dossierOpen, setDossierOpen] = useState(false);
  const [preview, setPreview] = useState<{ type: 'ability' | 'defense'; data: any } | null>(null);
  const [activeRoles, setActiveRoles] = useState<string[]>([]);
  const [activeClass, setActiveClass] = useState('all');
  const [sortKey, setSortKey] = useState<'name' | 'class'>('name');

  const roleTags = useMemo(() => {
    const tags = new Set<string>();
    registry.heroes.forEach(hero => hero.roleTags.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [registry.heroes]);

  const classTags = useMemo(() => {
    const tags = new Set<string>();
    registry.heroes.forEach(hero => tags.add(hero.class));
    return Array.from(tags).sort();
  }, [registry.heroes]);

  const classOptions = useMemo(
    () => [
      { value: 'all', label: 'All Classes', icon: <Filter size={12} className="text-zinc-300" /> },
      ...classTags.map(tag => ({
        value: tag,
        label: tag,
        hero: registry.heroes.find(hero => hero.class === tag)
      }))
    ],
    [classTags, registry.heroes]
  );

  const sortOptions = useMemo(
    () => [
      { value: 'name', label: 'Sort by Name' },
      { value: 'class', label: 'Sort by Class' }
    ],
    []
  );

  const filteredHeroes = useMemo(() => {
    const query = search.toLowerCase();
    const filtered = registry.heroes.filter(hero => {
      const matchesQuery = hero.name.toLowerCase().includes(query) || hero.class.toLowerCase().includes(query);
      const matchesRoles = activeRoles.length === 0 || activeRoles.some(role => hero.roleTags.includes(role));
      const matchesClass = activeClass === 'all' || hero.class === activeClass;
      return matchesQuery && matchesRoles && matchesClass;
    });

    return filtered.sort((a, b) => {
      const aValue = sortKey === 'name' ? a.name : a.class;
      const bValue = sortKey === 'name' ? b.name : b.class;
      return aValue.localeCompare(bValue);
    });
  }, [activeClass, activeRoles, registry.heroes, search, sortKey]);

  useEffect(() => {
    if (!selectedHeroId && filteredHeroes[0]) {
      setSelectedHeroId(filteredHeroes[0].id);
    }
    if (selectedHeroId && !filteredHeroes.find(hero => hero.id === selectedHeroId)) {
      setSelectedHeroId(filteredHeroes[0]?.id || null);
    }
  }, [filteredHeroes, selectedHeroId]);

  const selectedHero = registry.heroes.find(hero => hero.id === selectedHeroId) || filteredHeroes[0];
  const heroName = selectedHero?.name?.toLowerCase();

  const heroAbilities = (registry.abilities || []).filter(ability => (ability.heroes || []).some(h => h.toLowerCase() === heroName));
  const heroDefenses = (registry.defenses || []).filter(defense => {
    if ((defense as any).heroId && (defense as any).heroId === selectedHero?.id) return true;
    const heroField = (defense as any).hero;
    return typeof heroField === 'string' && heroField.toLowerCase() === heroName;
  });

  useEffect(() => {
    if (!selectedHero) return;
    if (heroAbilities.length > 0) {
      setPreview({ type: 'ability', data: heroAbilities[0] });
    } else if (heroDefenses.length > 0) {
      setPreview({ type: 'defense', data: heroDefenses[0] });
    } else {
      setPreview(null);
    }
  }, [selectedHeroId, heroAbilities.length, heroDefenses.length, selectedHero]);

  useEffect(() => {
    if (!focusHeroId) return;
    setSelectedHeroId(focusHeroId);
    setDossierOpen(true);
  }, [focusHeroId, focusToken]);

  useEffect(() => {
    if (!selectedHero && dossierOpen) setDossierOpen(false);
  }, [dossierOpen, selectedHero]);

  const toggleRole = (role: string) => {
    setActiveRoles(prev => (prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]));
  };

  const clearFilters = () => {
    setActiveRoles([]);
    setActiveClass('all');
    setSearch('');
  };

  return (
    <div className="relative p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="absolute inset-0 -z-10">
      <div className="absolute -top-24 right-10 w-72 h-72 rounded-full bg-zinc-700/10 blur-[140px]" />
      <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-zinc-800/10 blur-[120px]" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(24,24,27,0.7),transparent_40%)]" />
    </div>

      <header className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 text-sm uppercase tracking-[0.35em] text-zinc-400">
            <Flame size={16} className="text-red-500" /> Hero Codex
          </div>
          <h1 className="text-3xl font-black text-white mt-2">Heroes</h1>
          <div className="flex items-center gap-3 mt-3 text-xs text-zinc-500">
            <span className="flex items-center gap-2"><Shield size={12} className="text-zinc-400" />{filteredHeroes.length} shown</span>
            <span className="flex items-center gap-2"><Sword size={12} />{registry.heroes.length} total</span>
            <span className="flex items-center gap-2"><Filter size={12} />{roleTags.length} roles</span>
          </div>
        </div>
      </header>

      <section className="space-y-6">
        <div className="relative z-20 overflow-visible rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl p-4 space-y-4 shadow-[0_0_25px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
              <Filter size={14} className="text-red-400" /> Filters
            </div>
            <button onClick={clearFilters} className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-zinc-300">Clear</button>
          </div>
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1">
              <SearchInput value={search} onChange={setSearch} placeholder="Search heroes, classes, roles..." />
            </div>
            <GlassSelect
              className="lg:w-48"
              value={activeClass}
              options={classOptions}
              onChange={setActiveClass}
              placeholder="All Classes"
            />
            <GlassSelect
              className="lg:w-44"
              value={sortKey}
              options={sortOptions}
              onChange={(value) => setSortKey(value as 'name' | 'class')}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 mr-2">Roles</span>
            {roleTags.map(role => (
              <button
                key={role}
                onClick={() => toggleRole(role)}
                className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest border ${activeRoles.includes(role) ? 'border-red-500/60 text-white bg-zinc-900/60' : 'border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'}`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        <div className="relative z-0 rounded-3xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl p-5 shadow-[0_0_30px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Hero Roster</div>
            <div className="text-xs text-zinc-500">{filteredHeroes.length} shown</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[640px] overflow-y-auto pr-1 red-scrollbar">
            {filteredHeroes.map(hero => (
              <HeroCard
                key={hero.id}
                hero={hero}
                isActive={selectedHeroId === hero.id}
                query={search}
                onClick={() => {
                  setSelectedHeroId(hero.id);
                  setDossierOpen(true);
                }}
              />
            ))}
          </div>
        </div>
      </section>

      <Modal
        isOpen={dossierOpen && !!selectedHero}
        onClose={() => setDossierOpen(false)}
        title={selectedHero ? `${selectedHero.name} Loadout` : 'Hero Loadout'}
        size="xl"
        className="bg-zinc-950/70 backdrop-blur-2xl border-zinc-800/80 shadow-[0_0_30px_rgba(0,0,0,0.6)]"
      >
        {selectedHero ? (
          <div className="space-y-5">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className={`w-24 h-24 rounded-2xl ${selectedHero.color} bg-opacity-40 border border-white/10 overflow-hidden flex items-center justify-center`}>
                <HeroImage hero={selectedHero} className="w-full h-full object-contain p-3" fallback={<User size={40} className="text-white" />} />
              </div>
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-400">Hero Dossier</div>
                <h2 className="text-2xl font-black text-white mt-2">{selectedHero.name}</h2>
                <p className="text-sm text-zinc-400">{selectedHero.class}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedHero.roleTags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-full border border-zinc-800 text-[10px] uppercase tracking-widest text-zinc-200 bg-zinc-900/60">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl p-3 text-center min-w-[90px]">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500">Abilities</div>
                  <div className="text-lg font-semibold text-white mt-1">{heroAbilities.length}</div>
                </div>
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl p-3 text-center min-w-[90px]">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500">Defenses</div>
                  <div className="text-lg font-semibold text-white mt-1">{heroDefenses.length}</div>
                </div>
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl p-3 text-center min-w-[90px]">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500">Slots</div>
                  <div className="text-lg font-semibold text-white mt-1">{selectedHero.equipmentSlots?.length || 0}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Abilities</h3>
                  <span className="text-xs text-zinc-500">{heroAbilities.length}</span>
                </div>
                <div className="space-y-2 mt-4 max-h-[260px] overflow-y-auto pr-1 red-scrollbar">
                  {heroAbilities.length === 0 && <span className="text-xs text-zinc-500">No abilities found.</span>}
                  {heroAbilities.map((ab, idx) => {
                    const active = preview?.type === 'ability' && preview.data === ab;
                    return (
                      <button
                        key={idx}
                        onMouseEnter={() => setPreview({ type: 'ability', data: ab })}
                        onClick={() => setPreview({ type: 'ability', data: ab })}
                        className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors ${
                          active ? 'border-red-500 bg-zinc-900/70' : 'border-zinc-800 bg-zinc-950/70 hover:border-zinc-700'
                        }`}
                      >
                        <img src={ab.iconUrl} alt={ab.name} className="w-9 h-9 object-contain" />
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-white">{ab.name}</div>
                          <div className="text-xs text-zinc-500">{ab.abilityType || 'Ability'}</div>
                        </div>
                        <div className="text-xs text-zinc-400">Mana {ab.manaCost ?? '-'}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Defenses</h3>
                  <span className="text-xs text-zinc-500">{heroDefenses.length}</span>
                </div>
                <div className="space-y-2 mt-4 max-h-[260px] overflow-y-auto pr-1 red-scrollbar">
                  {heroDefenses.length === 0 && <span className="text-xs text-zinc-500">No defenses found.</span>}
                  {heroDefenses.map((def, idx) => {
                    const active = preview?.type === 'defense' && preview.data === def;
                    return (
                      <button
                        key={idx}
                        onMouseEnter={() => setPreview({ type: 'defense', data: def })}
                        onClick={() => setPreview({ type: 'defense', data: def })}
                        className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors ${
                          active ? 'border-red-500 bg-zinc-900/70' : 'border-zinc-800 bg-zinc-950/70 hover:border-zinc-700'
                        }`}
                      >
                        {def.iconUrl || (def as any).image_url ? (
                          <img src={def.iconUrl || (def as any).image_url} alt={(def as any).name} className="w-9 h-9 object-contain" />
                        ) : (
                          <div className="w-9 h-9 rounded-xl border border-zinc-800 flex items-center justify-center">
                            <Shield size={14} className="text-zinc-500" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-white">{def.name}</div>
                          <div className="text-xs text-zinc-500">{(def as any).defense_type || 'Defense'}</div>
                        </div>
                        <div className="text-xs text-zinc-400">Mana {(def as any).mana_cost || '-'}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl p-4 shadow-[0_0_20px_rgba(0,0,0,0.4)]">
              <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-400">Preview</div>
              <div className="mt-3">
                {preview ? (
                  preview.type === 'ability' ? (
                    <div className="flex items-start gap-4">
                      <img src={preview.data.iconUrl} className="w-12 h-12 object-contain" />
                      <div>
                        <div className="text-lg font-bold text-white">{preview.data.name}</div>
                        <div className="text-xs text-zinc-400">{preview.data.abilityType || 'Ability'}</div>
                        <div className="text-sm text-zinc-300 mt-2">Mana: {preview.data.manaCost ?? '-'}</div>
                        {preview.data.damageType && <div className="text-sm text-zinc-300">Damage: {preview.data.damageType}</div>}
                        {preview.data.statusEffects?.length > 0 && <div className="text-sm text-zinc-300">Effects: {preview.data.statusEffects.join(', ')}</div>}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-4">
                      {preview.data.iconUrl || (preview.data as any).image_url ? (
                        <img src={preview.data.iconUrl || (preview.data as any).image_url} className="w-12 h-12 object-contain" />
                      ) : <Shield size={20} className="text-zinc-500" />}
                      <div>
                        <div className="text-lg font-bold text-white">{preview.data.name}</div>
                        <div className="text-xs text-zinc-400">{(preview.data as any).defense_type || 'Defense'}</div>
                        <div className="text-sm text-zinc-300 mt-2">Mana: {(preview.data as any).mana_cost || '-'}</div>
                        {(preview.data as any).damage_type && <div className="text-sm text-zinc-300">Damage: {(preview.data as any).damage_type}</div>}
                        {(preview.data as any).status_effects && <div className="text-sm text-zinc-300">Status: {(preview.data as any).status_effects}</div>}
                      </div>
                    </div>
                  )
                ) : (
                  <div className="text-sm text-zinc-500">Select an ability or defense to see details.</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-zinc-500">No hero selected.</div>
        )}
      </Modal>
    </div>
  );
};

export default HeroesPage;
