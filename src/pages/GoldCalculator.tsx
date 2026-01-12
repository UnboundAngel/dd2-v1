import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, ChevronDown, Clock, Coins, Target, TrendingUp } from 'lucide-react';
import { Card, NumberStepper } from '../components/ui';

const formatGold = (value: number) => {
  if (!Number.isFinite(value)) return '0';
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2
  }).format(value);
};

const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) return '0';
  return new Intl.NumberFormat('en-US').format(Math.round(value));
};

const formatTime = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${mins}m ${secs}s`;
};

const formatDuration = (hours: number) => {
  if (!Number.isFinite(hours) || hours <= 0) return '0m';
  const totalSeconds = Math.round(hours * 3600);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
};

type GoldOption = { value: string; label: string };

const GoldDropdown = ({
  value,
  onChange,
  disabled,
  className = '',
  options
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  options: GoldOption[];
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find(option => option.value === value);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(prev => !prev)}
        className={`w-full flex items-center justify-between px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
          disabled
            ? 'border-zinc-800 bg-zinc-950/60 text-zinc-500 cursor-not-allowed'
            : 'border-zinc-800 bg-zinc-950/80 text-zinc-200 hover:border-zinc-700 focus:border-red-500/80 focus:ring-2 focus:ring-red-500/30'
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{current?.label || 'Select'}</span>
        <ChevronDown size={14} className={`text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && !disabled && (
        <div className="absolute z-30 mt-2 w-full rounded-2xl border border-zinc-800 bg-zinc-950/95 shadow-2xl overflow-hidden">
          <div className="max-h-64 overflow-y-auto red-scrollbar p-1">
            {options.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-full text-sm transition-colors ${
                  option.value === value
                    ? 'bg-zinc-900 border border-red-700/40 text-white'
                    : 'text-zinc-300 hover:bg-zinc-900/80 border border-transparent'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const BASE_GOLD_PRESETS = [
  { id: 'c1', label: 'Chaos 1 (20k)', value: 20000 },
  { id: 'c2', label: 'Chaos 2 (26k)', value: 26000 },
  { id: 'c3', label: 'Chaos 3 (32k)', value: 32000 },
  { id: 'c4', label: 'Chaos 4 (38k)', value: 38000 },
  { id: 'c5', label: 'Chaos 5 (44k)', value: 44000 },
  { id: 'c6', label: 'Chaos 6 (50k)', value: 50000 },
  { id: 'c7', label: 'Chaos 7 (56k)', value: 56000 },
  { id: 'c8', label: 'Chaos 8 (62k)', value: 62000 },
  { id: 'c9', label: 'Chaos 9 (86k)', value: 86000 },
  { id: 'c10', label: 'Chaos 10 (100k)', value: 100000 },
  { id: 'c11', label: 'Chaos 11 (est. 120k)', value: 120000 },
  { id: 'custom', label: 'Custom', value: null }
];

const WINSTREAK_OPTIONS = [
  { id: '0', label: '0 wins (0%)', value: 0 },
  { id: '5', label: '1 win (5%)', value: 5 },
  { id: '10', label: '2 wins (10%)', value: 10 },
  { id: '20', label: '3+ wins (20%)', value: 20 }
];

const RESET_BONUS_PER = 0.05;
const JACKPOT_MULTIPLIER = 4;
const STORAGE_KEY = 'dd2_gold_calc';

const GoldCalculator = () => {
  const [minutes, setMinutes] = useState(2);
  const [seconds, setSeconds] = useState(30);
  const [loadingTime, setLoadingTime] = useState(60);
  const [basePreset, setBasePreset] = useState('c11');
  const [baseGoldPerRun, setBaseGoldPerRun] = useState(120000);
  const [basePickupGold, setBasePickupGold] = useState(1000);
  const [sellGold, setSellGold] = useState(0);
  const [winstreakPct, setWinstreakPct] = useState(20);
  const [jackpotChancePct, setJackpotChancePct] = useState(5);
  const [resets, setResets] = useState(0);
  const [isOnslaught, setIsOnslaught] = useState(false);
  const [includePickups, setIncludePickups] = useState(false);
  const [jackpotEnabled, setJackpotEnabled] = useState(false);
  const [targetGold, setTargetGold] = useState(5_000_000);
  const [sessionHours, setSessionHours] = useState(2);
  const [liveTimer, setLiveTimer] = useState(false);
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [dragAdjust, setDragAdjust] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (!parsed || typeof parsed !== 'object') return;

      const numberOr = (value: any, fallback: number) => (typeof value === 'number' && Number.isFinite(value) ? value : fallback);
      const boolOr = (value: any, fallback: boolean) => (typeof value === 'boolean' ? value : fallback);
      const stringOr = (value: any, fallback: string) => (typeof value === 'string' ? value : fallback);

      setMinutes(numberOr(parsed.minutes, 2));
      setSeconds(numberOr(parsed.seconds, 30));
      setLoadingTime(numberOr(parsed.loadingTime, 60));
      setBasePreset(stringOr(parsed.basePreset, 'c11'));
      setBaseGoldPerRun(numberOr(parsed.baseGoldPerRun, 120000));
      setBasePickupGold(numberOr(parsed.basePickupGold, 1000));
      setSellGold(numberOr(parsed.sellGold, 0));
      setWinstreakPct(numberOr(parsed.winstreakPct, 20));
      setJackpotChancePct(numberOr(parsed.jackpotChancePct, 5));
      setResets(numberOr(parsed.resets, 0));
      setIsOnslaught(boolOr(parsed.isOnslaught, false));
      setIncludePickups(boolOr(parsed.includePickups, false));
      setJackpotEnabled(boolOr(parsed.jackpotEnabled, false));
      setTargetGold(numberOr(parsed.targetGold, 5_000_000));
      setSessionHours(numberOr(parsed.sessionHours, 2));
      setLiveTimer(boolOr(parsed.liveTimer, false));
      setDragAdjust(boolOr(parsed.dragAdjust, false));
    } catch {
      // Ignore invalid saved data.
    }
  }, []);

  useEffect(() => {
    const payload = {
      minutes,
      seconds,
      loadingTime,
      basePreset,
      baseGoldPerRun,
      basePickupGold,
      sellGold,
      winstreakPct,
      jackpotChancePct,
      resets,
      isOnslaught,
      includePickups,
      jackpotEnabled,
      targetGold,
      sessionHours,
      liveTimer,
      dragAdjust
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [
    minutes,
    seconds,
    loadingTime,
    basePreset,
    baseGoldPerRun,
    basePickupGold,
    sellGold,
    winstreakPct,
    jackpotChancePct,
    resets,
    isOnslaught,
    includePickups,
    jackpotEnabled,
    targetGold,
    sessionHours,
    liveTimer,
    dragAdjust
  ]);

  const runSeconds = useMemo(() => (minutes * 60) + seconds, [minutes, seconds]);
  const totalCycleSeconds = useMemo(() => runSeconds + loadingTime, [runSeconds, loadingTime]);
  const runsPerHour = useMemo(() => (totalCycleSeconds > 0 ? 3600 / totalCycleSeconds : 0), [totalCycleSeconds]);
  const runShare = useMemo(() => (totalCycleSeconds > 0 ? runSeconds / totalCycleSeconds : 0), [runSeconds, totalCycleSeconds]);
  const loadShare = useMemo(() => (totalCycleSeconds > 0 ? loadingTime / totalCycleSeconds : 0), [loadingTime, totalCycleSeconds]);

  const baseAdjusted = useMemo(() => Math.max(0, baseGoldPerRun), [baseGoldPerRun]);
  const winStreakMultiplier = useMemo(() => {
    if (isOnslaught) return 1;
    if (winstreakPct >= 20) return 1.2;
    if (winstreakPct >= 10) return 1.1;
    if (winstreakPct >= 5) return 1.05;
    return 1;
  }, [isOnslaught, winstreakPct]);
  const resetMultiplier = useMemo(() => 1 + (Math.max(0, resets) * RESET_BONUS_PER), [resets]);
  const baseGold = useMemo(() => baseAdjusted, [baseAdjusted]);
  const winstreakGold = useMemo(() => baseAdjusted * (winStreakMultiplier - 1), [baseAdjusted, winStreakMultiplier]);
  const resetGold = useMemo(() => baseAdjusted * winStreakMultiplier * (resetMultiplier - 1), [baseAdjusted, resetMultiplier, winStreakMultiplier]);
  const roundGold = useMemo(() => baseAdjusted * winStreakMultiplier * resetMultiplier, [baseAdjusted, resetMultiplier, winStreakMultiplier]);

  const pickupBaseGold = useMemo(() => (includePickups ? Math.max(0, basePickupGold) : 0), [basePickupGold, includePickups]);
  const jackpotChance = useMemo(() => {
    if (!includePickups || !jackpotEnabled) return 0;
    return Math.max(0, Math.min(100, jackpotChancePct)) / 100;
  }, [includePickups, jackpotChancePct, jackpotEnabled]);
  const pickupGold = useMemo(() => pickupBaseGold * (1 + jackpotChance * (JACKPOT_MULTIPLIER - 1)), [jackpotChance, pickupBaseGold]);
  const jackpotGold = useMemo(() => pickupGold - pickupBaseGold, [pickupGold, pickupBaseGold]);

  const sellTotalGold = useMemo(() => Math.max(0, sellGold), [sellGold]);
  const goldPerRun = useMemo(() => roundGold + pickupGold + sellTotalGold, [pickupGold, roundGold, sellTotalGold]);
  const goldPerHour = useMemo(() => goldPerRun * runsPerHour, [goldPerRun, runsPerHour]);
  const goldPerMinute = useMemo(() => goldPerHour / 60, [goldPerHour]);

  const runsNeeded = useMemo(() => (goldPerRun > 0 ? Math.ceil(targetGold / goldPerRun) : 0), [targetGold, goldPerRun]);
  const hoursToTarget = useMemo(() => (goldPerHour > 0 ? targetGold / goldPerHour : 0), [targetGold, goldPerHour]);
  const sessionGold = useMemo(() => goldPerHour * Math.max(0, sessionHours), [goldPerHour, sessionHours]);

  const requiredGoldPerRun = useMemo(() => {
    if (runsPerHour <= 0 || sessionHours <= 0) return 0;
    return targetGold / (runsPerHour * sessionHours);
  }, [targetGold, runsPerHour, sessionHours]);

  const chartWindowHours = Math.max(1, Math.min(12, Math.ceil(sessionHours || 1)));
  const coreMultiplier = baseAdjusted > 0 ? roundGold / baseAdjusted : 0;

  const handlePresetChange = (value: string) => {
    setBasePreset(value);
    const preset = BASE_GOLD_PRESETS.find(item => item.id === value);
    if (preset && preset.value !== null) {
      setBaseGoldPerRun(preset.value);
    }
  };
  const chartPoints = useMemo(() => {
    const points = Array.from({ length: 25 }, (_, index) => {
      const tHours = (chartWindowHours / 24) * index;
      const runs = totalCycleSeconds > 0 ? Math.floor((tHours * 3600) / totalCycleSeconds) : 0;
      return { tHours, value: runs * goldPerRun };
    });
    return points;
  }, [chartWindowHours, totalCycleSeconds, goldPerRun]);

  const chartPath = useMemo(() => {
    const width = 640;
    const height = 180;
    const padding = 24;
    const maxVal = Math.max(...chartPoints.map(p => p.value), 1);
    const scaleX = (width - padding * 2) / (chartPoints.length - 1);
    const scaleY = (height - padding * 2) / maxVal;

    const points = chartPoints.map((point, index) => {
      const x = padding + (index * scaleX);
      const y = height - padding - (point.value * scaleY);
      return { x, y };
    });

    const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ');
    const area = `M ${points[0].x.toFixed(2)} ${(height - padding).toFixed(2)} ${points.map((point) => `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ')} L ${points[points.length - 1].x.toFixed(2)} ${(height - padding).toFixed(2)} Z`;

    return { line, area, width, height, padding, maxVal };
  }, [chartPoints]);

  const projectionHours = [1, 2, 4, 8];
  const maxProjection = Math.max(...projectionHours.map(h => goldPerHour * h), 1);
  const liveProgress = totalCycleSeconds > 0 ? Math.min(1, liveSeconds / totalCycleSeconds) : 0;

  useEffect(() => {
    if (!liveTimer || totalCycleSeconds <= 0) {
      setLiveSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      setLiveSeconds(prev => {
        const next = prev + 1;
        return next >= totalCycleSeconds ? 0 : next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [liveTimer, totalCycleSeconds]);

  return (
    <div className="p-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3"><Coins className="text-red-500" />Gold Planner</h1>
          <p className="text-zinc-400 text-sm">Round gold: Base * (1 + Winstreak) * (1 + 0.05 * Resets). Pickups are optional and only jackpot if the shard is equipped. Sells never get multipliers.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px,1fr] gap-8">
        <div className="space-y-6">
          <div className="rounded-xl border border-red-900/40 bg-gradient-to-br from-zinc-950 via-zinc-950 to-red-950/20 p-4 shadow-[0_0_30px_rgba(var(--accent-rgb),0.08)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-medium text-zinc-200 flex items-center gap-2"><Clock size={16} className="text-red-400" /> Run Timing</h3>
                  <div className="text-[11px] text-zinc-500 mt-1">Tune your loop speed and overhead.</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500">Cycle</div>
                  <div className="text-2xl font-mono text-white">{formatTime(totalCycleSeconds)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-3">
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500">Run Time</div>
                  <div className="text-lg font-mono text-white">{formatTime(runSeconds)}</div>
                </div>
                <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-3">
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500">Loading</div>
                  <div className="text-lg font-mono text-white">{formatTime(loadingTime)}</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                  <div className="h-full bg-gradient-to-r from-red-500 to-orange-500" style={{ width: `${runShare * 100}%` }} />
                  <div className="h-full bg-zinc-700" style={{ width: `${loadShare * 100}%` }} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-2">
                  <span>Run {Math.round(runShare * 100)}%</span>
                  <span>Loading {Math.round(loadShare * 100)}%</span>
                  <span>Runs/hr {runsPerHour.toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-3">
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Run Duration</div>
                  <div className="grid grid-cols-1 gap-2">
                    <NumberStepper label="Min" value={minutes} onChange={setMinutes} max={59} />
                    <NumberStepper label="Sec" value={seconds} onChange={setSeconds} max={59} />
                  </div>
                  {dragAdjust && (
                    <div className="mt-2 space-y-2">
                      <input
                        type="range"
                        min={0}
                        max={59}
                        value={minutes}
                        onChange={(e) => setMinutes(Number(e.target.value))}
                        className="w-full accent-red-500"
                      />
                      <input
                        type="range"
                        min={0}
                        max={59}
                        value={seconds}
                        onChange={(e) => setSeconds(Number(e.target.value))}
                        className="w-full accent-red-500"
                      />
                    </div>
                  )}
                </div>
                <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-3">
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Loading Overhead</div>
                  <NumberStepper label="Sec" value={loadingTime} onChange={setLoadingTime} max={180} step={5} />
                  {dragAdjust && (
                    <input
                      type="range"
                      min={0}
                      max={180}
                      step={5}
                      value={loadingTime}
                      onChange={(e) => setLoadingTime(Number(e.target.value))}
                      className="mt-2 w-full accent-red-500"
                    />
                  )}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <input
                    id="live-timer"
                    type="checkbox"
                    checked={liveTimer}
                    onChange={(e) => setLiveTimer(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-red-500 focus:ring-red-500"
                  />
                  <label htmlFor="live-timer" className="text-xs text-zinc-500">Live timer</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="drag-adjust"
                    type="checkbox"
                    checked={dragAdjust}
                    onChange={(e) => setDragAdjust(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-red-500 focus:ring-red-500"
                  />
                  <label htmlFor="drag-adjust" className="text-xs text-zinc-500">Drag adjust</label>
                </div>
              </div>
              {liveTimer && totalCycleSeconds > 0 && (
                <div className="mt-3 bg-zinc-950/60 border border-zinc-800 rounded-lg p-3">
                  <div className="flex items-center justify-between text-[11px] text-zinc-500">
                    <span>Live cycle</span>
                    <span>{formatTime(liveSeconds)} / {formatTime(totalCycleSeconds)}</span>
                  </div>
                  <div className="mt-2 h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500" style={{ width: `${liveProgress * 100}%` }} />
                  </div>
                </div>
              )}
            </div>

          <div className="rounded-xl border border-red-900/40 bg-gradient-to-br from-zinc-950 via-zinc-950 to-red-950/20 p-4 space-y-4 shadow-[0_0_24px_rgba(var(--accent-rgb),0.08)]">
            <h3 className="text-sm font-medium text-zinc-200 flex items-center gap-2"><TrendingUp size={16} className="text-red-400" /> Gold Sources</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Base Gold Preset</label>
                <GoldDropdown
                  value={basePreset}
                  onChange={handlePresetChange}
                  options={BASE_GOLD_PRESETS.map(preset => ({ value: preset.id, label: preset.label }))}
                />
                <div className="text-xs text-zinc-500">C1-C10 values from the wiki. C11 is an estimate.</div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Base Round Gold</label>
                <input
                  type="number"
                  value={baseGoldPerRun}
                  onChange={(e) => { setBaseGoldPerRun(Number(e.target.value) || 0); setBasePreset('custom'); }}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 p-2 rounded-md font-mono focus:border-red-600 focus:ring-1 focus:ring-red-600/50 outline-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Pickups</label>
              <div className="flex items-center gap-2">
                <input
                  id="include-pickups"
                  type="checkbox"
                  checked={includePickups}
                  onChange={(e) => setIncludePickups(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-red-500 focus:ring-red-500"
                />
                <label htmlFor="include-pickups" className="text-xs text-zinc-500">Include pickup gold (usually low, optional)</label>
              </div>
              {includePickups && (
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Base Pickup Gold (avg)</label>
                    <input
                      type="number"
                      value={basePickupGold}
                      onChange={(e) => setBasePickupGold(Number(e.target.value) || 0)}
                      className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 p-2 rounded-md font-mono focus:border-red-600 focus:ring-1 focus:ring-red-600/50 outline-none"
                    />
                    <div className="text-xs text-zinc-500">Gold from ground pickups before jackpot.</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="jackpot-enabled"
                      type="checkbox"
                      checked={jackpotEnabled}
                      onChange={(e) => setJackpotEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-red-500 focus:ring-red-500"
                    />
                    <label htmlFor="jackpot-enabled" className="text-xs text-zinc-500">Jackpot shard equipped</label>
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Resets</label>
                <NumberStepper value={resets} onChange={setResets} max={999} />
                {dragAdjust && (
                  <input
                    type="range"
                    min={0}
                    max={200}
                    value={Math.min(resets, 200)}
                    onChange={(e) => setResets(Number(e.target.value))}
                    className="mt-2 w-full accent-red-500"
                  />
                )}
              </div>
              <div>
                <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Reset Bonus</label>
                <div className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-xs text-zinc-400">
                  +5% per reset {'->'} {resetMultiplier.toFixed(2)}x
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Winstreak Bonus</label>
                <GoldDropdown
                  value={isOnslaught ? '0' : String(winstreakPct)}
                  onChange={(next) => setWinstreakPct(Number(next) || 0)}
                  disabled={isOnslaught}
                  options={WINSTREAK_OPTIONS.map(option => ({ value: String(option.value), label: option.label }))}
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Mode</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    id="onslaught-mode"
                    type="checkbox"
                    checked={isOnslaught}
                    onChange={(e) => setIsOnslaught(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-red-500 focus:ring-red-500"
                  />
                  <label htmlFor="onslaught-mode" className="text-xs text-zinc-500">Onslaught (winstreak disabled)</label>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Item Sell Gold (avg)</label>
                <input
                  type="number"
                  value={sellGold}
                  onChange={(e) => setSellGold(Number(e.target.value) || 0)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 p-2 rounded-md font-mono focus:border-red-600 focus:ring-1 focus:ring-red-600/50 outline-none"
                />
              </div>
              {includePickups && jackpotEnabled && (
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Jackpot Chance (2-10%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={jackpotChancePct}
                    onChange={(e) => setJackpotChancePct(Number(e.target.value) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 p-2 rounded-md font-mono focus:border-red-600 focus:ring-1 focus:ring-red-600/50 outline-none"
                  />
                </div>
              )}
            </div>
            <div className="text-xs text-zinc-500">Core multiplier: {coreMultiplier.toFixed(2)}x (round gold only).</div>
          </div>

          <div className="rounded-xl border border-red-900/40 bg-gradient-to-br from-zinc-950 via-zinc-950 to-red-950/20 p-4 space-y-4 shadow-[0_0_24px_rgba(var(--accent-rgb),0.08)]">
            <h3 className="text-sm font-medium text-zinc-200 flex items-center gap-2"><Target size={16} className="text-red-400" /> Goals</h3>
            <div className="space-y-1">
              <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Target Gold</label>
              <input
                type="number"
                value={targetGold}
                onChange={(e) => setTargetGold(Number(e.target.value) || 0)}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 p-2 rounded-md font-mono focus:border-red-600 focus:ring-1 focus:ring-red-600/50 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Session Length (Hours)</label>
              <input
                type="number"
                step="0.25"
                value={sessionHours}
                onChange={(e) => setSessionHours(Number(e.target.value) || 0)}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 p-2 rounded-md font-mono focus:border-red-600 focus:ring-1 focus:ring-red-600/50 outline-none"
              />
            </div>
            <div className="text-xs text-zinc-500">Needed per run: {formatGold(requiredGoldPerRun)}.</div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-lg flex flex-col gap-2">
              <span className="text-zinc-500 text-xs uppercase tracking-widest font-bold">Gold / Run</span>
              <span className="text-3xl font-mono text-white">{formatGold(goldPerRun)}</span>
              <span className="text-xs text-zinc-500">
                Round {formatGold(roundGold)}
                {includePickups ? ` + pickups ${formatGold(pickupGold)}` : ''}
                {sellTotalGold > 0 ? ` + sells ${formatGold(sellTotalGold)}` : ''}
              </span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-lg flex flex-col gap-2">
              <span className="text-zinc-500 text-xs uppercase tracking-widest font-bold">Runs / Hour</span>
              <span className="text-3xl font-mono text-white">{runsPerHour.toFixed(2)}</span>
              <span className="text-xs text-zinc-500">Cycle {formatTime(totalCycleSeconds)}</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-lg flex flex-col gap-2">
              <span className="text-red-400 text-xs uppercase tracking-widest font-bold">Gold / Hour</span>
              <span className="text-3xl font-mono text-red-400 font-bold">{formatGold(goldPerHour)}</span>
              <span className="text-xs text-zinc-500">Gold / min {formatGold(goldPerMinute)}</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-lg flex flex-col gap-2">
              <span className="text-zinc-500 text-xs uppercase tracking-widest font-bold">Runs to Target</span>
              <span className="text-3xl font-mono text-white">{formatNumber(runsNeeded)}</span>
              <span className="text-xs text-zinc-500">Session total {formatGold(sessionGold)}</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-lg flex flex-col gap-2">
              <span className="text-zinc-500 text-xs uppercase tracking-widest font-bold">Time to Target</span>
              <span className="text-3xl font-mono text-white">{formatDuration(hoursToTarget)}</span>
              <span className="text-xs text-zinc-500">At current pacing</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-lg flex flex-col gap-2">
              <span className="text-zinc-500 text-xs uppercase tracking-widest font-bold">Pace Check</span>
              {requiredGoldPerRun > 0 && goldPerRun >= requiredGoldPerRun ? (
                <span className="text-sm text-emerald-400">On pace for the target.</span>
              ) : (
                <span className="text-sm text-orange-400">Short by {formatGold(requiredGoldPerRun - goldPerRun)} per run.</span>
              )}
              <span className="text-xs text-zinc-500">Adjust resets, pickups, or cycle time.</span>
            </div>
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-zinc-300 flex items-center gap-2"><BarChart3 size={16} /> Gold Over Time</div>
              <div className="text-xs text-zinc-500">Window: {chartWindowHours}h</div>
            </div>
            <div className="w-full h-[200px]">
              <svg viewBox={`0 0 ${chartPath.width} ${chartPath.height}`} className="w-full h-full">
                <defs>
                  <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[0, 0.5, 1].map((line, index) => {
                  const y = chartPath.padding + ((chartPath.height - chartPath.padding * 2) * line);
                  return <line key={index} x1={chartPath.padding} x2={chartPath.width - chartPath.padding} y1={y} y2={y} stroke="#27272a" strokeDasharray="4 6" />;
                })}
                <path d={chartPath.area} fill="url(#goldFill)" />
                <path d={chartPath.line} fill="none" stroke="var(--accent)" strokeWidth="2" />
              </svg>
            </div>
            <div className="flex justify-between text-xs text-zinc-500 mt-2">
              <span>0h</span>
              <span>{(chartWindowHours / 2).toFixed(0)}h</span>
              <span>{chartWindowHours}h</span>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5">
              <div className="text-sm font-medium text-zinc-300 mb-4">Gold Sources Breakdown</div>
              <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                <div className="bg-red-500" style={{ width: `${(baseGold / Math.max(goldPerRun, 1)) * 100}%` }} />
                <div className="bg-sky-500" style={{ width: `${(winstreakGold / Math.max(goldPerRun, 1)) * 100}%` }} />
                <div className="bg-orange-500" style={{ width: `${(resetGold / Math.max(goldPerRun, 1)) * 100}%` }} />
                {includePickups && (
                  <div className="bg-emerald-500" style={{ width: `${(pickupBaseGold / Math.max(goldPerRun, 1)) * 100}%` }} />
                )}
                {includePickups && jackpotEnabled && (
                  <div className="bg-pink-500" style={{ width: `${(jackpotGold / Math.max(goldPerRun, 1)) * 100}%` }} />
                )}
                {sellTotalGold > 0 && (
                  <div className="bg-indigo-500" style={{ width: `${(sellTotalGold / Math.max(goldPerRun, 1)) * 100}%` }} />
                )}
              </div>
              <div className="mt-4 space-y-1 text-xs text-zinc-400">
                <div className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500" />Round Base</span><span>{formatGold(baseGold)}</span></div>
                <div className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-sky-500" />Winstreak</span><span>{formatGold(winstreakGold)}</span></div>
                <div className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-500" />Resets</span><span>{formatGold(resetGold)}</span></div>
                {includePickups && (
                  <div className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500" />Pickups</span><span>{formatGold(pickupBaseGold)}</span></div>
                )}
                {includePickups && jackpotEnabled && (
                  <div className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-pink-500" />Jackpot</span><span>{formatGold(jackpotGold)}</span></div>
                )}
                {sellTotalGold > 0 && (
                  <div className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-indigo-500" />Sells</span><span>{formatGold(sellTotalGold)}</span></div>
                )}
              </div>
            </Card>

            <Card className="p-5">
              <div className="text-sm font-medium text-zinc-300 mb-4">Session Projections</div>
              <div className="flex items-end gap-4 h-28">
                {projectionHours.map(hours => {
                  const value = goldPerHour * hours;
                  return (
                    <div key={hours} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-[11px] text-zinc-500">{formatGold(value)}</span>
                      <div className="w-full bg-zinc-800 rounded-md overflow-hidden flex items-end h-full">
                        <div className="w-full bg-red-500/80" style={{ height: `${(value / maxProjection) * 100}%` }} />
                      </div>
                      <span className="text-[11px] text-zinc-500">{hours}h</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 text-xs text-zinc-500">1-8 hour gold at current pace.</div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoldCalculator;
