# VR Action RPG Prototype

A WebXR-compatible VR action RPG prototype inspired by Path of Exile, built with React, Three.js, and React Three Fiber. This prototype features a top-down/isometric camera perspective in a 3D environment for testing VR interaction and player control.

## Tech Stack

- **React** with TypeScript
- **React Three Fiber** (@react-three/fiber) - React renderer for Three.js
- **React Three XR** (@react-three/xr) - WebXR/VR functionality
- **Three.js** - 3D graphics library
- **Vite** - Fast build tool and dev server

## Features

### Current Implementation (Phase 1 ✅ + Phase 2 ✅)
- ✅ WebXR VR session support
- ✅ Isometric/top-down camera perspective
- ✅ Basic 3D environment (floor, lighting, grid)
- ✅ **Player character system** with smooth movement
- ✅ **Click-to-move mechanics** (click floor to move character)
- ✅ **VR controller support** (dual thumbstick controls)
- ✅ **Left controller** → direct character movement
- ✅ **Right controller** → cursor/reticle movement + targeting
- ✅ **VR trigger actions** (move to cursor, spell casting ready)
- ✅ **Character rotation** (faces movement direction)
- ✅ **Movement state management** (Zustand store)
- ✅ **Visual movement feedback** (target indicator rings)
- ✅ VR mode detection and setup
- ✅ Shadow casting and receiving

### Planned Features (Next Phases)
- 🔄 **Combat system** with spell casting and projectiles
- 🔄 **Monster spawning** and basic AI
- 🔄 **Health/Mana system** and character stats
- 🔄 **Experience and leveling** mechanics
- 🔄 **Inventory system** with VR-friendly UI
- 🔄 **Passive skill tree** (Path of Exile style)
- 🔄 **Improved movement bounds** and collision detection
- 🔄 **Hand tracking integration** (Quest native support)

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- A WebXR-compatible browser (Chrome, Edge with VR support)
- VR headset (optional for development - works in desktop mode too)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Development

The app will be available at `http://localhost:5173`. 

**VR Testing:**
1. Open the app in a WebXR-compatible browser
2. Click the "Enter VR" button when using a VR headset
3. The scene works in both desktop and VR modes

## Project Structure

```
src/
├── components/
│   ├── XRScene.tsx          # Main 3D environment component
│   ├── Player.tsx           # Player character with movement logic
│   ├── ClickToMove.tsx      # Click-to-move interaction system
│   ├── VRControls.tsx       # VR controller input handling
│   └── VRCursor.tsx         # VR cursor/reticle system
├── stores/
│   └── gameStore.ts         # Zustand state management for game data
├── App.tsx                  # XR session initialization and canvas setup
├── App.css                  # VR-specific styling
└── index.css                # Global styles
```

## Architecture

### Component Hierarchy
- **App**: Initializes XR store and canvas
- **XRScene**: Main 3D environment (floor, lighting, camera)
- **Player**: Character logic, movement, and visual representation
- **ClickToMove**: Click-to-move interaction system (desktop/VR)
- **VRControls**: VR controller input handling and movement
- **VRCursor**: VR cursor/reticle system for targeting
- *Future components*:
  - Combat: Spell casting and damage systems
  - Monster: Enemy AI and behaviors
  - Inventory: VR-friendly item management

### Design Principles
- Modular, testable React components
- Top-down/isometric camera (not first-person)
- Gamepad-style movement patterns
- WebXR compatibility for broad VR headset support

## Current Features

### Movement System
- **Click-to-Move**: Click anywhere on the floor to move your character
- **VR Thumbstick Movement**: Left controller thumbstick for direct character control
- **Smooth Movement**: Character smoothly interpolates to target position
- **Smart Rotation**: Character automatically faces movement direction
- **Movement Bounds**: Movement is constrained to the playable area
- **Visual Feedback**: Green ring shows movement target location
- **Idle Animation**: Subtle bobbing when character is stationary

### VR Controller System
- **Left Controller**: Character movement via thumbstick
- **Right Controller**: Cursor/reticle movement and targeting
- **Trigger Actions**: Right trigger moves character to cursor position
- **Visual Feedback**: Color-coded cursors (green=idle, red=targeting)
- **Deadzone Handling**: Prevents unintentional input from small movements
- **Button Detection**: Ready for spell casting and interaction systems

### Character System
- **Multi-part Character**: Body, head, and directional indicator
- **State Management**: Position, rotation, and movement state via Zustand
- **Movement Physics**: Configurable speed and rotation interpolation

## Controls

### Desktop Mode
- **Mouse**: Click on floor to move character
- **VR Button**: Click to enter VR mode when headset is connected

### VR Mode (Quest/PCVR)
- **Left Thumbstick**: Move character directly
- **Right Thumbstick**: Move cursor/reticle around the scene
- **Right Trigger**: Move character to cursor position
- **Buttons**: Ready for spell casting and interactions (logged to console)

---

Built with ❤️ using React Three Fiber and WebXR

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
