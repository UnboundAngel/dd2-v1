import React, { useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, Palette, Tag, User, X } from 'lucide-react';
import { CUSTOM_COLORS, DEFAULT_PROFILE, GENERIC_ICONS, PROFILE_BADGES, PROFILE_THEME_HEX } from '../constants';
import type { DataRegistry, ProfileData, ProfileIconType } from '../types';
import { Button } from './ui';
import { HeroImage } from './HeroImage';
import { ProfileAvatar } from './ProfileAvatar';

const MAX_IMAGE_DIMENSION = 512;
const MAX_DATA_URL_LENGTH = 1_800_000;

export const ProfileModal = ({
  isOpen,
  onClose,
  profile,
  setProfile,
  registry
}: {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileData;
  setProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
  registry: DataRegistry;
}) => {
  const [iconTab, setIconTab] = useState<ProfileIconType>(profile.iconType);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setIconTab(profile.iconType);
      setUploadStatus('');
      setUploadError('');
    }
  }, [isOpen, profile.iconType]);

  if (!isOpen) return null;

  const theme = CUSTOM_COLORS.find(c => c.id === profile.themeColor) || CUSTOM_COLORS[0];
  const themeHex = PROFILE_THEME_HEX[profile.themeColor] || PROFILE_THEME_HEX.red;
  const stats = [
    { label: 'Collections', value: registry.checklists.length }
  ];

  const updateProfile = (updates: Partial<ProfileData>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Failed to read image.'));
      reader.readAsDataURL(file);
    });

  const loadImage = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image.'));
      img.src = src;
    });

  const compressProfileImage = async (file: File) => {
    const isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
    if (isGif) {
      const dataUrl = await readFileAsDataUrl(file);
      return { dataUrl, note: 'GIFs are stored as-is to preserve animation.' };
    }

    const dataUrl = await readFileAsDataUrl(file);
    const image = await loadImage(dataUrl);
    const maxSide = Math.max(image.width, image.height);
    const scale = maxSide > MAX_IMAGE_DIMENSION ? MAX_IMAGE_DIMENSION / maxSide : 1;
    const targetWidth = Math.max(1, Math.round(image.width * scale));
    const targetHeight = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { dataUrl, note: 'Saved original image.' };
    ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

    const prefersPng = file.type === 'image/png';
    let output = canvas.toDataURL(prefersPng ? 'image/png' : 'image/jpeg', prefersPng ? undefined : 0.82);
    let note = 'Auto-compressed for local storage.';

    if (output.length > MAX_DATA_URL_LENGTH) {
      output = canvas.toDataURL('image/jpeg', 0.7);
      note = 'Downscaled and optimized to fit storage.';
    }

    return { dataUrl: output, note };
  };

  const toggleBadge = (id: string) => {
    setProfile(prev => {
      const exists = prev.badges.includes(id);
      return { ...prev, badges: exists ? prev.badges.filter(b => b !== id) : [...prev.badges, id] };
    });
  };

  const clearUpload = () => {
    updateProfile({ iconType: 'generic', iconId: 'shield', imageUrl: '' });
    setUploadStatus('');
    setUploadError('');
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setUploadStatus('Processing image...');

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
    if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.gif')) {
      setUploadError('Unsupported file type. Use PNG, JPG, or GIF.');
      setUploadStatus('');
      e.target.value = '';
      return;
    }

    try {
      const { dataUrl, note } = await compressProfileImage(file);
      if (dataUrl.length > MAX_DATA_URL_LENGTH * 2) {
        setUploadError('Image still too large after compression. Try a smaller file.');
        setUploadStatus('');
        e.target.value = '';
        return;
      }
      updateProfile({ iconType: 'upload', imageUrl: dataUrl });
      setIconTab('upload');
      setUploadStatus(note);
    } catch (error) {
      setUploadError('Could not process image. Try another file.');
      setUploadStatus('');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-5xl shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-zinc-900 border ${theme.border} flex items-center justify-center`}>
              <User size={18} className={theme.text} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Profile</h3>
              <p className="text-xs text-zinc-500">Customize your defender identity.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-950">
                <div className="relative h-28">
                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black" />
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `radial-gradient(circle at 22% 28%, ${themeHex}66, transparent 62%), radial-gradient(circle at 85% 15%, ${themeHex}33, transparent 55%)`
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-zinc-950" />
                </div>
                <div className="px-5 pb-5 pt-4">
                  <ProfileAvatar profile={profile} registry={registry} size={80} className="border-2" />
                  <div className="mt-3">
                    <div className="text-xl font-bold text-white">{profile.name}</div>
                    <div className="text-sm text-zinc-400">{profile.title}</div>
                  </div>
                  <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] bg-zinc-900 border border-zinc-800 text-zinc-400">
                    <span className={`w-1.5 h-1.5 rounded-full ${theme.class}`} />
                    {profile.status}
                  </div>
                  {profile.tagline && <div className="text-xs text-zinc-500 mt-3">{profile.tagline}</div>}
                  {profile.bio && <div className="text-xs text-zinc-600 mt-2">{profile.bio}</div>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                    <div className="text-[10px] uppercase text-zinc-500">{stat.label}</div>
                    <div className="text-lg font-semibold text-white">{stat.value}</div>
                  </div>
                ))}
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                <div className="text-xs uppercase text-zinc-500 mb-3 flex items-center gap-2">
                  <Tag size={12} />
                  Badges
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.badges.length ? (
                    profile.badges.map(badgeId => {
                      const badge = PROFILE_BADGES.find(b => b.id === badgeId);
                      return (
                        <span key={badgeId} className="px-2 py-1 rounded-full text-[11px] bg-zinc-950 border border-zinc-800 text-zinc-300">
                          {badge?.label || badgeId}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-xs text-zinc-600">No badges selected.</span>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
                <div>
                  <div className="text-xs uppercase text-zinc-500">Identity</div>
                  <div className="text-[11px] text-zinc-600">Name, title, status, and bio shown on your profile card.</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs uppercase text-zinc-500">Display Name</label>
                    <input
                      value={profile.name}
                      onChange={(e) => updateProfile({ name: e.target.value })}
                      className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white focus:border-red-500 outline-none"
                      placeholder="Defender Name"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase text-zinc-500">Title</label>
                    <input
                      value={profile.title}
                      onChange={(e) => updateProfile({ title: e.target.value })}
                      className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white focus:border-red-500 outline-none"
                      placeholder="Master Builder"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase text-zinc-500">Status</label>
                    <input
                      value={profile.status}
                      onChange={(e) => updateProfile({ status: e.target.value })}
                      className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white focus:border-red-500 outline-none"
                      placeholder="Offline Mode"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase text-zinc-500">Tagline</label>
                    <input
                      value={profile.tagline}
                      onChange={(e) => updateProfile({ tagline: e.target.value })}
                      className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white focus:border-red-500 outline-none"
                      placeholder="Short personal note"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase text-zinc-500">Bio</label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => updateProfile({ bio: e.target.value })}
                    className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white focus:border-red-500 outline-none min-h-[90px] resize-none"
                    placeholder="Add a short bio or goal."
                  />
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs uppercase text-zinc-500 flex items-center gap-2">
                    <Palette size={12} />
                    Accent Color
                  </div>
                  <span className="text-[11px] text-zinc-500">Used for highlights</span>
                </div>
                <div className="text-[11px] text-zinc-600 mb-3">Applies to borders, badges, and the profile aura.</div>
                <div className="flex flex-wrap gap-2">
                  {CUSTOM_COLORS.map(c => (
                    <button
                      key={c.id}
                      onClick={() => updateProfile({ themeColor: c.id })}
                      className={`w-7 h-7 rounded-full ${c.class} ${profile.themeColor === c.id ? 'ring-2 ring-white' : 'opacity-70 hover:opacity-100'} transition-all`}
                      title={c.id}
                    />
                  ))}
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs uppercase text-zinc-500">Icon Style</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIconTab('hero')}
                      className={`px-3 py-1 rounded text-xs border ${iconTab === 'hero' ? 'border-red-600 text-white' : 'border-zinc-700 text-zinc-500 hover:text-zinc-300'}`}
                    >
                      Heroes
                    </button>
                    <button
                      onClick={() => setIconTab('generic')}
                      className={`px-3 py-1 rounded text-xs border ${iconTab === 'generic' ? 'border-red-600 text-white' : 'border-zinc-700 text-zinc-500 hover:text-zinc-300'}`}
                    >
                      Icons
                    </button>
                    <button
                      onClick={() => setIconTab('upload')}
                      className={`px-3 py-1 rounded text-xs border ${iconTab === 'upload' ? 'border-red-600 text-white' : 'border-zinc-700 text-zinc-500 hover:text-zinc-300'}`}
                    >
                      Upload
                    </button>
                  </div>
                </div>
                <div className="text-[11px] text-zinc-600 mb-3">Pick a hero portrait, a built-in icon, or upload your own photo.</div>

                {iconTab === 'hero' && (
                  <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1">
                    {registry.heroes.map(h => (
                      <button
                        key={h.id}
                        onClick={() => updateProfile({ iconType: 'hero', iconId: h.id })}
                        className={`aspect-square rounded-lg border flex items-center justify-center ${profile.iconType === 'hero' && profile.iconId === h.id ? 'border-red-500 bg-red-900/20' : 'border-zinc-800 hover:border-red-500'}`}
                        title={h.name}
                      >
                        <HeroImage hero={h} className="w-8 h-8 object-contain" fallback={<div className={`w-8 h-8 rounded-full ${h.color}`} />} />
                      </button>
                    ))}
                  </div>
                )}

                {iconTab === 'generic' && (
                  <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1">
                    {GENERIC_ICONS.map(i => (
                      <button
                        key={i.id}
                        onClick={() => updateProfile({ iconType: 'generic', iconId: i.id })}
                        className={`aspect-square rounded-lg border flex items-center justify-center ${profile.iconType === 'generic' && profile.iconId === i.id ? 'border-red-500 bg-red-900/20' : 'border-zinc-800 hover:border-red-500'}`}
                        title={i.label}
                      >
                        <i.icon size={18} className="text-zinc-300" />
                      </button>
                    ))}
                  </div>
                )}

                {iconTab === 'upload' && (
                  <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] gap-4 items-center">
                    <div className="w-20 h-20 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden">
                      {profile.imageUrl ? (
                        <img src={profile.imageUrl} alt="Profile upload" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={20} className="text-zinc-500" />
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="text-xs text-zinc-500">Supports PNG, JPG, and GIF. Images are resized for local storage.</div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-2 rounded bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 hover:border-red-500 transition-colors"
                        >
                          Upload Image
                        </button>
                        <button
                          onClick={clearUpload}
                          className="px-3 py-2 rounded bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 hover:border-red-500 transition-colors"
                        >
                          Clear Photo
                        </button>
                        <button
                          onClick={() => updateProfile({ iconType: 'generic', iconId: 'shield' })}
                          className="text-xs text-zinc-500 hover:text-zinc-300"
                        >
                          Reset to default icon
                        </button>
                      </div>
                      {uploadStatus && <div className="text-xs text-zinc-500">{uploadStatus}</div>}
                      {uploadError && <div className="text-xs text-red-400">{uploadError}</div>}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/gif"
                        className="hidden"
                        onChange={handleUpload}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="text-xs uppercase text-zinc-500 mb-3">Select Badges</div>
                <div className="flex flex-wrap gap-2">
                  {PROFILE_BADGES.map(badge => {
                    const active = profile.badges.includes(badge.id);
                    return (
                      <button
                        key={badge.id}
                        onClick={() => toggleBadge(badge.id)}
                        className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${active ? 'border-red-500 text-white bg-red-900/20' : 'border-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
                      >
                        {badge.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-600">Saved locally on this device.</span>
                <Button variant="secondary" onClick={() => setProfile({ ...DEFAULT_PROFILE })}>Reset Profile</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
