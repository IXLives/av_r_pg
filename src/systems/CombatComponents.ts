// Combat-related components for the ECS system
import * as THREE from 'three'
import type { Component } from './ECS'

// Health and vital stats
export interface HealthComponent extends Component {
  type: 'health'
  current: number
  maximum: number
  regeneration: number // HP per second
}

// Combat statistics
export interface CombatStatsComponent extends Component {
  type: 'combatStats'
  damage: number
  attackSpeed: number // Attacks per second
  attackRange: number
  accuracy: number // 0-1, chance to hit
  criticalChance: number // 0-1, chance for critical hit
  criticalMultiplier: number // Damage multiplier for crits
}

// Team/faction system (player vs enemies vs neutrals)
export interface FactionComponent extends Component {
  type: 'faction'
  faction: 'player' | 'enemy' | 'neutral'
  hostile: string[] // Array of hostile faction names
}

// 3D position and rotation
export interface TransformComponent extends Component {
  type: 'transform'
  position: THREE.Vector3
  rotation: THREE.Euler
  scale: THREE.Vector3
}

// 3D mesh for rendering
export interface MeshComponent extends Component {
  type: 'mesh'
  mesh: THREE.Mesh
  visible: boolean
}

// AI behavior for enemies
export interface AIComponent extends Component {
  type: 'ai'
  state: 'idle' | 'patrol' | 'chase' | 'attack' | 'dead'
  target?: string // Entity ID of current target
  lastTargetPosition?: THREE.Vector3
  aggroRange: number
  attackCooldown: number
  lastAttackTime: number
}

// Movement and physics
export interface MovementComponent extends Component {
  type: 'movement'
  velocity: THREE.Vector3
  speed: number
  isMoving: boolean
  targetPosition?: THREE.Vector3
}

// Helper functions to create components with default values
export const createHealthComponent = (max = 100): HealthComponent => ({
  type: 'health',
  current: max,
  maximum: max,
  regeneration: 1
})

export const createCombatStatsComponent = (overrides: Partial<Omit<CombatStatsComponent, 'type'>> = {}): CombatStatsComponent => ({
  type: 'combatStats',
  damage: 10,
  attackSpeed: 1,
  attackRange: 1.5,
  accuracy: 0.9,
  criticalChance: 0.05,
  criticalMultiplier: 1.5,
  ...overrides
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
  position: position.clone(),
  rotation: rotation.clone(),
  scale: scale.clone()
})

export const createMeshComponent = (mesh: THREE.Mesh): MeshComponent => ({
  type: 'mesh',
  mesh,
  visible: true
})

export const createAIComponent = (aggroRange = 5, attackCooldown = 1): AIComponent => ({
  type: 'ai',
  state: 'idle',
  aggroRange,
  attackCooldown,
  lastAttackTime: 0
})

export const createMovementComponent = (speed = 2): MovementComponent => ({
  type: 'movement',
  velocity: new THREE.Vector3(0, 0, 0),
  speed,
  isMoving: false
})
