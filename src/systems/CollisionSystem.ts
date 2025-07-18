// Collision System - Prevents entities from overlapping
import { System, Entity } from './ECS'
import type { TransformComponent } from './CombatComponents'
import * as THREE from 'three'

export class CollisionSystem extends System {
  private readonly COLLISION_RADIUS = 0.5 // Base collision radius for entities
  private readonly SEPARATION_FORCE = 2.0 // How strong the separation force is

  update(entities: Entity[], deltaTime: number): void {
    // Get all entities with transform components
    const collidableEntities = entities.filter(entity => 
      entity.hasComponent('transform')
    )

    // Check collisions between all pairs of entities
    for (let i = 0; i < collidableEntities.length; i++) {
      for (let j = i + 1; j < collidableEntities.length; j++) {
        this.resolveCollision(collidableEntities[i], collidableEntities[j], deltaTime)
      }
    }
  }

  private resolveCollision(entityA: Entity, entityB: Entity, deltaTime: number) {
    const transformA = entityA.getComponent<TransformComponent>('transform')!
    const transformB = entityB.getComponent<TransformComponent>('transform')!

    // Calculate distance between entities
    const positionA = transformA.position
    const positionB = transformB.position
    const direction = new THREE.Vector3().subVectors(positionA, positionB)
    const distance = direction.length()

    // Check if collision is occurring
    const combinedRadius = this.COLLISION_RADIUS * 2
    if (distance < combinedRadius && distance > 0) {
      // Normalize direction
      direction.normalize()

      // Calculate overlap
      const overlap = combinedRadius - distance
      const separationDistance = overlap * 0.5

      // Apply separation force (push entities apart)
      const separationA = direction.clone().multiplyScalar(separationDistance)
      const separationB = direction.clone().multiplyScalar(-separationDistance)

      // Apply separation with some damping to prevent jittering
      const damping = this.SEPARATION_FORCE * deltaTime
      transformA.position.add(separationA.multiplyScalar(damping))
      transformB.position.add(separationB.multiplyScalar(damping))

      // Ensure entities stay within map bounds
      this.constrainToBounds(transformA)
      this.constrainToBounds(transformB)
    }
  }

  private constrainToBounds(transform: TransformComponent) {
    const maxX = 9
    const maxZ = 9
    const minX = -9
    const minZ = -9

    transform.position.x = Math.max(minX, Math.min(maxX, transform.position.x))
    transform.position.z = Math.max(minZ, Math.min(maxZ, transform.position.z))
    
    // Keep Y position stable
    transform.position.y = 0.5
  }
}
