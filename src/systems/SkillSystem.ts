// Skill System for casting spells and abilities
import { System, Entity } from './ECS'
import type { 
  TransformComponent,
  CombatStatsComponent,
  FactionComponent
} from './CombatComponents'
import { 
  createProjectileComponent
} from './ProjectileSystem'
import {
  createTransformComponent
} from './CombatComponents'
import * as THREE from 'three'

export interface SkillDefinition {
  id: string
  name: string
  type: 'projectile' | 'area' | 'self' | 'target'
  manaCost: number
  cooldown: number
  damage: number
  range: number
  effectRadius?: number
  projectileSpeed?: number
  projectileType?: 'fireball' | 'iceShard' | 'lightning'
}

// Predefined skills
export const SKILLS: Record<string, SkillDefinition> = {
  fireball: {
    id: 'fireball',
    name: 'Fireball',
    type: 'projectile',
    manaCost: 20,
    cooldown: 2.0,
    damage: 35,
    range: 15,
    effectRadius: 3,
    projectileSpeed: 8,
    projectileType: 'fireball'
  },
  iceShard: {
    id: 'iceShard',
    name: 'Ice Shard',
    type: 'projectile',
    manaCost: 15,
    cooldown: 1.5,
    damage: 25,
    range: 12,
    projectileSpeed: 12,
    projectileType: 'iceShard'
  },
  lightning: {
    id: 'lightning',
    name: 'Lightning Bolt',
    type: 'projectile',
    manaCost: 25,
    cooldown: 1.0,
    damage: 40,
    range: 20,
    projectileSpeed: 20,
    projectileType: 'lightning'
  },
  heal: {
    id: 'heal',
    name: 'Heal',
    type: 'self',
    manaCost: 30,
    cooldown: 3.0,
    damage: -50, // Negative damage = healing
    range: 0
  }
}

export interface SkillCooldown {
  skillId: string
  lastUsedTime: number
}

export class SkillSystem extends System {
  private skillCooldowns = new Map<string, SkillCooldown[]>() // EntityId -> Cooldowns
  public ecsWorld: any // Will be set by the component

  setECSWorld(world: any) {
    this.ecsWorld = world
  }

  // Cast a skill from caster to target position
  castSkill(casterId: string, skillId: string, targetPosition: THREE.Vector3, entities: Entity[]): boolean {
    const skill = SKILLS[skillId]
    if (!skill) {
      console.log(`Unknown skill: ${skillId}`)
      return false
    }

    const caster = entities.find(e => e.id === casterId)
    if (!caster) {
      console.log(`Caster not found: ${casterId}`)
      return false
    }

    // Check cooldown
    if (!this.isSkillReady(casterId, skillId)) {
      console.log(`Skill ${skill.name} on cooldown`)
      return false
    }

    const casterTransform = caster.getComponent<TransformComponent>('transform')
    const casterStats = caster.getComponent<CombatStatsComponent>('combatStats')
    const casterFaction = caster.getComponent<FactionComponent>('faction')

    if (!casterTransform || !casterStats || !casterFaction) {
      console.log(`Caster missing required components`)
      return false
    }

    // Check range
    const distance = casterTransform.position.distanceTo(targetPosition)
    if (distance > skill.range) {
      console.log(`Target out of range: ${distance.toFixed(1)} > ${skill.range}`)
      return false
    }

    // TODO: Check mana cost when we implement mana system

    // Cast the skill
    console.log(`${caster.id} casts ${skill.name}!`)
    this.executeSkill(caster, skill, targetPosition, entities)

    // Set cooldown
    this.setSkillCooldown(casterId, skillId)

    return true
  }

  private executeSkill(caster: Entity, skill: SkillDefinition, targetPosition: THREE.Vector3, entities: Entity[]) {
    const casterTransform = caster.getComponent<TransformComponent>('transform')!
    const casterFaction = caster.getComponent<FactionComponent>('faction')!

    switch (skill.type) {
      case 'projectile':
        this.createProjectile(caster, skill, targetPosition, casterFaction.faction)
        break

      case 'area':
        this.createAreaEffect(skill, targetPosition, casterFaction.faction, entities)
        break

      case 'self':
        this.applySelfEffect(caster, skill)
        break

      case 'target':
        // Find target entity at position
        const target = this.findEntityAtPosition(targetPosition, entities)
        if (target) {
          this.applyTargetEffect(target, skill)
        }
        break
    }
  }

