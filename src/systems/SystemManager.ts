// Centralized System Manager
// Manages all ECS systems to prevent duplicates and ensure proper initialization

import { ECSWorld, System } from './ECS'
import { MonsterAISystem } from './MonsterAISystem'
import { PlayerCombatSystem } from './PlayerCombatSystem'
import { SkillSystem } from './SkillSystem'
import { ProjectileSystem } from './ProjectileSystem'
import { CollisionSystem } from './CollisionSystem'

export class SystemManager {
  private static instance: SystemManager | null = null
  private ecsWorld: ECSWorld
  private systems: Map<string, System> = new Map()
  private initialized = false

  private constructor(ecsWorld: ECSWorld) {
    this.ecsWorld = ecsWorld
  }

  static getInstance(ecsWorld: ECSWorld): SystemManager {
    if (!SystemManager.instance) {
      SystemManager.instance = new SystemManager(ecsWorld)
    }
    return SystemManager.instance
  }

  // Initialize all core systems
  initializeSystems(): void {
    if (this.initialized) return

    console.log('Initializing ECS Systems...')

    // Initialize Monster AI System
    if (!this.systems.has('monsterAI')) {
      const monsterAI = new MonsterAISystem()
      this.systems.set('monsterAI', monsterAI)
      this.ecsWorld.addSystem(monsterAI)
      console.log('✓ Monster AI System initialized')
    }

    // Initialize Player Combat System
    if (!this.systems.has('playerCombat')) {
      const playerCombat = new PlayerCombatSystem()
      this.systems.set('playerCombat', playerCombat)
      this.ecsWorld.addSystem(playerCombat)
      console.log('✓ Player Combat System initialized')
    }

    // Initialize Skill System
    if (!this.systems.has('skills')) {
      const skills = new SkillSystem()
      this.systems.set('skills', skills)
      this.ecsWorld.addSystem(skills)
      console.log('✓ Skill System initialized')
    }

    // Initialize Projectile System
    if (!this.systems.has('projectiles')) {
      const projectiles = new ProjectileSystem()
      this.systems.set('projectiles', projectiles)
      this.ecsWorld.addSystem(projectiles)
      console.log('✓ Projectile System initialized')
    }

    // Initialize Collision System
    if (!this.systems.has('collision')) {
      const collision = new CollisionSystem()
      this.systems.set('collision', collision)
      this.ecsWorld.addSystem(collision)
      console.log('✓ Collision System initialized')
    }

    this.initialized = true
    console.log('All ECS Systems initialized successfully!')
  }

  // Get a specific system
  getSystem<T extends System>(systemName: string): T | null {
    return this.systems.get(systemName) as T || null
  }

  // Set player entity for systems that need it
  setPlayerEntity(entityId: string): void {
    const monsterAI = this.getSystem<MonsterAISystem>('monsterAI')
    if (monsterAI) {
      monsterAI.setPlayerEntity(entityId)
      console.log(`✓ Player entity ${entityId} registered with Monster AI`)
    }
  }

  // Reset systems (for cleanup)
  reset(): void {
    this.systems.clear()
    this.initialized = false
    SystemManager.instance = null
  }
}
