import {
  BookOpen,
  Coins,
  Cpu,
  Footprints,
  Gamepad2,
  Hammer,
  Hand,
  Microchip,
  Shield,
  Shirt,
  Sword,
  Trophy,
  User,
  Zap
} from 'lucide-react';
import type { ProfileData } from './types';

export const STANDARD_SLOTS = ['weapon', 'helmet', 'chest', 'gloves', 'boots', 'relic'];
export const SHIELD_SLOTS = ['weapon', 'shield', 'helmet', 'chest', 'gloves', 'boots', 'relic'];
export const DUAL_WIELD_SLOTS = ['weapon1', 'weapon2', 'helmet', 'chest', 'gloves', 'boots', 'relic'];

export const SLOT_CONFIG: Record<string, { label: string; icon: any }> = {
  weapon: { label: 'Weapon', icon: Sword },
  weapon1: { label: 'Left Weapon', icon: Sword },
  weapon2: { label: 'Right Weapon', icon: Sword },
  shield: { label: 'Shield', icon: Shield },
  helmet: { label: 'Helmet', icon: User },
  chest: { label: 'Chest', icon: Shirt },
  gloves: { label: 'Gloves', icon: Hand },
  boots: { label: 'Boots', icon: Footprints },
  relic: { label: 'Relic', icon: Zap },
  servo: { label: 'Servo', icon: Microchip },
  chip: { label: 'Chip', icon: Cpu }
};

export const GENERIC_ICONS = [
  { id: 'sword', icon: Sword, label: 'Combat' },
  { id: 'shield', icon: Shield, label: 'Defense' },
  { id: 'coins', icon: Coins, label: 'Farming' },
  { id: 'trophy', icon: Trophy, label: 'Achievement' },
  { id: 'zap', icon: Zap, label: 'Power' },
  { id: 'book', icon: BookOpen, label: 'Research' },
  { id: 'gamepad', icon: Gamepad2, label: 'General' },
  { id: 'hammer', icon: Hammer, label: 'Build' }
];

export const CUSTOM_COLORS = [
  { id: 'red', class: 'bg-red-600', text: 'text-red-100', border: 'border-red-500' },
  { id: 'orange', class: 'bg-orange-600', text: 'text-orange-100', border: 'border-orange-500' },
  { id: 'amber', class: 'bg-amber-600', text: 'text-amber-100', border: 'border-amber-500' },
  { id: 'green', class: 'bg-green-600', text: 'text-green-100', border: 'border-green-500' },
  { id: 'emerald', class: 'bg-emerald-600', text: 'text-emerald-100', border: 'border-emerald-500' },
  { id: 'teal', class: 'bg-teal-600', text: 'text-teal-100', border: 'border-teal-500' },
  { id: 'cyan', class: 'bg-cyan-600', text: 'text-cyan-100', border: 'border-cyan-500' },
  { id: 'blue', class: 'bg-blue-600', text: 'text-blue-100', border: 'border-blue-500' },
  { id: 'indigo', class: 'bg-indigo-600', text: 'text-indigo-100', border: 'border-indigo-500' },
  { id: 'violet', class: 'bg-violet-600', text: 'text-violet-100', border: 'border-violet-500' },
  { id: 'purple', class: 'bg-purple-600', text: 'text-purple-100', border: 'border-purple-500' },
  { id: 'fuchsia', class: 'bg-fuchsia-600', text: 'text-fuchsia-100', border: 'border-fuchsia-500' },
  { id: 'pink', class: 'bg-pink-600', text: 'text-pink-100', border: 'border-pink-500' },
  { id: 'rose', class: 'bg-rose-600', text: 'text-rose-100', border: 'border-rose-500' },
  { id: 'slate', class: 'bg-slate-600', text: 'text-slate-100', border: 'border-slate-500' },
  { id: 'zinc', class: 'bg-zinc-600', text: 'text-zinc-100', border: 'border-zinc-500' }
];

export const PROFILE_BADGES = [
  { id: 'builder', label: 'Builder' },
  { id: 'dps', label: 'DPS' },
  { id: 'support', label: 'Support' },
  { id: 'tank', label: 'Tank' },
  { id: 'strategist', label: 'Strategist' },
  { id: 'collector', label: 'Collector' },
  { id: 'onslaught', label: 'Onslaught' },
  { id: 'chaos', label: 'Chaos' }
];

export const PROFILE_THEME_HEX: Record<string, string> = {
  red: '#ef4444',
  orange: '#f97316',
  amber: '#f59e0b',
  green: '#22c55e',
  emerald: '#10b981',
  teal: '#14b8a6',
  cyan: '#06b6d4',
  blue: '#3b82f6',
  indigo: '#6366f1',
  violet: '#8b5cf6',
  purple: '#a855f7',
  fuchsia: '#d946ef',
  pink: '#ec4899',
  rose: '#f43f5e',
  slate: '#64748b',
  zinc: '#71717a'
};

export const DEFAULT_PROFILE: ProfileData = {
  name: 'Defender',
  title: 'Master Builder',
  status: 'Offline Mode',
  tagline: 'Ready for the next map.',
  bio: 'Planning builds, refining defenses, and tracking the grind.',
  iconType: 'generic',
  iconId: 'shield',
  imageUrl: '',
  themeColor: 'red',
  badges: ['builder', 'strategist']
};
