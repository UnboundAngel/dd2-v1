import React from 'react';
import {
  BookOpen,
  CheckSquare,
  Coins,
  Hammer,
  Map as MapIcon,
  Settings,
  Users,
  X
} from 'lucide-react';
import { ProfileAvatar } from './ProfileAvatar';
import type { DataRegistry, ProfileData } from '../types';

export const Sidebar = ({
  activePage,
  setPage,
  mobileOpen,
  setMobileOpen,
  profile,
  registry,
  onOpenProfile
}: {
  activePage: string;
  setPage: (page: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  profile: ProfileData;
  registry: DataRegistry;
  onOpenProfile: () => void;
}) => {
  const navItems = [
    { id: 'maps', label: 'Map Planner', icon: MapIcon },
    { id: 'gold', label: 'Gold Calculator', icon: Coins },
    { id: 'builds', label: 'Build Editor', icon: Hammer },
    { id: 'heroes', label: 'Heroes', icon: Users },
    { id: 'checklists', label: 'Collection Tracker', icon: CheckSquare },
    { id: 'encyclopedia', label: 'Encyclopedia', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const SidebarItem = ({
    icon: Icon,
    label,
    isActive,
    onClick
  }: {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
    isActive: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all group ${
        isActive
          ? 'bg-red-900/10 text-red-500'
          : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
      }`}
    >
      <Icon size={18} className={isActive ? 'text-red-500' : 'text-zinc-500 group-hover:text-zinc-300'} />
      <span className="text-sm font-medium">{label}</span>
      {isActive && <div className="ml-auto w-1 h-1 bg-red-500 rounded-full shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)]" />}
    </button>
  );

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}
      <aside className={`fixed md:relative z-50 h-full w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-16 flex items-center px-6 border-b border-zinc-900">
          <div className="flex items-center gap-2 text-red-600 font-bold tracking-tight text-xl">
            <div className="w-8 h-8 bg-red-600 text-black flex items-center justify-center rounded text-sm font-black">DD2</div>
            <span>Planner</span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="ml-auto md:hidden text-zinc-500"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          <div className="px-3 mb-2 text-xs font-semibold text-zinc-600 uppercase tracking-wider">Tools</div>
          {navItems.map((item) => (
            <SidebarItem key={item.id} {...item} isActive={activePage === item.id} onClick={() => { setPage(item.id); setMobileOpen(false); }} />
          ))}
        </div>
        <div className="p-4 border-t border-zinc-900 bg-zinc-950/50">
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-zinc-900 transition-colors"
          >
            <ProfileAvatar profile={profile} registry={registry} size={32} />
            <div className="flex flex-col items-start">
              <span className="text-xs font-medium text-zinc-200">{profile.name}</span>
              <span className="text-[10px] text-zinc-500">{profile.status}</span>
            </div>
          </button>
        </div>
      </aside>
    </>
  );
};
