import React, { useEffect, useMemo, useState } from 'react';
import type { Hero } from '../types';

const HERO_IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'webp'];

const heroImageSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const buildHeroImageCandidates = (hero?: Hero) => {
  if (!hero) return [];
  const slug = heroImageSlug(hero.name || '');
  const bases = [];
  if (slug) bases.push(`/hero-images/${slug}`);
  if (hero.id) bases.push(`/hero-images/${hero.id}`);
  const local: string[] = [];
  bases.forEach((base) => {
    HERO_IMAGE_EXTS.forEach((ext) => local.push(`${base}.${ext}`));
  });
  const all = [...local, hero.iconUrl].filter(Boolean) as string[];
  return Array.from(new Set(all));
};

export const HeroImage = ({
  hero,
  className,
  alt,
  fallback
}: {
  hero?: Hero;
  className?: string;
  alt?: string;
  fallback?: React.ReactNode;
}) => {
  const candidates = useMemo(
    () => buildHeroImageCandidates(hero),
    [hero?.id, hero?.name, hero?.iconUrl]
  );
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [hero?.id, hero?.name, hero?.iconUrl]);

  const src = candidates[index];
  if (!hero || !src) return <>{fallback ?? null}</>;

  return (
    <img
      src={src}
      alt={alt ?? hero.name}
      className={className}
      onError={() => {
        setIndex((prev) => (prev + 1 < candidates.length ? prev + 1 : candidates.length));
      }}
    />
  );
};
