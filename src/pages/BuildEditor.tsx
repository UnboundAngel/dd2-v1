import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Crosshair, Hammer, Palette, Plus, Save, User, X } from 'lucide-react';
import { CUSTOM_COLORS, SLOT_CONFIG, STANDARD_SLOTS } from '../constants';
import { Button, Modal } from '../components/ui';
import { HeroImage } from '../components/HeroImage';
import type { Build, DataRegistry } from '../types';

const SelectionModal = ({ isOpen, onClose, items, onSelect, title }: any) => {
  const [search, setSearch] = useState('');
  if (!isOpen) return null;

  const filtered = items.filter((i: any) => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="mb-4"><input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-zinc-200 focus:border-red-500 outline-none" /></div>
      <div className="space-y-2">
        {filtered.map((item: any) => (
          <div key={item.id} onClick={() => onSelect(item)} className="p-3 rounded bg-zinc-900 border border-zinc-800 hover:border-red-500 cursor-pointer flex justify-between items-center group">
            <div className="flex items-center gap-3">
              {item.iconUrl && <img src={item.iconUrl} className="w-8 h-8 rounded bg-black object-contain" />}
              <div>
                <div className="font-medium text-zinc-200 group-hover:text-white">{item.name}</div>
                <div className="text-xs text-zinc-500 line-clamp-2">
                  {typeof item.description === 'string' ? item.description : 'Details available'}
                </div>
              </div>
            </div>
            <Plus size={16} className="text-zinc-600 group-hover:text-red-500" />
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center text-zinc-500 py-4">No matching items found.</div>}
      </div>
    </Modal>
  );
};

const BuildEditor = ({
  registry,
  setRegistry,
  focusBuildId,
  focusHeroId,
  focusToken
}: {
  registry: DataRegistry;
  setRegistry: React.Dispatch<React.SetStateAction<DataRegistry>>;
  focusBuildId?: string | null;
  focusHeroId?: string | null;
  focusToken?: number;
}) => {
  const [selectedHeroId, setSelectedHeroId] = useState('h20');
  const [selectedBuildId, setSelectedBuildId] = useState<string | null>(null);
  const [pickerState, setPickerState] = useState<{ isOpen: boolean; type: 'shard' | 'mod'; slotId: string; index: number } | null>(null);
  const [activeColorFilter, setActiveColorFilter] = useState<string | null>(null);
  const [heroOpen, setHeroOpen] = useState(false);
  const heroDropdownRef = useRef<HTMLDivElement>(null);

  const hero = registry.heroes.find(h => h.id === selectedHeroId);

  useEffect(() => {
    if (!heroOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (!heroDropdownRef.current?.contains(event.target as Node)) {
        setHeroOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [heroOpen]);

  useEffect(() => {
    if (!focusBuildId && !focusHeroId) return;
    if (focusBuildId) {
      const build = registry.builds.find(b => b.id === focusBuildId);
      if (build) {
        setSelectedHeroId(build.heroId);
        setSelectedBuildId(build.id);
        setHeroOpen(false);
        return;
      }
    }
    if (focusHeroId) {
      setSelectedHeroId(focusHeroId);
      setSelectedBuildId(null);
      setHeroOpen(false);
    }
  }, [focusBuildId, focusHeroId, focusToken, registry.builds]);

  const heroBuilds = registry.builds.filter(b => {
    const isHeroMatch = b.heroId === selectedHeroId;
    if (!isHeroMatch) return false;
    if (activeColorFilter) return b.customColor === activeColorFilter;
    return true;
  });

  const activeBuild = registry.builds.find(b => b.id === selectedBuildId);

  const createBuild = () => {
    const newBuild: Build = {
      id: `b_${Date.now()}`,
      heroId: selectedHeroId,
      name: `New Build ${heroBuilds.length + 1}`,
      customColor: 'zinc',
      slots: {},
      lastEdited: Date.now()
    };
    setRegistry(prev => ({ ...prev, builds: [...prev.builds, newBuild] }));
    setSelectedBuildId(newBuild.id);
  };

  const updateBuild = (slotId: string, type: 'shards' | 'mods', index: number, itemId: string) => {
    if (!selectedBuildId) return;
    setRegistry(prev => ({
      ...prev,
      builds: prev.builds.map(b => {
        if (b.id !== selectedBuildId) return b;
        const currentSlot = b.slots[slotId] || { slotId, shards: [null, null, null], mods: [null, null, null] };
        const newArray = [...currentSlot[type]];
        newArray[index] = itemId;
        return {
          ...b,
          slots: { ...b.slots, [slotId]: { ...currentSlot, [type]: newArray } },
          lastEdited: Date.now()
        };
      })
    }));
    setPickerState(null);
  };

  const setBuildColor = (colorId: string) => {
    if (!activeBuild) return;
    setRegistry(prev => ({
      ...prev,
      builds: prev.builds.map(b => b.id === activeBuild.id ? { ...b, customColor: colorId } : b)
    }));
  };

  const getSlotIcon = (id: string) => SLOT_CONFIG[id]?.icon || Crosshair;
  const slots = (hero?.equipmentSlots || STANDARD_SLOTS);

  const getCompatibleItems = () => {
    if (!pickerState) return [];
    const collection = pickerState.type === 'shard' ? registry.shards : registry.mods;
    const slotName = pickerState.slotId.toLowerCase();
    const matchesSlot = (item: any) => {
      const slotsLower = (item.compatibleSlots || []).map((s: string) => s.toLowerCase());
      if (slotName.includes('weapon')) return slotsLower.some((s: string) => s.includes('weapon'));
      return slotsLower.includes(slotName);
    };
    const score = (item: any) => {
      const heroScore = (item as any).heroId && (item as any).heroId === selectedHeroId ? 0 : 1;
      const slotScore = matchesSlot(item) ? 0 : 1;
      return [heroScore, slotScore, (item.name || '').toLowerCase()];
    };
    return collection
      .filter(item => {
        if ((item as any).heroId && (item as any).heroId !== selectedHeroId) return false;
        return matchesSlot(item);
      })
      .sort((a, b) => {
        const sa = score(a);
        const sb = score(b);
        return sa < sb ? -1 : sa > sb ? 1 : 0;
      });
  };

  const getBuildStyle = (colorId: string) => {
    return CUSTOM_COLORS.find(c => c.id === colorId) || CUSTOM_COLORS[14];
  };

  return (
    <div className="flex h-full animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="w-72 border-r border-zinc-900 bg-zinc-950 p-6 overflow-y-auto flex flex-col">
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">Hero Class</label>
        <div className="relative mb-6" ref={heroDropdownRef}>
          <button
            type="button"
            onClick={() => setHeroOpen((prev) => !prev)}
            className={`w-full flex items-center justify-between px-4 py-2 rounded-full border text-sm font-medium transition-all bg-gradient-to-r from-red-950/60 via-zinc-950 to-zinc-950/90 text-zinc-200 ${heroOpen ? 'border-red-600 shadow-[0_0_18px_rgba(var(--accent-rgb),0.35)]' : 'border-zinc-800 hover:border-red-800/60'}`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full ${hero?.color || 'bg-zinc-700'} flex items-center justify-center overflow-hidden border border-white/10`}>
                <HeroImage hero={hero} className="w-full h-full object-cover" fallback={<User size={14} className="text-white" />} />
              </div>
              <span>{hero?.name || 'Select Hero'}</span>
            </div>
            <ChevronDown className={`text-red-300 transition-transform ${heroOpen ? 'rotate-180' : ''}`} size={14} />
          </button>

          {heroOpen && (
            <div className="absolute z-30 mt-2 w-full rounded-2xl border border-red-900/60 bg-zinc-950/95 backdrop-blur-xl shadow-2xl overflow-hidden">
              <div className="max-h-64 overflow-y-auto red-scrollbar p-1">
                {registry.heroes.map(h => (
                  <button
                    key={h.id}
                    onClick={() => {
                      setSelectedHeroId(h.id);
                      setSelectedBuildId(null);
                      setHeroOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${selectedHeroId === h.id ? 'bg-red-900/30 border border-red-700/60 text-white' : 'text-zinc-300 hover:bg-zinc-900/80 border border-transparent'}`}
                  >
                    <div className={`w-7 h-7 rounded-full ${h.color} flex items-center justify-center overflow-hidden border border-white/10`}>
                      <HeroImage hero={h} className="w-full h-full object-cover" fallback={<User size={14} className="text-white" />} />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{h.name}</div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-widest">{h.class}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="text-center p-6 bg-zinc-900 rounded-xl border border-zinc-800 mb-6">
          <div className={`w-20 h-20 mx-auto rounded-full overflow-hidden ${hero?.color} flex items-center justify-center mb-3 shadow-lg`}>
            <HeroImage
              hero={hero}
              className="w-full h-full object-cover"
              fallback={<User size={32} className="text-white" />}
            />
          </div>
          <h2 className="text-xl font-bold text-white">{hero?.name}</h2>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase">Saved Builds</span>
            <div className="flex gap-2">
                {activeColorFilter && (
                    <button onClick={() => setActiveColorFilter(null)} className="text-xs text-zinc-500 hover:text-white flex items-center">
                        <X size={10} className="mr-1" /> Clear
                    </button>
                )}
                <button onClick={createBuild} className="text-xs text-red-500 hover:text-red-400 font-bold">+ New</button>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-1.5">
             {CUSTOM_COLORS.slice(0,8).map(c => (
                 <button
                    key={c.id}
                    onClick={() => setActiveColorFilter(activeColorFilter === c.id ? null : c.id)}
                    className={`w-4 h-4 rounded-full ${c.class} ${activeColorFilter === c.id ? 'ring-2 ring-white scale-110' : 'opacity-50 hover:opacity-100'} transition-all`}
                    title={c.id}
                 />
             ))}
          </div>

          {heroBuilds.map(b => {
            const style = getBuildStyle(b.customColor);
            return (
              <button key={b.id} onClick={() => setSelectedBuildId(b.id)} className={`w-full text-left p-2 rounded text-sm transition-all group border-l-4 ${selectedBuildId === b.id ? `bg-zinc-900 ${style.border} text-white` : `border-transparent hover:bg-zinc-900 text-zinc-400`}`}>
                <div className="flex items-center justify-between">
                    <span className="truncate font-medium">{b.name}</span>
                    {selectedBuildId === b.id && <div className={`w-2 h-2 rounded-full ${style.class}`} />}
                </div>
              </button>
            );
          })}
          {heroBuilds.length === 0 && <div className="text-xs text-zinc-600 text-center py-4">No builds found.</div>}
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto bg-zinc-900/30">
        <div className="max-w-5xl mx-auto">
          {activeBuild ? (
            <>
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex-1 mr-4">
                        <input
                        value={activeBuild.name}
                        onChange={(e) => {
                            setRegistry(prev => ({
                            ...prev,
                            builds: prev.builds.map(b => b.id === activeBuild.id ? { ...b, name: e.target.value } : b)
                            }));
                        }}
                        className="text-3xl font-bold text-white bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-red-500 outline-none transition-colors w-full"
                        />
                    </div>
                    <Button variant="secondary" icon={Save} onClick={() => { /* Auto-saves to local storage */ }}>Autosaved</Button>
                </div>

                <div className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800 w-fit">
                    <Palette size={16} className="text-zinc-500" />
                    <div className="flex gap-2">
                        {CUSTOM_COLORS.map(c => (
                            <button
                                key={c.id}
                                onClick={() => setBuildColor(c.id)}
                                className={`w-6 h-6 rounded-full ${c.class} transition-transform ${activeBuild.customColor === c.id ? 'scale-110 ring-2 ring-white shadow-lg' : 'hover:scale-110 opacity-70 hover:opacity-100'}`}
                                title={c.id}
                            />
                        ))}
                    </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {slots.map(slotId => {
                  const Icon = getSlotIcon(slotId);
                  const slotData = activeBuild.slots[slotId] || { slotId, shards: [null, null, null], mods: [null, null, null] };

                  return (
                    <div key={slotId} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all">
                      <div className="p-3 bg-zinc-950/50 border-b border-zinc-800 flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-zinc-400"><Icon size={16} /></div>
                        <span className="font-medium text-zinc-300 capitalize">{slotId.replace(/[0-9]/g, '')}</span>
                      </div>
                      <div className="grid grid-cols-2 divide-x divide-zinc-800 h-48">
                        <div className="p-3 space-y-2">
                          <div className="text-[10px] text-zinc-500 uppercase font-bold text-center mb-1">Shards</div>
                          {[0, 1, 2].map(i => {
                            const itemId = slotData.shards[i];
                            const item = registry.shards.find(s => s.id === itemId);
                            return (
                              <button key={i} onClick={() => setPickerState({ isOpen: true, type: 'shard', slotId, index: i })} className="w-full p-2 rounded bg-black/20 border border-zinc-800/50 hover:bg-zinc-800 hover:border-zinc-700 text-left transition-colors group/slot h-10 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-zinc-800 border border-zinc-600 group-hover/slot:bg-blue-500 group-hover/slot:border-blue-400" />
                                <span className={`text-xs truncate ${item ? 'text-blue-300' : 'text-zinc-600 group-hover/slot:text-zinc-300'}`}>
                                  {item ? item.name : 'Empty'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        <div className="p-3 space-y-2">
                          <div className="text-[10px] text-zinc-500 uppercase font-bold text-center mb-1">Mods</div>
                          {[0, 1, 2].map(i => {
                            const itemId = slotData.mods[i];
                            const item = registry.mods.find(m => m.id === itemId);
                            return (
                              <button key={i} onClick={() => setPickerState({ isOpen: true, type: 'mod', slotId, index: i })} className="w-full p-2 rounded bg-black/20 border border-zinc-800/50 hover:bg-zinc-800 hover:border-zinc-700 text-left transition-colors group/slot h-10 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-sm bg-zinc-800 border border-zinc-600 group-hover/slot:bg-yellow-500 group-hover/slot:border-yellow-400" />
                                <span className={`text-xs truncate ${item ? 'text-yellow-300' : 'text-zinc-600 group-hover/slot:text-zinc-300'}`}>
                                  {item ? item.name : 'Empty'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
              <Hammer size={64} className="mb-4 text-zinc-600" />
              <h3 className="text-xl font-bold text-zinc-300">No Build Selected</h3>
              <p className="text-zinc-500 mb-6">Select a build from the sidebar or create a new one.</p>
              <Button onClick={createBuild}>Create New Build</Button>
            </div>
          )}
        </div>
      </div>

      <SelectionModal
        isOpen={!!pickerState}
        title={`Select ${pickerState?.type === 'shard' ? 'Shard' : 'Mod'}`}
        items={getCompatibleItems()}
        onClose={() => setPickerState(null)}
        onSelect={(item: any) => updateBuild(pickerState!.slotId, pickerState!.type === 'shard' ? 'shards' : 'mods', pickerState!.index, item.id)}
      />
    </div>
  );
};

export default BuildEditor;
