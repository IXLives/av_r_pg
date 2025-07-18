// Basic Monster AI System
import { System, Entity } from './ECS'
import type { 
  AIComponent, 
  TransformComponent, 
  MovementComponent, 
  HealthComponent,
  FactionComponent,
  CombatStatsComponent
} from './CombatComponents'
import * as THREE from 'three'

export class MonsterAISystem extends System {
  private playerEntityId: string | null = null

  setPlayerEntity(entityId: string) {
    this.playerEntityId = entityId
  }

  update(entities: Entity[], deltaTime: number): void {
    // Find player entity
    const playerEntity = this.playerEntityId ? 
      entities.find(e => e.id === this.playerEntityId) : null
    
    if (!playerEntity) return

    const playerTransform = playerEntity.getComponent<TransformComponent>('transform')
    if (!playerTransform) return

    // Process all monsters (entities with AI component)
    const monsters = entities.filter(entity => 
      entity.hasComponent('ai') && 
      entity.hasComponent('transform') && 
      entity.hasComponent('health') &&
      entity.hasComponent('faction')
    )

    monsters.forEach(monster => {
      const ai = monster.getComponent<AIComponent>('ai')!
      const transform = monster.getComponent<TransformComponent>('transform')!
      const health = monster.getComponent<HealthComponent>('health')!
      const faction = monster.getComponent<FactionComponent>('faction')!

      // Skip if dead
      if (health.current <= 0) {
        ai.state = 'dead'
        return
      }

      // Check if player is hostile
      const isPlayerHostile = faction.hostile.includes('player')
      if (!isPlayerHostile) {
        console.log(`👑 Monster ${monster.id} is not hostile to player`)
        return
      }

      // Calculate distance to player
      const distanceToPlayer = transform.position.distanceTo(playerTransform.position)

      // State machine
      switch (ai.state) {
        case 'idle':
        case 'patrol':
          // Check if player is in aggro range
          if (distanceToPlayer <= ai.aggroRange) {
            ai.state = 'chase'
            ai.target = playerEntity.id
            ai.lastTargetPosition = playerTransform.position.clone()
          }
          break

        case 'chase': {
          // Update target position
          ai.lastTargetPosition = playerTransform.position.clone()
          
          // Reduced debug logging (only occasionally)
          if (Math.random() < 0.01) { // 1% chance to log
            console.log(`🏃 Monster ${monster.id} chasing player (distance: ${distanceToPlayer.toFixed(2)})`)
          }
          
          // Check if close enough to attack
          if (distanceToPlayer <= 1.5) { // Attack range
            ai.state = 'attack'
            console.log(`⚔️ Monster ${monster.id} entering attack state`)
          } else {
            // Move toward player
            this.moveTowardsTarget(monster, playerTransform.position, deltaTime)
          }
          
          // Lose aggro if too far
          if (distanceToPlayer > ai.aggroRange * 1.5) {
            ai.state = 'idle'
            ai.target = undefined
          }
          break
        }

        case 'attack': {
          // Attack cooldown check
          const currentTime = Date.now() / 1000
          if (currentTime - ai.lastAttackTime >= ai.attackCooldown) {
            this.performAttack(monster, playerEntity)
            ai.lastAttackTime = currentTime
          }

          // Move back to chase if player moves away
          if (distanceToPlayer > 2.0) {
            ai.state = 'chase'
          }
          break
        }

        case 'dead':
          // Dead monsters don't do anything
          break
      }
    })
  }

  private moveTowardsTarget(monster: Entity, targetPosition: THREE.Vector3, deltaTime: number) {
    const transform = monster.getComponent<TransformComponent>('transform')!
    const movement = monster.getComponent<MovementComponent>('movement')

    if (!movement) return

    // Calculate direction to target
    const direction = targetPosition.clone().sub(transform.position).normalize()
    
    // Move towards target
    const moveDistance = movement.speed * deltaTime
    const newPosition = transform.position.clone().add(direction.multiplyScalar(moveDistance))
    
    // Update position
    transform.position.copy(newPosition)
    movement.isMoving = true

    // Update rotation to face target
    const angle = Math.atan2(direction.x, direction.z)
    transform.rotation.y = angle
  }

  private performAttack(monster: Entity, target: Entity) {
    const monsterCombat = monster.getComponent<CombatStatsComponent>('combatStats')
    const targetHealth = target.getComponent<HealthComponent>('health')
    
    if (!monsterCombat || !targetHealth) return

    // Calculate damage
    const damage = monsterCombat.damage + Math.random() * 5 // Add some randomness
    const finalDamage = Math.max(1, Math.floor(damage)) // Minimum 1 damage
    
    // Apply damage
    targetHealth.current = Math.max(0, targetHealth.current - finalDamage)
    
    console.log(`🔥 Monster ${monster.id} attacks player for ${finalDamage} damage!`)
    console.log(`💗 Player health: ${targetHealth.current}/${targetHealth.maximum}`)
    
    // Check if player died
    if (targetHealth.current <= 0) {
      console.log('💀 Player has died!')
    }
  }
}
