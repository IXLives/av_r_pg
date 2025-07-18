# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Context
This is a WebXR VR action RPG prototype inspired by Path of Exile. The project uses:

- React with TypeScript
- React Three Fiber (@react-three/fiber) for Three.js integration
- React Three XR (@react-three/xr) for WebXR/VR functionality
- Top-down/isometric camera perspective (not first-person)
- Modular component architecture

## Key Design Principles
- Use gamepad-style movement: left stick moves character, right stick moves cursor/reticle
- Support VR cursor clicking/dragging for character movement (character walks to/follows cursor)
- Avoid first-person or teleport movement patterns
- Prioritize modular, testable React components
- Keep Three.js code wrapped in React Three Fiber patterns
- Design for Quest headset testing on local network
- Use HTTPS for WebXR compatibility on mobile devices

## Component Architecture
### Core Systems (Phase 1 - COMPLETED)
- App: XR session initialization
- XRScene: Main 3D environment (floor, lighting, camera)

### Movement & Controls (Phase 2 - COMPLETED)
- Player: Character representation with movement
- VRControls: Dual thumbstick + cursor movement system
- VRCursor: VR interaction pointer and targeting
- ClickToMove: Click/drag movement system

### Combat System (Phase 3 - COMPLETED)
- SkillSystem: Active abilities and spell casting  
- CombatManager: Damage calculation, effects
- Monster: Enemy AI and behaviors with dynamic health bars
- ProjectileSystem: Ranged attacks and spells
- PlayerCombatSystem: Player attack logic with range validation
- MonsterAISystem: Enemy AI with aggression on attack
- CollisionSystem: Entity collision detection and separation
- Health/Death System: Player respawn functionality with UI

### Character Progression (Phase 4)
- CharacterStats: Level, health, mana, attributes
- SkillTree: Passive skill system (Path of Exile style)
- Inventory: Item management and equipment
- ItemSystem: Loot generation and stats

### World Systems (Phase 5)
- WorldGeneration: Procedural area generation
- LootSystem: Item drops and rewards
- QuestSystem: Objectives and progression
- UISystem: VR-friendly menus and HUD

## Recent Updates & Known Issues

### ✅ Recently Fixed
- Map boundary constraints (rectangular instead of circular)
- Dynamic health bars for monsters (real-time updates)
- Monster aggression when attacked
- Player respawn functionality
- Collision detection between entities
- Target switching (can change targets freely)
- Range calculation (continuous checking)
- Player death prevention (no attacks when dead)

### 🐛 Current Issues
- Some monsters may not be targetable (investigating click handlers)
- Type assertions needed for ECS component access (should be fixed)

### 📝 Documentation
- COMPLETE_DOCUMENTATION.md: Comprehensive code documentation
- Copilot instructions updated with current project state
- ECS architecture fully documented with examples

## Code Style
- Use TypeScript for type safety
- Prefer functional components with hooks
- Add inline comments for Three.js/XR-specific code
- Keep components focused and single-responsibility
- Use Zustand for game state management
- Implement ECS pattern for game entities
