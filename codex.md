# Codex Context

This repo is a DD2 companion app with multiple tools. The app is a Vite + React
SPA that loads local JSON data, normalizes it into a registry, and renders
feature pages. Keep edits ASCII unless a file already uses Unicode.

## App Entry + State

- `src/App.tsx` owns:
  - `registry` (game data + user-created builds/checklists).
  - `profile` (theme, avatar, and UI settings).
  - global fuzzy search + navigation.
  - CSS accent variables (`--accent`, `--accent-rgb`, etc.).

## Key Pages

- `src/pages/MapPlanner.tsx`:
  - Info-based planner (no visual map).
  - Survival wave intel from `data/maps/survival/survival.json`.
  - DU efficiency from `data/towers/tower_dps_efficiency.json`.
  - Uses tower data derived from defense data.
- `src/pages/GoldCalculator.tsx`:
  - Resets, streak, jackpot, timers, projections.
  - Local persistence.
- `src/pages/HeroesPage.tsx`:
  - Hero roster and dossier view.
- `src/pages/EncyclopediaPage.tsx`:
  - Abilities, defenses, shards, mods, links, and Pet Abilities tab.

## Data Sources

- `data/defenses/dd2_defenses.json` (primary tower/defense data).
- `data/abilities/`, `data/shards/`, `data/mods/`, `data/links/`.
- `data/pets/dd2_pet_abilities.json` with images in
  `public/pet-ability-images/` (index-based mapping).

## Normalization + Storage

- `src/data/registry.ts` normalizes data and builds `registry`.
- `dd2_planner_data` + `dd2_profile` stored in localStorage.

## Styling Notes

- Accent color is derived from profile and applied via CSS variables.
- Shared UI lives in `src/components/ui.tsx`.
- Custom dropdown styling is used across tools.

## Where To Add Things

- New encyclopedic data -> `data/<category>/` and update `registry.ts`.
- New page or tool -> `src/pages/` and add route in `src/App.tsx`.
- Global search targets -> `src/App.tsx` search items list.
