import { create } from 'zustand'
import * as THREE from 'three'

// Player state interface
interface PlayerState {
  position: THREE.Vector3
  targetPosition: THREE.Vector3 | null
  isMoving: boolean
  moveSpeed: number
  rotationY: number
}

// Game store interface
interface GameStore {
  player: PlayerState
  
  // Player actions
  setPlayerPosition: (position: THREE.Vector3) => void
  setPlayerTarget: (target: THREE.Vector3 | null) => void
  setPlayerMoving: (moving: boolean) => void
  setPlayerRotation: (rotationY: number) => void
  
  // Movement helpers
  movePlayerToTarget: (target: THREE.Vector3) => void
  stopPlayerMovement: () => void
}

// Create the game store
export const useGameStore = create<GameStore>((set, get) => ({
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
    set((state) => ({
      player: { ...state.player, position: position.clone() }
    })),

  // Target position setter
  setPlayerTarget: (target: THREE.Vector3 | null) =>
    set((state) => ({
      player: { 
        ...state.player, 
        targetPosition: target ? target.clone() : null 
      }
    })),

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
}))
