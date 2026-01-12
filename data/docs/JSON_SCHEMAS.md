# DD2 Toolkit - JSON Data Schemas

This document defines the expected structure for JSON data files used by the toolkit.

**IMPORTANT**: All JSON files in this directory are READ-ONLY. The toolkit only reads and consumes data - it never modifies these files.

## dd2_links.json

External community resources and useful links.

```json
[
  {
    "title": "Resource Name",
    "url": "https://example.com",
    "description": "Brief description of what this resource provides",
    "icon": "🔗",
    "category": "Database|Guides|Trading|Videos|Reference|Support"
  }
]
```

**Used by**: Resources Page (`js/tools-extended.js`)

## dd2_defenses.json

Defense/tower statistics and information.

```json
[
  {
    "name": "Cannonball Tower",
    "hero": "Squire",
    "du": 30,
    "base_hp": 5000,
    "range": 1200,
    "attack_rate": 1.5,
    "damage_types": ["Physical"],
    "status_effects": ["Knockback"],
    "icon": "path/to/icon.png",
    "description": "Fires explosive cannonballs that deal area damage"
  }
]
```

**Used by**: Tower Visualizer, Hero Builder, DPS Benchmark

## tower_dps_efficiency.json

DPS efficiency ratings per defense unit.

```json
[
  {
    "defense_name": "Cannonball Tower",
    "tier1_dps_per_10du": 15000,
    "tier5_dps_per_10du": 85000,
    "notes": "Area damage, good for grouped enemies"
  }
]
```

**Used by**: Tower Visualizer, DPS Benchmark

## godly_rates.json

Drop rates for godly gear by map and region.

```json
{
  "regions": {
    "Chaos I": {
      "icon": "⚔️",
      "maps": [
        {
          "map_name": "Dragonfall Bazaar",
          "godly_rate": 0.05,
          "gear_types": ["Weapons", "Armor", "Relics"]
        }
      ]
    }
  }
}
```

**Used by**: Map Efficiency Tracker

## onslaught_maps.json

Map pools for Onslaught floors.

```json
[
  {
    "group_type": "XX0",
    "description": "Floors ending in 0 (10, 20, 30, etc.)",
    "maps": [
      {
        "name": "Dead Road",
        "du": 2500,
        "size": "Large",
        "icon": "path/to/icon.png"
      }
    ]
  }
]
```

**Used by**: Onslaught Tracker

## onslaught_to_chaos.json

Chaos tier equivalency for Onslaught floors.

```json
[
  {
    "floor_min": 1,
    "floor_max": 29,
    "chaos_tier": "Chaos I",
    "notes": "Early progression"
  }
]
```

**Used by**: Onslaught Tracker (via DD2DataCache helper)

## dd2_difficulties.json

Difficulty tier information.

```json
[
  {
    "name": "Chaos I",
    "min_level": 50,
    "enemy_scaling": 1.0,
    "loot_quality": "Legendary",
    "description": "Entry level endgame"
  }
]
```

**Used by**: Multiple tools for difficulty info

## P_Weapon.json

Perfect weapon stat rolls by hero and weapon type.

```json
[
  {
    "hero": "Squire",
    "weapon_type": "Sword",
    "primary_stat": "Hero Damage",
    "secondary_stats": ["Crit Damage", "Defense Power"],
    "perfect_roll_min": 500000,
    "perfect_roll_max": 550000
  }
]
```

**Used by**: Gear Simulator, Hero Builder

## dd2_rings.json

Ring effects and statistics.

```json
[
  {
    "name": "Ring of Fire",
    "effect": "+25% Fire Damage",
    "drop_location": "Chaos III+",
    "max_upgrade_level": 5
  }
]
```

**Used by**: Gear Simulator, Hero Builder

## hypershards.json

Endgame hypershard data.

```json
[
  {
    "name": "Destruction",
    "type": "Offense",
    "max_points": 3,
    "effect_per_point": "+15% Hero Damage",
    "unlock_requirement": "C10 completion"
  }
]
```

**Used by**: Hero Builder

## materials.json

Crafting and upgrade materials.

```json
[
  {
    "name": "Gold",
    "icon": "💰",
    "sources": ["Maps", "Selling Items"],
    "used_for": ["Upgrades", "Rerolls"]
  }
]
```

**Used by**: Material Tracker

## dd2_questlines.json

Campaign and questline progression.

```json
[
  {
    "questline_name": "Tutorial",
    "quests": [
      {
        "name": "First Steps",
        "objective": "Complete the tutorial",
        "reward": "Basic Equipment"
      }
    ]
  }
]
```

**Used by**: Mission Tracker

## mastery_rewards.json

Mastery system rewards.

```json
[
  {
    "hero": "Squire",
    "mastery_level": 1,
    "reward_type": "Defense Slot",
    "description": "Unlock additional defense"
  }
]
```

**Used by**: Future Mastery Tracker tool

## Prime_incursions.json

Prime Incursion event data.

```json
[
  {
    "name": "Prime 1",
    "map": "The Wyvern Den",
    "mutators": ["Prime", "Schedule Modifier"],
    "rewards": ["Prime Weapons"]
  }
]
```

**Used by**: Future Prime Planner tool

---

## Integration Pattern

All tools should use the DD2DataCache system to load data:

```javascript
async render() {
    // Load data via cache
    const data = await DD2DataCache.load('dataKey');

    // Or use helper functions
    const defenses = DD2DataCache.filterDefenses({ hero: 'Squire' });

    // Handle missing data gracefully
    if (!data) {
        return this.renderFallback();
    }

    // Render with actual data
    return this.renderWithData(data);
}
```

## Adding New Data Files

1. Create the JSON file in `/data/` directory
2. Add entry to `DD2DataCache.dataFiles` in `js/core/data-cache.js`
3. Update tools to consume the data
4. Add schema documentation to this file
5. Update `INTEGRATION_STATUS.md` progress tracking
