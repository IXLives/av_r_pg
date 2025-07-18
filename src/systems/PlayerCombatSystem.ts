// Target Selection and Combat System
import { System, Entity } from './ECS'
import type { 
  TransformComponent, 
  HealthComponent,
  CombatStatsComponent,
  FactionComponent,
  AIComponent
} from './CombatComponents'
import { SkillSystem } from './SkillSystem'
import * as THREE from 'three'

export interface TargetingState {
  selectedTarget: string | null
  attackCooldown: number
  lastAttackTime: number
}

export class PlayerCombatSystem extends System {
  private targetingState: TargetingState = {
    selectedTarget: null,
    attackCooldown: 1.0, // 1 second between attacks
    lastAttackTime: 0
  }

  private playerEntityId: string = 'player_entity'
  private skillSystem: SkillSystem | null = null
  private clearTargetCallback: ((targetId: string | null) => void) | null = null

  // Set skill system reference
  setSkillSystem(skillSystem: SkillSystem) {
    this.skillSystem = skillSystem
  }

  // Set callback to clear target in game store
  setClearTargetCallback(callback: (targetId: string | null) => void) {
    this.clearTargetCallback = callback
  }

  // Cast a skill at target position
  castSkill(skillId: string, targetPosition?: THREE.Vector3): boolean {
    if (!this.skillSystem) {
      console.log('Skill system not available')
      return false
    }

    // Check if player is alive before casting skills
    const playerEntity = this.skillSystem.ecsWorld?.getEntity(this.playerEntityId)
    if (playerEntity) {
      const playerHealth = playerEntity.getComponent('health') as HealthComponent
      if (playerHealth && playerHealth.current <= 0) {
        console.log('💀 Player is dead, cannot cast skills')
        return false
      }
    }

    // Use selected target position if no target specified
    let target = targetPosition
    if (!target && this.targetingState.selectedTarget) {
      // Find target entity position
      const targetEntity = this.skillSystem.ecsWorld?.getEntity(this.targetingState.selectedTarget)
      if (targetEntity) {
        const targetTransform = targetEntity.getComponent('transform') as TransformComponent
        if (targetTransform) {
          target = targetTransform.position
        }
      }
    }

    if (!target) {
      console.log('No target for skill')
      return false
    }

    return this.skillSystem.castSkill(this.playerEntityId, skillId, target, this.skillSystem.ecsWorld?.getAllEntities() || [])
  }

  // Quick skill casting methods
  castFireball(targetPosition?: THREE.Vector3): boolean {
    return this.castSkill('fireball', targetPosition)
  }

  castIceShard(targetPosition?: THREE.Vector3): boolean {
    return this.castSkill('iceShard', targetPosition)
  }

  castLightning(targetPosition?: THREE.Vector3): boolean {
    return this.castSkill('lightning', targetPosition)
  }

  castHeal(): boolean {
    return this.castSkill('heal')
  }

  // Set the current target
  setTarget(entityId: string | null) {
    this.targetingState.selectedTarget = entityId
    console.log(`🎯 PlayerCombatSystem: Target set to ${entityId}`)
  }

  // Get current target
  getCurrentTarget(): string | null {
    return this.targetingState.selectedTarget
  }

  // Attempt to attack current target
  tryAttack(): boolean {
    const currentTime = Date.now() / 1000
    if (currentTime - this.targetingState.lastAttackTime < this.targetingState.attackCooldown) {
      return false // Still on cooldown
    }

    if (!this.targetingState.selectedTarget) {
      return false // No target selected
    }

    this.targetingState.lastAttackTime = currentTime
    return true // Attack successful, will be processed in update
  }

