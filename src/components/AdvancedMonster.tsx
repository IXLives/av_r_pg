import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../stores/gameStore'
import {
  createHealthComponent,
  createCombatStatsComponent,
  createFactionComponent,
  createTransformComponent,
  createAIComponent,
  createMovementComponent,
  type TransformComponent,
  type HealthComponent
} from '../systems/CombatComponents'
import type { Entity } from '../systems/ECS'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'

interface AdvancedMonsterProps {
  position?: THREE.Vector3
  monsterType?: 'basic' | 'heavy' | 'fast' | 'boss'
}

export default function AdvancedMonster({ 
  position = new THREE.Vector3(0, 0.5, 0), 
  monsterType = 'basic' 
}: AdvancedMonsterProps) {
  const { ecsWorld, currentTarget, setCurrentTarget } = useGameStore()
  const meshRef = useRef<THREE.Mesh>(null)
  const entityRef = useRef<Entity | null>(null)
  const entityInitialized = useRef(false)

  // Generate unique entity ID
  const entityId = useRef('adv_monster_' + Math.random().toString(36).substr(2, 6)).current

  // Monster type configurations
  const getMonsterConfig = (type: string) => {
    switch (type) {
      case 'heavy':
        return {
          health: 150,
          damage: 30,
          speed: 1.0,
          scale: [1.5, 1.5, 1.5] as const,
          color: "#8B0000" // Dark red
        }
      case 'fast':
        return {
          health: 50,
          damage: 15,
          speed: 4.0,
          scale: [0.8, 0.8, 0.8] as const,
          color: "#FF4500" // Orange red
        }
      case 'boss':
        return {
          health: 300,
          damage: 50,
          speed: 2.0,
          scale: [2.0, 2.0, 2.0] as const,
          color: "#4B0000" // Very dark red
        }
      default: // basic
        return {
          health: 100,
          damage: 20,
          speed: 2.0,
          scale: [1, 1, 1] as const,
          color: "#CC0000" // Normal red
        }
    }
  }

  const config = getMonsterConfig(monsterType)

  // Handle click to target this monster
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    
    if (!entityRef.current) return

    // Set this monster as the target using the store
    setCurrentTarget(entityRef.current.id)
    console.log(`Targeted advanced monster: ${entityRef.current.id}`)
  }

  // Initialize monster entity and components
  useEffect(() => {
    if (entityInitialized.current) return
    
    const monster = ecsWorld.createEntity(entityId)
    entityRef.current = monster

    // Add components to the entity
    monster.addComponent(createTransformComponent(position, new THREE.Euler(0, 0, 0)))
    monster.addComponent(createHealthComponent(config.health))
    monster.addComponent(createCombatStatsComponent({ 
      damage: config.damage, 
      attackSpeed: 1.5 
    }))
    monster.addComponent(createFactionComponent('enemy'))
    monster.addComponent(createAIComponent(8.0, 2.0))
    monster.addComponent(createMovementComponent(config.speed))

    entityInitialized.current = true
  }, [ecsWorld, entityId, position, config.health, config.damage, config.speed]) // Include all dependencies

  // Update visual representation based on ECS components
  useFrame(() => {
    if (!meshRef.current || !entityRef.current) return

    const entity = entityRef.current
    const mesh = meshRef.current

    // Update mesh position from transform component
    const transform = entity.getComponent<TransformComponent>('transform')
    if (transform) {
      mesh.position.copy(transform.position)
      mesh.rotation.y = transform.rotation.y
    }

    // Update visual state based on health
    const healthComponent = entity.getComponent<HealthComponent>('health')
    if (healthComponent) {
      const healthPercent = healthComponent.current / healthComponent.maximum
      
      // Change color based on health
      if (healthPercent < 0.3) {
        const baseColor = new THREE.Color(config.color)
        const darkColor = baseColor.clone().multiplyScalar(0.5) // Darker when low health
        ;(mesh.material as THREE.MeshStandardMaterial).color.copy(darkColor)
      } else {
        ;(mesh.material as THREE.MeshStandardMaterial).color.set(config.color)
      }
    }
  })

  return (
    <group>
      {/* Monster Body */}
      <mesh
        ref={meshRef}
        position={position}
        onClick={handleClick}
        castShadow
        receiveShadow
        scale={config.scale}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          color={currentTarget === entityRef.current?.id ? "#ff8800" : config.color} 
          roughness={0.7}
        />
      </mesh>

      {/* Health Bar */}
      <group position={[position.x, position.y + (config.scale[1] * 0.8 + 0.5), position.z]}>
        {/* Background bar */}
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[1.5, 0.15]} />
          <meshBasicMaterial color="#330000" transparent opacity={0.8} />
        </mesh>
        
        {/* Health bar (will be updated via ECS) */}
        <mesh position={[-0.15, 0, 0.01]}>
          <planeGeometry args={[1.2, 0.1]} />
          <meshBasicMaterial color="#ff0000" transparent opacity={0.9} />
        </mesh>
      </group>

      {/* Monster type indicator (floating text) */}
      {monsterType !== 'basic' && (
        <group position={[position.x, position.y + (config.scale[1] * 0.8 + 1.0), position.z]}>
          <mesh>
            <planeGeometry args={[1, 0.2]} />
            <meshBasicMaterial 
              color={monsterType === 'boss' ? "#FFD700" : "#FFFFFF"} 
              transparent 
              opacity={0.8} 
            />
          </mesh>
        </group>
      )}
    </group>
  )
}
