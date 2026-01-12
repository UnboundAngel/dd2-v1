# DD2 V1 Planner

A single-page companion app for Dungeon Defenders 2. It includes a build editor,
gold calculator, heroes library, encyclopedia, collection tracker, and an
information-based map planner for survival + DU efficiency.

## Local Setup

```bash
npm install
npm run dev
```

## Project Structure

- `src/App.tsx` main app shell, routing, fuzzy search, registry, and theme.
- `src/pages/` feature pages (Map Planner, Gold Calculator, Heroes, etc.).
- `src/components/` shared UI and layout components.
- `src/data/` app-side normalization + local storage helpers.
- `data/` game data sources (abilities, defenses, shards, mods, maps, pets, etc.).
- `public/` static assets (hero images, pet ability images, etc.).

## Data Notes

- Defense data is sourced from `data/defenses/dd2_defenses.json`.
- Map Planner uses `data/maps/survival/survival.json`.
- DU efficiency uses `data/towers/tower_dps_efficiency.json`.
- Pet abilities: `data/pets/dd2_pet_abilities.json` with images in
  `public/pet-ability-images/`.

## Persistence

User edits and settings are saved to localStorage. If you need to reset,
clear browser storage for this app.
