// Projectile System for spells and ranged attacks
import { System, Entity } from './ECS'
import type { 
  TransformComponent, 
  HealthComponent,
  FactionComponent 
} from './CombatComponents'
import type { Component } from './ECS'
import * as THREE from 'three'

// Projectile-specific component
export interface ProjectileComponent extends Component {
  type: 'projectile'
  damage: number
  speed: number
  maxRange: number
  travelDistance: number
  casterFaction: string
  targetPosition: THREE.Vector3
  onHitEffect?: 'none' | 'explosion' | 'pierce'
  effectRadius?: number
}

// Spell effect component
export interface SpellEffectComponent extends Component {
  type: 'spellEffect'
  effectType: 'fireball' | 'iceShard' | 'lightning' | 'heal'
  duration: number
  startTime: number
  targetPosition: THREE.Vector3
  casterEntityId: string
}

// Create projectile component
export const createProjectileComponent = (
  damage: number,
  speed: number,
  targetPosition: THREE.Vector3,
  casterFaction: string,
  maxRange = 15,
  onHitEffect: 'none' | 'explosion' | 'pierce' = 'none',
  effectRadius = 0
): ProjectileComponent => ({
  type: 'projectile',
  damage,
  speed,
  maxRange,
  travelDistance: 0,
  casterFaction,
  targetPosition: targetPosition.clone(),
  onHitEffect,
  effectRadius
})

// Create spell effect component
export const createSpellEffectComponent = (
  effectType: 'fireball' | 'iceShard' | 'lightning' | 'heal',
  targetPosition: THREE.Vector3,
  casterEntityId: string,
  duration = 2.0
): SpellEffectComponent => ({
  type: 'spellEffect',
  effectType,
  duration,
  startTime: Date.now() / 1000,
  targetPosition: targetPosition.clone(),
  casterEntityId
})

export class ProjectileSystem extends System {
  update(entities: Entity[], deltaTime: number): void {
    // Process all projectiles
    const projectiles = entities.filter(entity => 
      entity.hasComponent('projectile') && 
      entity.hasComponent('transform')
    )

    projectiles.forEach(projectile => {
      this.updateProjectile(projectile, entities, deltaTime)
    })

    // Process spell effects
    const spellEffects = entities.filter(entity => entity.hasComponent('spellEffect'))
    spellEffects.forEach(effect => {
      this.updateSpellEffect(effect, entities, deltaTime)
    })
  }

  private updateProjectile(projectile: Entity, allEntities: Entity[], deltaTime: number) {
    const projectileComp = projectile.getComponent<ProjectileComponent>('projectile')!
    const transform = projectile.getComponent<TransformComponent>('transform')!

    // Calculate movement direction
    const direction = projectileComp.targetPosition.clone()
      .sub(transform.position)
      .normalize()

    // Move projectile
    const moveDistance = projectileComp.speed * deltaTime
    const newPosition = transform.position.clone().add(direction.multiplyScalar(moveDistance))
    
    // Update position
    transform.position.copy(newPosition)
    projectileComp.travelDistance += moveDistance

    // Check for collisions with entities
    const hitEntity = this.checkCollisions(projectile, allEntities)
    if (hitEntity) {
      this.handleProjectileHit(projectile, hitEntity, allEntities)
      return
    }

    // Check if reached target or max range
    const distanceToTarget = transform.position.distanceTo(projectileComp.targetPosition)
    if (distanceToTarget < 0.5 || projectileComp.travelDistance >= projectileComp.maxRange) {
      this.handleProjectileExpiry(projectile, allEntities)
    }
  }

  private checkCollisions(projectile: Entity, allEntities: Entity[]): Entity | null {
    const projectileComp = projectile.getComponent<ProjectileComponent>('projectile')!
    const projectileTransform = projectile.getComponent<TransformComponent>('transform')!

    // Check collision with all entities
    for (const entity of allEntities) {
      if (entity.id === projectile.id) continue // Don't hit self

      const entityTransform = entity.getComponent<TransformComponent>('transform')
      const entityHealth = entity.getComponent<HealthComponent>('health')
      const entityFaction = entity.getComponent<FactionComponent>('faction')

      if (!entityTransform || !entityHealth || !entityFaction) continue
      if (entityHealth.current <= 0) continue // Skip dead entities

      // Don't hit allies
      if (entityFaction.faction === projectileComp.casterFaction) continue

      // Check distance for collision
      const distance = projectileTransform.position.distanceTo(entityTransform.position)
      if (distance < 0.8) { // Collision radius
        return entity
      }
    }

    return null
  }

  private handleProjectileHit(projectile: Entity, target: Entity, allEntities: Entity[]) {
    const projectileComp = projectile.getComponent<ProjectileComponent>('projectile')!
    const targetHealth = target.getComponent<HealthComponent>('health')!
    const projectileTransform = projectile.getComponent<TransformComponent>('transform')!

    // Apply damage
    targetHealth.current -= projectileComp.damage
    console.log(`Projectile hit ${target.id} for ${projectileComp.damage} damage!`)

    // Handle special effects
    if (projectileComp.onHitEffect === 'explosion' && projectileComp.effectRadius) {
      this.handleExplosion(projectileTransform.position, projectileComp, allEntities)
    }

    // Remove projectile unless it pierces
    if (projectileComp.onHitEffect !== 'pierce') {
      this.removeProjectile(projectile, allEntities)
    }
  }

  private handleExplosion(position: THREE.Vector3, projectileComp: ProjectileComponent, allEntities: Entity[]) {
    console.log(`Explosion at ${position.x.toFixed(1)}, ${position.z.toFixed(1)}!`)
    
    // Find all entities in explosion radius
    allEntities.forEach(entity => {
      const entityTransform = entity.getComponent<TransformComponent>('transform')
      const entityHealth = entity.getComponent<HealthComponent>('health')
      const entityFaction = entity.getComponent<FactionComponent>('faction')

      if (!entityTransform || !entityHealth || !entityFaction) return
      if (entityHealth.current <= 0) return
      if (entityFaction.faction === projectileComp.casterFaction) return

      const distance = entityTransform.position.distanceTo(position)
      if (distance <= projectileComp.effectRadius!) {
        // Damage falls off with distance
        const damageMultiplier = 1.0 - (distance / projectileComp.effectRadius!)
        const explosionDamage = Math.floor(projectileComp.damage * 0.7 * damageMultiplier)
        
        entityHealth.current -= explosionDamage
        console.log(`Explosion damage: ${explosionDamage} to ${entity.id}`)
      }
    })
  }

  private handleProjectileExpiry(projectile: Entity, allEntities: Entity[]) {
    this.removeProjectile(projectile, allEntities)
  }

  private removeProjectile(projectile: Entity, _allEntities: Entity[]) {
    // Find the ECS world and remove the projectile
    // This is a bit hacky but works for our current setup
    projectile.destroy()
    console.log(`Projectile ${projectile.id} removed`)
  }

  private updateSpellEffect(effect: Entity, _allEntities: Entity[], _deltaTime: number) {
    const spellEffect = effect.getComponent<SpellEffectComponent>('spellEffect')!
    const currentTime = Date.now() / 1000

    // Check if effect has expired
    if (currentTime - spellEffect.startTime >= spellEffect.duration) {
      effect.destroy()
      console.log(`Spell effect ${spellEffect.effectType} expired`)
    }
  }
}
