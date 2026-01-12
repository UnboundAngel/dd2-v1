import React, { useMemo, useState } from 'react';
import { BarChart3, Minus, Plus, Shield, Sparkles, Swords, Waves } from 'lucide-react';
import { NumberStepper, SearchInput, ThemedSelect } from '../components/ui';
import survivalData from '../../data/maps/survival/survival.json';
import towerEfficiencyData from '../../data/towers/tower_dps_efficiency.json';
import type { DataRegistry } from '../types';

const MUTATOR_LABELS: Record<string, string> = {
  damage_reduction: 'Damage Reduction',
  movement_speed: 'Enemy Speed'
};

const normalizeName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '');

const getRangeMatch = (ranges: any[], wave: number) =>
  ranges.find((range) => wave >= range.waveMin && (range.waveMax == null || wave <= range.waveMax));

const evaluateFormula = (formula: string, wave: number) => {
  try {
    return Function('wave', `return ${formula};`)(wave);
  } catch {
    return null;
  }
};

const getStartingMana = (wave: number) => {
  const segments = (survivalData as any)?.rules?.startingMana?.segments || [];
  const segment = getRangeMatch(segments, wave);
  if (!segment?.mana) return null;
  if (segment.mana.type === 'const') return segment.mana.value;
  if (segment.mana.type === 'formula' && segment.mana.formula) {
    return evaluateFormula(segment.mana.formula, wave);
  }
  return null;
};

const getChaosTier = (wave: number) => {
  const ranges = (survivalData as any)?.rules?.chaosTierByWave?.ranges || [];
  const match = getRangeMatch(ranges, wave);
  return match?.chaosTier ?? null;
};

const getMutators = (wave: number) => {
  const rules = (survivalData as any)?.rules?.mutatorsByWave;
  const ranges = rules?.ranges || [];
  const match = getRangeMatch(ranges, wave);
  return match?.mutators || rules?.default || [];
};

const getFirstMutatorWave = () => {
  const ranges = (survivalData as any)?.rules?.mutatorsByWave?.ranges || [];
  const minWave = ranges.reduce((acc: number, range: any) => {
    if (typeof range.waveMin === 'number') return Math.min(acc, range.waveMin);
    return acc;
  }, Number.POSITIVE_INFINITY);
  return Number.isFinite(minWave) ? minWave : null;
};

