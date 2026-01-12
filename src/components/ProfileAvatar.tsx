import React from 'react';
import { User } from 'lucide-react';
import { CUSTOM_COLORS, GENERIC_ICONS } from '../constants';
import type { DataRegistry, ProfileData } from '../types';
import { HeroImage } from './HeroImage';

export const ProfileAvatar = ({
  profile,
  registry,
  size = 40,
  className = ''
}: {
  profile: ProfileData;
  registry: DataRegistry;
  size?: number;
  className?: string;
}) => {
  const theme = CUSTOM_COLORS.find(c => c.id === profile.themeColor) || CUSTOM_COLORS[0];
  const hero = profile.iconType === 'hero' ? registry.heroes.find(h => h.id === profile.iconId) : undefined;
  const generic = profile.iconType === 'generic' ? GENERIC_ICONS.find(g => g.id === profile.iconId) : undefined;
  const iconSize = Math.max(16, Math.round(size * 0.5));

  return (
    <div
      className={`rounded-full overflow-hidden border ${theme.border} bg-zinc-900 flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {profile.iconType === 'upload' && profile.imageUrl ? (
        <img src={profile.imageUrl} alt={profile.name} className="w-full h-full object-cover" />
      ) : hero ? (
        <HeroImage hero={hero} className="w-full h-full object-contain" />
      ) : generic ? (
        <generic.icon size={iconSize} className="text-zinc-200" />
      ) : (
        <User size={iconSize} className="text-zinc-400" />
      )}
    </div>
  );
};
