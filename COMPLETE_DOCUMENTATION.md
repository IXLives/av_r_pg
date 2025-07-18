# VR ARPG Complete Project Documentation
*Last Updated: January 17, 2025*

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [File-by-File Code Documentation](#file-by-file-code-documentation)
4. [ECS System Documentation](#ecs-system-documentation)
5. [Component Documentation](#component-documentation)
6. [Store Management](#store-management)
7. [Known Issues & Troubleshooting](#known-issues--troubleshooting)

---

## Project Overview

This is a WebXR VR action RPG prototype inspired by Path of Exile, built with React, TypeScript, and Three.js. The project features:

- **VR Support**: Full WebXR compatibility for Quest headsets
- **ECS Architecture**: Entity-Component-System for game logic
- **Combat System**: Real-time combat with skills, health, and targeting
- **Movement**: Gamepad-style movement with cursor-based targeting
- **UI**: VR-friendly health bars, death/respawn system

### Tech Stack
- **Frontend**: React 18 + TypeScript
- **3D Engine**: Three.js + React Three Fiber (@react-three/fiber)
- **VR**: React Three XR (@react-three/xr)
- **State**: Zustand for game state management
- **Build**: Vite for development and bundling

---

## Architecture

### Core Design Patterns

#### 1. Entity-Component-System (ECS)
```
Entity: Unique ID container
├── Component: Data-only structures (health, transform, etc.)
├── System: Logic processors (combat, AI, movement)
└── World: Manages entities and systems
```

#### 2. React Component Structure
```
App (XR Session)
├── XRScene (3D Environment)
│   ├── Player (Character)
│   ├── Monster/AdvancedMonster (Enemies)
│   ├── VRControls (Input)
│   └── ClickToMove (Movement)
└── PlayerUI (Health, Death Screen)
```

#### 3. State Management
- **Zustand Store**: Global game state, player data, ECS world
- **React State**: Component-local UI state
- **ECS Components**: Game entity data (health, position, etc.)

---

## File-by-File Code Documentation

### `/src/main.tsx`
**Purpose**: Application entry point, React root mounting
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'  // Global styles
import App from './App.tsx'  // Main app component

// Mount React app to DOM element with id 'root'
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

**Key Details**:
- `StrictMode`: Enables React development warnings and checks
- `createRoot`: React 18 API for concurrent features
- `!` operator: TypeScript non-null assertion for DOM element

### `/src/App.tsx`
**Purpose**: XR session initialization and main scene wrapper
```tsx
import { Canvas } from '@react-three/fiber'
import { XR, createXRStore } from '@react-three/xr'
import XRScene from './components/XRScene'
import PlayerUI from './components/PlayerUI'

// Create XR store for VR session management
const store = createXRStore()

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {/* R3F Canvas with XR support */}
      <Canvas
        camera={{ position: [0, 10, 10], fov: 50 }}
        shadows
        style={{ background: '#1a1a2e' }}
      >
        <XR store={store}>
          <XRScene />
        </XR>
      </Canvas>
      
      {/* UI overlay outside of 3D canvas */}
      <PlayerUI />
      
      {/* VR Enter button */}
      <button
        onClick={() => store.enterVR()}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '12px 24px',
          fontSize: '16px',
          background: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          zIndex: 1001
        }}
      >
        Enter VR
      </button>
    </div>
  )
}
```

**Key Details**:
- `Canvas`: React Three Fiber root component, creates WebGL context
- `camera`: Initial camera position (x:0, y:10, z:10) for isometric view
- `shadows`: Enables shadow mapping in Three.js
- `XR store`: Manages VR session state (enter/exit VR)
- `zIndex: 1001`: Ensures VR button appears above all other UI

### `/src/components/XRScene.tsx`
**Purpose**: Main 3D scene setup, lighting, floor, and entity containers
```tsx
import { useEffect } from 'react'
import { useGameStore } from '../stores/gameStore'
import Player from './Player'
import Monster from './Monster'
import AdvancedMonster from './AdvancedMonster'
import VRControls from './VRControls'
import ClickToMove from './ClickToMove'
import CameraFollow from './CameraFollow'
import * as THREE from 'three'

export default function XRScene() {
  const { ecsWorld, systemManager, initializeSystems, updateECS } = useGameStore()

  // Initialize ECS systems once when scene mounts
  useEffect(() => {
    console.log('🌍 XRScene: Initializing ECS systems...')
    initializeSystems()
    
    // Set player entity for systems that need it
    systemManager.setPlayerEntity('player_entity')
    console.log('✅ XRScene: ECS systems initialized')
  }, [initializeSystems, systemManager])

  // ECS update loop - runs every frame
  useFrame((state, delta) => {
    updateECS(delta)  // Update all ECS systems with deltaTime
  })

  return (
    <>
      {/* Lighting Setup */}
      <ambientLight intensity={0.4} color="#ffffff" />
      <directionalLight
        position={[10, 10, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />

      {/* Environment */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#2d5016" />
      </mesh>

      {/* Game Entities */}
      <Player />
      
      {/* Enemy Spawns */}
      <Monster position={new THREE.Vector3(5, 0.5, 5)} health={75} />
      <Monster position={new THREE.Vector3(-3, 0.5, 7)} health={50} />
      <AdvancedMonster position={new THREE.Vector3(7, 0.5, -4)} monsterType="heavy" />
      <AdvancedMonster position={new THREE.Vector3(-6, 0.5, -2)} monsterType="fast" />

      {/* Control Systems */}
      <VRControls />
      <ClickToMove />
      <CameraFollow />
    </>
  )
}
```

**Key Details**:
- `useFrame`: React Three Fiber hook, runs every animation frame (~60fps)
- `ambientLight`: Base illumination for all objects
- `directionalLight`: Sun-like light with shadow casting
- `shadow-mapSize`: 2048x2048 shadow texture resolution for quality
- `planeGeometry`: 20x20 unit floor mesh
- `receiveShadow/castShadow`: Shadow system configuration

### `/src/stores/gameStore.ts`
**Purpose**: Centralized game state management using Zustand
```tsx
import { create } from 'zustand'
import * as THREE from 'three'
import { ECSWorld } from '../systems/ECS'
import { SystemManager } from '../systems/SystemManager'

// Player state interface
interface PlayerState {
  position: THREE.Vector3      // Current world position
  targetPosition: THREE.Vector3 | null  // Movement destination
  isMoving: boolean           // Movement state flag
  moveSpeed: number           // Units per second
  rotationY: number           // Y-axis rotation in radians
  entityId?: string           // Link to ECS entity
}

// Game store interface
interface GameStore {
  player: PlayerState
  ecsWorld: ECSWorld
  systemManager: SystemManager
  currentTarget: string | null  // Currently targeted entity ID
  
  // Player actions
  setPlayerPosition: (position: THREE.Vector3) => void
  setPlayerTarget: (target: THREE.Vector3 | null) => void
  setPlayerMoving: (moving: boolean) => void
  setPlayerRotation: (rotationY: number) => void
  
  // Combat actions
  setCurrentTarget: (entityId: string | null) => void
  
  // Movement helpers
  movePlayerToTarget: (target: THREE.Vector3) => void
  stopPlayerMovement: () => void
  
  // ECS helpers
  updateECS: (deltaTime: number) => void
  initializeSystems: () => void
  respawnPlayer: () => void
}

// Create the game store
export const useGameStore = create<GameStore>((set, get) => {
  // Initialize ECS World
  const ecsWorld = new ECSWorld()
  const systemManager = SystemManager.getInstance(ecsWorld)
  
  return {
    ecsWorld,
    systemManager,
    currentTarget: null,
    
    // Initial player state
    player: {
      position: new THREE.Vector3(0, 0.5, 0), // Start at center, elevated
      targetPosition: null,
      isMoving: false,
      moveSpeed: 3.0, // Units per second
      rotationY: 0,
    },

    // Player position setter with change detection
    setPlayerPosition: (position: THREE.Vector3) =>
      set((state) => {
        // Only update if position actually changed to prevent unnecessary re-renders
        if (state.player.position.equals(position)) {
          return state
        }
        return {
          player: { ...state.player, position: position.clone() }
        }
      }),

    // Movement target setter with change detection
    setPlayerTarget: (target: THREE.Vector3 | null) =>
      set((state) => {
        // Only update if target actually changed
        if (target === null && state.player.targetPosition === null) {
          return state
        }
        if (target && state.player.targetPosition && target.equals(state.player.targetPosition)) {
          return state
        }
        return {
          player: { 
            ...state.player, 
            targetPosition: target ? target.clone() : null 
          }
        }
      }),

    // Set current combat target with system synchronization
    setCurrentTarget: (entityId: string | null) => {
      const currentTarget = get().currentTarget
      
      // Allow target switching regardless of previous target status
      if (currentTarget !== entityId) {
        console.log(`🎯 Switching target from ${currentTarget} to ${entityId}`)
        set({ currentTarget: entityId })
        
        // Also set target in combat system
        const { ecsWorld } = get()
        const worldSystems = (ecsWorld as any).systems
        const combatSystem = worldSystems?.find((s: any) => s.constructor.name === 'PlayerCombatSystem')
        if (combatSystem) {
          combatSystem.setTarget(entityId)
        }
      }
    },

    // ECS update loop - called every frame
    updateECS: (deltaTime: number) => {
      const { ecsWorld } = get()
      ecsWorld.update(deltaTime)
    },

    // Initialize all systems
    initializeSystems: () => {
      const { systemManager, setCurrentTarget } = get()
      systemManager.initializeSystems()
      
      // Set up combat system callback to clear target when monster dies
      const playerCombatSystem = systemManager.getSystem('playerCombat') as any
      if (playerCombatSystem && typeof playerCombatSystem.setClearTargetCallback === 'function') {
        playerCombatSystem.setClearTargetCallback(setCurrentTarget)
      }
    },

    // Respawn player with full health and reset position
    respawnPlayer: () => {
      console.log('🔄 Respawning player...')
      const { ecsWorld, setPlayerPosition, setPlayerTarget, setPlayerMoving, setCurrentTarget } = get()
      
      // Reset player position and movement
      const spawnPosition = new THREE.Vector3(0, 0.5, 0)
      setPlayerPosition(spawnPosition)
      setPlayerTarget(null)
      setPlayerMoving(false)
      setCurrentTarget(null)
      console.log('✅ Player position and movement reset')
      
      // Reset player health in ECS
      const playerEntity = ecsWorld.getEntity('player_entity')
      if (playerEntity) {
        const healthComponent = playerEntity.getComponent('health') as any
        if (healthComponent) {
          console.log(`🏥 Player health before respawn: ${healthComponent.current}/${healthComponent.maximum}`)
          healthComponent.current = healthComponent.maximum
          console.log(`🏥 Player health after respawn: ${healthComponent.current}/${healthComponent.maximum}`)
        } else {
          console.log('❌ No health component found on player entity')
        }
      } else {
        console.log('❌ No player entity found')
      }
      console.log('🔄 Respawn complete')
    },
  }
})
```

**Key Implementation Details**:
- `create<GameStore>`: Zustand store creation with TypeScript
- `position.clone()`: Prevents reference sharing issues with Three.js vectors
- `position.equals()`: Optimization to prevent unnecessary React re-renders
- `SystemManager.getInstance()`: Singleton pattern for system management
- `(ecsWorld as any).systems`: Type assertion for accessing internal systems

## ECS System Documentation

### Entity-Component-System Overview
The ECS pattern separates:
- **Entities**: Unique identifiers (strings like 'player_entity', 'monster_123')
- **Components**: Pure data structures (HealthComponent, TransformComponent)
- **Systems**: Logic processors that operate on entities with specific components

### Core ECS Classes

#### `/src/systems/ECS.ts`
```typescript
// Base component interface - all components extend this
export interface Component {
  type: string  // Component type identifier
}

// Entity class - container for components
export class Entity {
  public id: string
  private components: Map<string, Component> = new Map()

  constructor(id: string) {
    this.id = id
  }

  // Add component to entity (fluent interface)
  addComponent(component: Component): Entity {
    this.components.set(component.type, component)
    return this  // Allow chaining: entity.addComponent(health).addComponent(transform)
  }

  // Remove component by type
  removeComponent(type: string): void {
    this.components.delete(type)
  }

  // Get component by type with generic return
  getComponent<T extends Component>(type: string): T | undefined {
    return this.components.get(type) as T | undefined
  }

  // Check if entity has specific component
  hasComponent(type: string): boolean {
    return this.components.has(type)
  }

  // Get all components (for debugging)
  getAllComponents(): Component[] {
    return Array.from(this.components.values())
  }
}

// System base class - all systems extend this
export abstract class System {
  // Main update loop - implemented by each system
  abstract update(entities: Entity[], deltaTime: number): void
}

// ECS World - manages entities and systems
export class ECSWorld {
  private entities: Map<string, Entity> = new Map()
  private systems: System[] = []

  // Create new entity with unique ID
  createEntity(id: string): Entity {
    const entity = new Entity(id)
    this.entities.set(id, entity)
    return entity
  }

  // Remove entity by ID
  removeEntity(id: string): void {
    this.entities.delete(id)
  }

  // Get entity by ID
  getEntity(id: string): Entity | undefined {
    return this.entities.get(id)
  }

  // Get all entities as array
  getAllEntities(): Entity[] {
    return Array.from(this.entities.values())
  }

  // Add system to world
  addSystem(system: System): void {
    this.systems.push(system)
  }

  // Update all systems with deltaTime
  update(deltaTime: number): void {
    const entities = this.getAllEntities()
    this.systems.forEach(system => {
      system.update(entities, deltaTime)
    })
  }
}
```

### Component Definitions

#### `/src/systems/CombatComponents.ts`
```typescript
import * as THREE from 'three'
import type { Component } from './ECS'

// Health and vital stats
export interface HealthComponent extends Component {
  type: 'health'
  current: number      // Current HP
  maximum: number      // Maximum HP
  regeneration: number // HP per second regeneration
}

// Combat statistics
export interface CombatStatsComponent extends Component {
  type: 'combatStats'
  damage: number           // Base damage per attack
  attackSpeed: number      // Attacks per second
  attackRange: number      // Attack range in world units
  accuracy: number         // 0-1, chance to hit
  criticalChance: number   // 0-1, chance for critical hit
  criticalMultiplier: number // Damage multiplier for crits
}

// Faction system for friend/foe identification
export interface FactionComponent extends Component {
  type: 'faction'
  faction: 'player' | 'enemy' | 'neutral'
  hostile: string[]  // Array of hostile faction names
}

// 3D position, rotation, scale
export interface TransformComponent extends Component {
  type: 'transform'
  position: THREE.Vector3
  rotation: THREE.Euler
  scale: THREE.Vector3
}

// AI behavior for enemies
export interface AIComponent extends Component {
  type: 'ai'
  state: 'idle' | 'patrol' | 'chase' | 'attack' | 'dead'
  target?: string              // Entity ID of current target
  lastTargetPosition?: THREE.Vector3
  aggroRange: number           // Detection range
  attackCooldown: number       // Seconds between attacks
  lastAttackTime: number       // Timestamp of last attack
}

// Movement and physics
export interface MovementComponent extends Component {
  type: 'movement'
  velocity: THREE.Vector3
  speed: number               // Movement speed in units/second
  isMoving: boolean
  targetPosition?: THREE.Vector3
}

// Link to Three.js mesh for rendering
export interface MeshComponent extends Component {
  type: 'mesh'
  mesh: THREE.Mesh
}

// Component factory functions with defaults
export const createHealthComponent = (max = 100): HealthComponent => ({
  type: 'health',
  current: max,
  maximum: max,
  regeneration: 0
})

export const createCombatStatsComponent = (stats: {
  damage?: number
  attackSpeed?: number
  attackRange?: number
  accuracy?: number
  criticalChance?: number
  criticalMultiplier?: number
} = {}): CombatStatsComponent => ({
  type: 'combatStats',
  damage: stats.damage ?? 10,
  attackSpeed: stats.attackSpeed ?? 1.0,
  attackRange: stats.attackRange ?? 2.0,
  accuracy: stats.accuracy ?? 0.95,
  criticalChance: stats.criticalChance ?? 0.1,
  criticalMultiplier: stats.criticalMultiplier ?? 2.0
})

export const createFactionComponent = (faction: 'player' | 'enemy' | 'neutral'): FactionComponent => {
  const hostile: string[] = []
  if (faction === 'player') hostile.push('enemy')
  if (faction === 'enemy') hostile.push('player')
  
  return {
    type: 'faction',
    faction,
    hostile
  }
}

export const createTransformComponent = (
  position = new THREE.Vector3(0, 0, 0),
  rotation = new THREE.Euler(0, 0, 0),
  scale = new THREE.Vector3(1, 1, 1)
): TransformComponent => ({
  type: 'transform',
  position,
  rotation,
  scale
})

export const createAIComponent = (aggroRange = 5, attackCooldown = 1): AIComponent => ({
  type: 'ai',
  state: 'idle',
  aggroRange,
  attackCooldown,
  lastAttackTime: 0
})

export const createMovementComponent = (speed = 3): MovementComponent => ({
  type: 'movement',
  velocity: new THREE.Vector3(0, 0, 0),
  speed,
  isMoving: false
})

export const createMeshComponent = (mesh: THREE.Mesh): MeshComponent => ({
  type: 'mesh',
  mesh
})
```

## Component Documentation

### Player Component (`/src/components/Player.tsx`)
**Purpose**: Player character representation, movement handling, ECS entity creation

```tsx
import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../stores/gameStore'
import {
  createHealthComponent,
  createCombatStatsComponent,
  createFactionComponent,
  createTransformComponent,
  createMovementComponent,
  createMeshComponent,
  type TransformComponent
} from '../systems/CombatComponents'
import type { Entity } from '../systems/ECS'
import * as THREE from 'three'

export default function Player() {
  const { player, ecsWorld, setPlayerPosition, setPlayerRotation, stopPlayerMovement } = useGameStore()
  const meshRef = useRef<THREE.Mesh>(null)
  const entityRef = useRef<Entity | null>(null)

  // Movement calculation constants
  const MOVEMENT_THRESHOLD = 0.1 // Stop moving when this close to target
  const ROTATION_SPEED = 8.0 // Radians per second rotation speed

  // Create player entity in ECS (runs once)
  useEffect(() => {
    if (entityRef.current) return // Prevent duplicate creation

    // Create player entity with fixed ID
    const playerEntity = ecsWorld.createEntity('player_entity')
    entityRef.current = playerEntity

    // Add all necessary components
    playerEntity
      .addComponent(createHealthComponent(100)) // Player has 100 HP
      .addComponent(createCombatStatsComponent({ 
        damage: 25, 
        attackSpeed: 1.2, 
        attackRange: 3.0  // Increased attack range
      }))
      .addComponent(createFactionComponent('player'))
      .addComponent(createTransformComponent(player.position.clone()))
      .addComponent(createMovementComponent(player.moveSpeed))

    console.log('Player entity created with ID: player_entity')

    // Add mesh component once mesh is available
    if (meshRef.current) {
      const meshComponent = createMeshComponent(meshRef.current)
      playerEntity.addComponent(meshComponent)
    }

    // Cleanup function
    return () => {
      if (entityRef.current) {
        ecsWorld.removeEntity(entityRef.current.id)
        entityRef.current = null
      }
    }
  }, [ecsWorld]) // Only depend on ecsWorld to prevent re-creation on position changes

  // Handle movement and rotation every frame
  useFrame((state, delta) => {
    if (!meshRef.current) return

    const mesh = meshRef.current
    const currentPos = mesh.position

    // Initialize mesh position if needed (only once)
    if (currentPos.length() === 0) {
      mesh.position.copy(player.position)
      return
    }

    // Handle movement to target
    if (player.isMoving && player.targetPosition) {
      const target = player.targetPosition
      const direction = new THREE.Vector3().subVectors(target, currentPos)
      const distance = direction.length()
      
      // Check if we've reached the target
      if (distance < MOVEMENT_THRESHOLD) {
        // Snap to target and stop moving
        mesh.position.copy(target)
        setPlayerPosition(target)
        stopPlayerMovement()
      } else {
        // Continue moving toward target
        direction.normalize()
        const moveDistance = player.moveSpeed * delta
        
        // Calculate new position with boundary constraints
        const newPosition = currentPos.clone().add(
          direction.multiplyScalar(Math.min(moveDistance, distance))
        )
        
        // Constrain to map boundaries
        const maxX = 9, maxZ = 9, minX = -9, minZ = -9
        newPosition.x = Math.max(minX, Math.min(maxX, newPosition.x))
        newPosition.z = Math.max(minZ, Math.min(maxZ, newPosition.z))
        newPosition.y = 0.5 // Keep player at proper height
        
        // Update mesh position
        mesh.position.copy(newPosition)
        setPlayerPosition(newPosition)
        
        // Rotate player to face movement direction
        if (direction.length() > 0) {
          const targetRotation = Math.atan2(direction.x, direction.z)
          
          // Smooth rotation interpolation
          const currentRotation = mesh.rotation.y
          let rotationDiff = targetRotation - currentRotation
          
          // Handle rotation wrap-around (shortest path)
          if (rotationDiff > Math.PI) rotationDiff -= 2 * Math.PI
          if (rotationDiff < -Math.PI) rotationDiff += 2 * Math.PI
          
          const newRotation = currentRotation + rotationDiff * ROTATION_SPEED * delta
          mesh.rotation.y = newRotation
          setPlayerRotation(newRotation)
        }
      }
    }
    
    // Add subtle idle animation when not moving
    if (!player.isMoving) {
      const time = state.clock.getElapsedTime()
      mesh.position.y = player.position.y + Math.sin(time * 2) * 0.02 // Gentle bobbing
    }

    // Sync ECS transform component with mesh position
    if (entityRef.current) {
      const transform = entityRef.current.getComponent<TransformComponent>('transform')
      if (transform) {
        transform.position.copy(mesh.position)
        transform.rotation.y = mesh.rotation.y
      }
    }
  })

  return (
    <group>
      {/* Main Player Character */}
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
      >
        {/* Character body - slightly taller rectangle */}
        <boxGeometry args={[0.8, 1.2, 0.6]} />
        <meshStandardMaterial color="#ff6b6b" />
        
        {/* Character "head" - smaller cube on top */}
        <mesh position={[0, 0.8, 0]} castShadow>
          <boxGeometry args={[0.4, 0.4, 0.4]} />
          <meshStandardMaterial color="#ff8888" />
        </mesh>
        
        {/* Direction indicator - shows facing direction */}
        <mesh position={[0, 0.2, 0.4]} castShadow>
          <boxGeometry args={[0.1, 0.1, 0.3]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </mesh>
    </group>
  )
}
```

**Key Implementation Details**:
- **Entity Creation**: Single entity with ID 'player_entity'
- **Movement**: Interpolated movement with boundary constraints
- **Rotation**: Smooth rotation towards movement direction
- **ECS Sync**: Transform component synced with Three.js mesh every frame
- **Cleanup**: Proper entity removal on component unmount

## Known Issues & Troubleshooting

### Current Issues

1. **Monster Targeting Problems**
   - **Symptom**: Some monsters can't be targeted/clicked
   - **Cause**: Click handlers may not be properly attached or faction validation failing
   - **Debug**: Check console for faction validation errors

2. **Health Bar Updates**
   - **Status**: ✅ FIXED - Dynamic health bars implemented
   - **Solution**: Health bars now update in real-time based on ECS health components

3. **Range Calculation**
   - **Status**: ✅ IMPROVED - Continuous range checking implemented
   - **Behavior**: Range is now recalculated every frame for dynamic combat

4. **Collision Detection**
   - **Status**: ✅ IMPLEMENTED - CollisionSystem added
   - **Behavior**: Entities push apart when overlapping

### Debug Console Commands

```javascript
// Access game store in browser console
const gameStore = window.__GAME_STORE__ // If exposed

// Check ECS entities
console.log(gameStore.ecsWorld.getAllEntities())

// Check current target
console.log(gameStore.currentTarget)

// Force respawn
gameStore.respawnPlayer()
```

### Performance Considerations

1. **Frame Rate**: Target 60fps in VR, 30fps minimum
2. **Entity Limit**: Recommend max 50 entities for smooth performance
3. **Shadow Quality**: 2048x2048 shadow maps balance quality/performance
4. **Component Updates**: Only update when necessary to prevent re-renders

---

*This documentation is continuously updated with each code change. Last major update: Health bar fixes and collision system implementation.*
