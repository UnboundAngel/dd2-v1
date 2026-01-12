import type { ProfileData } from '../types';
import { DEFAULT_PROFILE } from '../constants';

export const loadProfile = (): ProfileData => {
  try {
    const saved = localStorage.getItem('dd2_profile');
    if (!saved) return { ...DEFAULT_PROFILE };
    const parsed = JSON.parse(saved);
    return { ...DEFAULT_PROFILE, ...parsed };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
};