  private createProjectile(caster: Entity, skill: SkillDefinition, targetPosition: THREE.Vector3, casterFaction: string) {
    if (!this.ecsWorld) {
      console.log('ECS World not set for SkillSystem')
      return
    }

    const casterTransform = caster.getComponent<TransformComponent>('transform')!

    // Create projectile entity
    const projectile = this.ecsWorld.createEntity(`projectile_${skill.id}_${Date.now()}`)

    // Add transform component (starting at caster position)
    const startPosition = casterTransform.position.clone()
    startPosition.y += 0.5 // Slightly above ground
    projectile.addComponent(createTransformComponent(startPosition))

    // Add projectile component
    const projectileComp = createProjectileComponent(
      skill.damage,
      skill.projectileSpeed || 10,
      targetPosition,
      casterFaction,
      skill.range,
      skill.effectRadius ? 'explosion' : 'none',
      skill.effectRadius
    )
    projectile.addComponent(projectileComp)

    console.log(`Created ${skill.projectileType} projectile`)
  }

  private createAreaEffect(skill: SkillDefinition, targetPosition: THREE.Vector3, casterFaction: string, entities: Entity[]) {
    console.log(`Area effect ${skill.name} at position`)
    
    // Apply damage to all entities in radius
    entities.forEach(entity => {
      const entityTransform = entity.getComponent<TransformComponent>('transform')
      const entityFaction = entity.getComponent<FactionComponent>('faction')
      
      if (!entityTransform || !entityFaction) return
      if (entityFaction.faction === casterFaction) return // Don't hit allies

      const distance = entityTransform.position.distanceTo(targetPosition)
      if (distance <= (skill.effectRadius || 2)) {
        // Apply damage with falloff
        const damageMultiplier = 1.0 - (distance / (skill.effectRadius || 2))
        const damage = Math.floor(skill.damage * damageMultiplier)
        
        const entityHealth = entity.getComponent('health') as any
        if (entityHealth) {
          entityHealth.current -= damage
          console.log(`Area damage: ${damage} to ${entity.id}`)
        }
      }
    })
  }

  private applySelfEffect(caster: Entity, skill: SkillDefinition) {
    if (skill.id === 'heal') {
      const casterHealth = caster.getComponent('health') as any
      if (casterHealth) {
        const healAmount = Math.abs(skill.damage)
        casterHealth.current = Math.min(casterHealth.current + healAmount, casterHealth.maximum)
        console.log(`Healed ${caster.id} for ${healAmount} HP`)
      }
    }
  }

  private applyTargetEffect(target: Entity, skill: SkillDefinition) {
    const targetHealth = target.getComponent('health') as any
    if (targetHealth) {
      targetHealth.current -= skill.damage
      console.log(`Direct damage: ${skill.damage} to ${target.id}`)
    }
  }

  private findEntityAtPosition(position: THREE.Vector3, entities: Entity[]): Entity | null {
    for (const entity of entities) {
      const transform = entity.getComponent<TransformComponent>('transform')
      if (!transform) continue

      const distance = transform.position.distanceTo(position)
      if (distance < 1.0) {
        return entity
      }
    }
    return null
  }

  private isSkillReady(entityId: string, skillId: string): boolean {
    const cooldowns = this.skillCooldowns.get(entityId) || []
    const skillCooldown = cooldowns.find(cd => cd.skillId === skillId)
    
    if (!skillCooldown) return true

    const skill = SKILLS[skillId]
    const currentTime = Date.now() / 1000
    return (currentTime - skillCooldown.lastUsedTime) >= skill.cooldown
  }

  private setSkillCooldown(entityId: string, skillId: string) {
    let cooldowns = this.skillCooldowns.get(entityId) || []
    
    const existingIndex = cooldowns.findIndex(cd => cd.skillId === skillId)
    const newCooldown: SkillCooldown = {
      skillId,
      lastUsedTime: Date.now() / 1000
    }

    if (existingIndex >= 0) {
      cooldowns[existingIndex] = newCooldown
    } else {
      cooldowns.push(newCooldown)
    }

    this.skillCooldowns.set(entityId, cooldowns)
  }

  update(entities: Entity[], deltaTime: number): void {
    // Skill system doesn't need regular updates
    // Skills are cast on-demand via castSkill method
  }
}
