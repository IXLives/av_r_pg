import { create } from 'zustand'
import * as THREE from 'three'
import { ECSWorld } from '../systems/ECS'
import { SystemManager } from '../systems/SystemManager'

// Player state interface
interface PlayerState {
  position: THREE.Vector3
  targetPosition: THREE.Vector3 | null
  isMoving: boolean
  moveSpeed: number
  rotationY: number
  entityId?: string // Link to ECS entity
}

// Game store interface
interface GameStore {
  player: PlayerState
  ecsWorld: ECSWorld
  systemManager: SystemManager
  currentTarget: string | null
  
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

    // Player position setter
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

    // Target position setter
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

    // Movement state setter
    setPlayerMoving: (moving: boolean) =>
      set((state) => ({
        player: { ...state.player, isMoving: moving }
      })),

    // Rotation setter
    setPlayerRotation: (rotationY: number) =>
      set((state) => ({
        player: { ...state.player, rotationY }
      })),

    // Helper: Start movement to target
    movePlayerToTarget: (target: THREE.Vector3) => {
      const { setPlayerTarget, setPlayerMoving } = get()
      setPlayerTarget(target)
      setPlayerMoving(true)
    },

    // Helper: Stop all movement
    stopPlayerMovement: () => {
      const { setPlayerTarget, setPlayerMoving } = get()
      setPlayerTarget(null)
      setPlayerMoving(false)
    },

    // Set current combat target
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

    // ECS update loop
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

    // Respawn player
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