  update(entities: Entity[], deltaTime: number): void {
    const playerEntity = entities.find(e => e.id === this.playerEntityId)
    if (!playerEntity) return

    const playerTransform = playerEntity.getComponent<TransformComponent>('transform')
    const playerCombatStats = playerEntity.getComponent<CombatStatsComponent>('combatStats')
    const playerFaction = playerEntity.getComponent<FactionComponent>('faction')
    const playerHealth = playerEntity.getComponent<HealthComponent>('health')
    
    if (!playerTransform || !playerCombatStats || !playerFaction || !playerHealth) return

    // Don't allow player to attack if dead
    if (playerHealth.current <= 0) {
      console.log('💀 Player is dead, cannot attack')
      return
    }

    // Process attack if one was initiated
    if (this.targetingState.selectedTarget) {
      console.log(`🔄 PlayerCombatSystem: Processing target ${this.targetingState.selectedTarget}`)
      const targetEntity = entities.find(e => e.id === this.targetingState.selectedTarget)
      
      if (!targetEntity) {
        // Target no longer exists, clear selection
        this.targetingState.selectedTarget = null
        if (this.clearTargetCallback) {
          this.clearTargetCallback(null)
        }
        return
      }

      const targetTransform = targetEntity.getComponent<TransformComponent>('transform')
      const targetHealth = targetEntity.getComponent<HealthComponent>('health')
      const targetFaction = targetEntity.getComponent<FactionComponent>('faction')

      if (!targetTransform || !targetHealth || !targetFaction) {
        this.targetingState.selectedTarget = null
        if (this.clearTargetCallback) {
          this.clearTargetCallback(null)
        }
        return
      }

      // Check if target is hostile
      const isHostile = playerFaction.hostile.includes(targetFaction.faction)
      if (!isHostile) {
        this.targetingState.selectedTarget = null
        if (this.clearTargetCallback) {
          this.clearTargetCallback(null)
        }
        return
      }

      // Check if target is in range (recalculate every frame)
      const distance = playerTransform.position.distanceTo(targetTransform.position)
      console.log(`📏 Distance to target: ${distance.toFixed(2)}, attack range: ${playerCombatStats.attackRange}`)
      
      if (distance > playerCombatStats.attackRange) {
        // Target out of range, but keep it selected - this allows for dynamic range checking
        console.log(`❌ Target out of range, moving closer may allow attack`)
        return // Don't attack, but keep trying
      }

      // Check if we should attack (based on last attack time and range)
      const currentTime = Date.now() / 1000
      const timeSinceLastAttack = currentTime - this.targetingState.lastAttackTime
      console.log(`⏰ Time since last attack: ${timeSinceLastAttack.toFixed(2)}, cooldown: ${this.targetingState.attackCooldown}`)
      
      if (timeSinceLastAttack >= this.targetingState.attackCooldown) {
        console.log(`⚔️ Player attacking target!`)
        this.performAttack(playerEntity, targetEntity)
        this.targetingState.lastAttackTime = currentTime
      } else {
        console.log(`⏳ Still on cooldown`)
      }
    }
  }

  private performAttack(attacker: Entity, target: Entity) {
    const attackerStats = attacker.getComponent<CombatStatsComponent>('combatStats')!
    const targetHealth = target.getComponent<HealthComponent>('health')!

    // Make target aggressive when attacked
    const targetAI = target.getComponent('ai') as AIComponent
    if (targetAI) {
      targetAI.state = 'chase'
      targetAI.target = this.playerEntityId
      console.log(`😡 Target ${target.id} becomes aggressive!`)
    }

    // Calculate damage
    let damage = attackerStats.damage

    // Apply accuracy check
    if (Math.random() > attackerStats.accuracy) {
      console.log('Attack missed!')
      return
    }

    // Check for critical hit
    const isCritical = Math.random() < attackerStats.criticalChance
    if (isCritical) {
      damage *= attackerStats.criticalMultiplier
      console.log(`Critical hit! ${damage} damage`)
    } else {
      console.log(`Hit for ${damage} damage`)
    }

    // Apply damage
    targetHealth.current -= damage
    console.log(`Target health: ${targetHealth.current}/${targetHealth.maximum}`)

    // Check if target is dead
    if (targetHealth.current <= 0) {
      console.log('Target defeated!')
      this.targetingState.selectedTarget = null
      if (this.clearTargetCallback) {
        this.clearTargetCallback(null)
      }
    }
  }

  // Check if target is valid for selection
  isValidTarget(entityId: string, entities: Entity[]): boolean {
    const playerEntity = entities.find(e => e.id === this.playerEntityId)
    const targetEntity = entities.find(e => e.id === entityId)
    
    if (!playerEntity || !targetEntity) return false

    const playerFaction = playerEntity.getComponent<FactionComponent>('faction')
    const targetFaction = targetEntity.getComponent<FactionComponent>('faction')
    const targetHealth = targetEntity.getComponent<HealthComponent>('health')

    if (!playerFaction || !targetFaction || !targetHealth) return false

    // Must be hostile and alive
    return playerFaction.hostile.includes(targetFaction.faction) && targetHealth.current > 0
  }
}