const MapPlanner = ({ registry }: { registry: DataRegistry }) => {
  const [selectedMapId, setSelectedMapId] = useState('m1');
  const [plannedTowers, setPlannedTowers] = useState<Record<string, number>>({});
  const [wave, setWave] = useState(1);
  const [efficiencyTier, setEfficiencyTier] = useState<'t1' | 't5'>('t1');
  const [towerSearch, setTowerSearch] = useState('');
  const [sortMode, setSortMode] = useState<'name' | 'du' | 'efficiency'>('name');
  const selectedMap = registry.maps.find(m => m.id === selectedMapId);

  const towerById = useMemo(() => new Map(registry.towers.map(t => [t.id, t])), [registry.towers]);
  const towerByName = useMemo(() => new Map(registry.towers.map(t => [normalizeName(t.name), t])), [registry.towers]);
  const heroById = useMemo(() => new Map(registry.heroes.map(h => [h.id, h])), [registry.heroes]);
  const efficiencyByName = useMemo(() => {
    const map = new Map<string, any>();
    (towerEfficiencyData as any[]).forEach((row) => {
      map.set(normalizeName(row.name), row);
    });
    return map;
  }, []);

  const duStats = useMemo(() => {
    const maxDU = selectedMap?.maxDU || 0;
    const used = Object.entries(plannedTowers).reduce((acc, [towerId, count]) => {
      const tower = towerById.get(towerId);
      if (!tower) return acc;
      return acc + tower.duCost * count;
    }, 0);
    return {
      used,
      remaining: maxDU - used,
      percent: maxDU > 0 ? (used / maxDU) * 100 : 0
    };
  }, [plannedTowers, selectedMap, towerById]);

  const survivalStats = useMemo(() => {
    const startingMana = getStartingMana(wave);
    const chaosTier = getChaosTier(wave);
    const mutators = getMutators(wave);
    return { startingMana, chaosTier, mutators };
  }, [wave]);

  const firstMutatorWave = useMemo(() => getFirstMutatorWave(), []);

  const filteredTowers = useMemo(() => {
    const term = towerSearch.trim().toLowerCase();
    const base = registry.towers
      .filter(tower => tower.name.toLowerCase().includes(term))
      .sort((a, b) => a.name.localeCompare(b.name));
    if (sortMode === 'du') {
      return [...base].sort((a, b) => b.duCost - a.duCost);
    }
    if (sortMode === 'efficiency') {
      const getEfficiency = (tower: any) => {
        const row = efficiencyByName.get(normalizeName(tower.name));
        return row?.efficiency?.[efficiencyTier] ?? 0;
      };
      return [...base].sort((a, b) => getEfficiency(b) - getEfficiency(a));
    }
    return base;
  }, [registry.towers, towerSearch, sortMode, efficiencyTier, efficiencyByName]);

  const efficiencyRanking = useMemo(() => {
    return (towerEfficiencyData as any[])
      .map((row) => {
        const towerMatch = towerByName.get(normalizeName(row.name));
        const hero = towerMatch ? heroById.get(towerMatch.heroId) : null;
        return {
          ...row,
          efficiencyValue: row?.efficiency?.[efficiencyTier] ?? 0,
          towerMatch,
          hero
        };
      })
      .sort((a, b) => (b.efficiencyValue || 0) - (a.efficiencyValue || 0));
  }, [efficiencyTier, heroById, towerByName]);

  const placementSummary = useMemo(() => {
    return Object.entries(plannedTowers)
      .map(([towerId, count]) => {
        const tower = towerById.get(towerId);
        return tower ? { tower, count } : null;
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.count - a.count || a.tower.name.localeCompare(b.tower.name));
  }, [plannedTowers, towerById]);

  const totalManaCost = useMemo(() => {
    return Object.entries(plannedTowers).reduce((acc, [towerId, count]) => {
      const tower = towerById.get(towerId);
      if (!tower) return acc;
      const row = efficiencyByName.get(normalizeName(tower.name));
      return acc + (row?.mana_cost || 0) * count;
    }, 0);
  }, [plannedTowers, efficiencyByName, towerById]);

  const totalDefenseCount = useMemo(() => {
    return Object.values(plannedTowers).reduce((acc, count) => acc + count, 0);
  }, [plannedTowers]);

  const addTower = (towerId: string) => {
    setPlannedTowers((prev) => ({
      ...prev,
      [towerId]: (prev[towerId] || 0) + 1
    }));
  };

  const removeTower = (towerId: string) => {
    setPlannedTowers((prev) => {
      const current = prev[towerId] || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[towerId];
        return next;
      }
      return { ...prev, [towerId]: current - 1 };
    });
  };

  const clearPlan = () => setPlannedTowers({});

  return (
    <div className="flex h-full animate-in fade-in duration-500">
      <aside className="w-80 border-r border-zinc-900 bg-zinc-950/95 p-5 flex flex-col gap-6 overflow-y-auto">
        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">Map Select</label>
          <ThemedSelect
            value={selectedMapId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              setSelectedMapId(e.target.value);
              setPlannedTowers({});
            }}
            className="w-full"
          >
            {registry.maps.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </ThemedSelect>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">Difficulty</div>
              <div className="text-sm text-zinc-200 capitalize">{selectedMap?.difficulty ?? 'Unknown'}</div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">Max DU</div>
              <div className="text-sm text-zinc-200">{selectedMap?.maxDU ?? 0}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 space-y-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500">
            <Waves size={14} className="text-zinc-400" />
            Survival Intel
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumberStepper
              value={wave}
              min={1}
              max={500}
              onChange={(value: number) => setWave(value)}
              label="Wave"
            />
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">Starting Mana</div>
              <div className="text-lg font-mono text-zinc-100">{Math.round(survivalStats.startingMana ?? 0)}</div>
            </div>
          </div>
          <input
            type="range"
            min={1}
            max={500}
            value={wave}
            onChange={(e) => setWave(Number(e.target.value))}
            className="w-full"
            style={{ accentColor: 'var(--accent)' }}
          />
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-zinc-400" />
              <span>Chaos Tier</span>
            </div>
            <span className="text-zinc-200">{survivalStats.chaosTier ? `C${survivalStats.chaosTier}` : 'N/A'}</span>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Mutators</div>
            {survivalStats.mutators.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {survivalStats.mutators.map((mutator: any, index: number) => (
                  <span key={`${mutator.id}-${index}`} className="px-2 py-1 rounded-full border border-zinc-800 text-[11px] text-zinc-200 bg-zinc-900/70">
                    {MUTATOR_LABELS[mutator.id] || mutator.id} {Math.round((mutator.value || 0) * 100)}%
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-xs text-zinc-500">
                None yet{firstMutatorWave ? ` (starts at wave ${firstMutatorWave})` : ''}
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 bg-zinc-900/30 p-6 overflow-y-auto">
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500">
                <Swords size={14} className="text-zinc-400" />
                Defense Budget
              </div>
              <button
                onClick={clearPlan}
                className="px-3 py-1 rounded-full border border-zinc-800 hover:border-zinc-600 text-xs text-zinc-300"
              >
                Clear Plan
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">Used DU</div>
                <div className="text-lg font-mono text-zinc-100">{duStats.used}</div>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">Remaining</div>
                <div className="text-lg font-mono text-zinc-100">{duStats.remaining}</div>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">Total Mana</div>
                <div className="text-lg font-mono text-zinc-100">{totalManaCost}</div>
              </div>
            </div>
            <div className="mt-3 h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(0, duStats.percent))}%`,
                  backgroundColor: duStats.remaining < 0 ? 'rgb(239, 68, 68)' : 'var(--accent)'
                }}
              />
            </div>
            <div className="text-xs text-zinc-500 mt-2">
              Total defenses planned: <span className="text-zinc-200">{totalDefenseCount}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500">
                <BarChart3 size={14} className="text-zinc-400" />
                Defense Library
              </div>
              <div className="flex items-center gap-2">
                {(['t1', 't5'] as const).map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setEfficiencyTier(tier)}
                    className={`px-2 py-1 rounded-full text-[10px] uppercase tracking-wider border transition-colors ${efficiencyTier === tier ? 'border-red-500/70 text-zinc-100 bg-zinc-900/70' : 'border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                  >
                    {tier.toUpperCase()}
                  </button>
                ))}
                <ThemedSelect
                  value={sortMode}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortMode(e.target.value as 'name' | 'du' | 'efficiency')}
                  className="min-w-[170px]"
                >
                  <option value="name">Sort: Name</option>
                  <option value="du">Sort: DU Cost</option>
                  <option value="efficiency">Sort: Efficiency</option>
                </ThemedSelect>
              </div>
            </div>
            <SearchInput
              value={towerSearch}
              onChange={setTowerSearch}
              placeholder="Search defenses"
              className="py-2"
            />

            {registry.towers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/60 p-4 text-xs text-zinc-500">
                No defenses imported yet. Add tower data in Settings to enable planning.
              </div>
            ) : (
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {filteredTowers.map(tower => {
                  const efficiencyRow = efficiencyByName.get(normalizeName(tower.name));
                  const hero = heroById.get(tower.heroId);
                  const count = plannedTowers[tower.id] || 0;
                  return (
                    <div
                      key={tower.id}
                      className={`flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border transition-all ${count > 0 ? 'border-red-500/50 bg-zinc-900/70' : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg border border-zinc-800 bg-zinc-950/70 flex items-center justify-center overflow-hidden ${hero?.color || ''}`}>
                          {tower.iconUrl ? <img src={tower.iconUrl} className="w-full h-full object-cover" /> : <Shield size={16} className="text-zinc-300" />}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-zinc-100">{tower.name}</div>
                          <div className="text-[10px] uppercase tracking-wider text-zinc-500">{hero?.name || 'Unknown hero'}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-[10px] uppercase tracking-wider text-zinc-500">
                          <div>{tower.duCost} DU</div>
                          <div>Mana {efficiencyRow?.mana_cost ?? 'N/A'}</div>
                          <div>{efficiencyRow?.efficiency?.[efficiencyTier]?.toFixed(2) ?? 'N/A'} eff</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => removeTower(tower.id)}
                            className="w-7 h-7 rounded-full border border-zinc-800 text-zinc-400 hover:text-white hover:border-red-500/60 flex items-center justify-center"
                          >
                            <Minus size={12} />
                          </button>
                          <div className="min-w-[32px] text-center text-sm font-mono text-zinc-100">{count}</div>
                          <button
                            onClick={() => addTower(tower.id)}
                            className="w-7 h-7 rounded-full border border-zinc-800 text-zinc-300 hover:text-white hover:border-red-500/60 flex items-center justify-center"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <aside className="w-80 border-l border-zinc-900 bg-zinc-950/95 p-5 flex flex-col gap-6 overflow-y-auto">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500">
            <BarChart3 size={14} className="text-zinc-400" />
            Planned Defenses
          </div>
          {placementSummary.length === 0 ? (
            <div className="text-xs text-zinc-500">No defenses planned yet.</div>
          ) : (
            <div className="space-y-2">
              {placementSummary.map(({ tower, count }) => (
                <div key={tower.id} className="flex items-center justify-between text-sm text-zinc-200">
                  <span>{tower.name}</span>
                  <span className="text-zinc-500">{count} x {tower.duCost} DU</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500">
              <Sparkles size={14} className="text-zinc-400" />
              DU Efficiency Board
            </div>
            <div className="flex items-center gap-2">
              {(['t1', 't5'] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setEfficiencyTier(tier)}
                  className={`px-2 py-1 rounded-full text-[10px] uppercase tracking-wider border transition-colors ${efficiencyTier === tier ? 'border-red-500/70 text-zinc-100 bg-zinc-900/70' : 'border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                >
                  {tier.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="text-xs text-zinc-500">Ranking uses DPS per mana from the efficiency sheet.</div>
          <div className="space-y-2">
            {efficiencyRanking.slice(0, 8).map((row: any) => (
              <div key={row.index} className="flex items-center justify-between text-sm text-zinc-200">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg border border-zinc-800 bg-zinc-950/70 flex items-center justify-center overflow-hidden ${row.hero?.color || ''}`}>
                    {row.towerMatch?.iconUrl ? (
                      <img src={row.towerMatch.iconUrl} className="w-full h-full object-cover" />
                    ) : (
                      <Shield size={14} className="text-zinc-300" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm text-zinc-100">{row.name}</div>
                    <div className="text-[10px] uppercase tracking-wider text-zinc-500">Mana {row.mana_cost}</div>
                  </div>
                </div>
                <div className="text-xs text-zinc-400">{row.efficiencyValue?.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default MapPlanner;



