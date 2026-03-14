# Asset Folder Structure

## SVG Graphics (`graphics/`)

All SVG sprites and spritesheets are stored in `graphics/` at the project root (not inside `client/`).

```
graphics/
├── luna_spritesheet.svg              # Luna player animations (idle, run, jump, fall)
├── enemy_basic_spritesheet_A.svg     # Basic enemy animation variant A
├── enemy_basic_spritesheet_B.svg     # Basic enemy animation variant B
├── enemy_basic_spritesheet_C.svg     # Basic enemy animation variant C
├── enemy_flying_spritesheet.svg      # Flying enemy animations (17 frames × 40px)
├── enemy_shooter_spritesheet.svg     # Shooter enemy animations
├── enemy_boss_spritesheet.svg        # Boss enemy animations
├── platform_ground_tile.svg          # Ground platform tile
├── platform_standard_tile.svg        # Standard platform tile
├── platform_moving_tile.svg          # Moving platform tile
├── platform_breaking_spritesheet.svg # Breaking platform states
├── platform_bouncy_spritesheet.svg   # Bouncy platform animation
├── collectible_carrot.svg
├── collectible_coin.svg
├── collectible_gem.svg
├── collectible_golden_carrot.svg
├── collectible_key.svg
├── powerup_doublejump.svg
├── powerup_extralife.svg
├── powerup_health.svg
├── powerup_highjump.svg
├── powerup_invulnerability.svg
├── powerup_speed.svg
├── projectile_shooter.svg            # Shooter enemy projectile (12×12px orb)
├── background_cave.svg
├── background_final.svg
├── background_forest.svg
├── background_garden.svg
├── decoration_clouds.svg
├── decoration_forest.svg
├── decoration_garden.svg
├── effect_collect.svg
├── effect_hit.svg
├── effect_jump.svg
├── effect_powerup.svg
├── interactable_door.svg
├── ui_healthbar.svg
├── ui_heart.svg
├── ui_mobile_controls.svg
├── ui_pause.svg
└── ui_score_popup.svg
```

## Level Data (`client/assets/levels/`)

```
client/assets/levels/
└── level-1.json     # Garden Adventure (width: 2000, height: 600)
```

Levels 2–5 implemented //TODO Document me!

## Audio (`client/assets/sounds/`, `client/assets/music/`)

Sound and music files are not yet implemented. The sound system is planned for a future milestone.

## Other Asset Directories

```
client/assets/configs/    # Game settings JSON (planned)
client/assets/sprites/    # Reserved for rasterized sprites if needed (currently empty)
```
