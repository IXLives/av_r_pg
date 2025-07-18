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
  createMeshComponent,
  type TransformComponent,
  type HealthComponent
} from '../systems/CombatComponents'
import type { Entity } from '../systems/ECS'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'

interface MonsterProps {
  position?: THREE.Vector3
  health?: number
  aggroRange?: number
}

export default function Monster({ 
  position = new THREE.Vector3(5, 0.5, 5), 
  health = 50,
  aggroRange = 4 
}: MonsterProps) {
  const { ecsWorld, currentTarget, setCurrentTarget } = useGameStore()
  const meshRef = useRef<THREE.Mesh>(null)
  const entityRef = useRef<Entity | null>(null)
  const entityInitialized = useRef(false)

  // Generate unique entity ID
  const entityId = useRef('monster_' + Math.random().toString(36).substr(2, 6)).current

  // Handle click to target this monster
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    
    if (!entityRef.current) return

    // Set this monster as the target using the store
    setCurrentTarget(entityRef.current.id)
    console.log(`Targeted monster: ${entityRef.current.id}`)
  }

  // Create monster entity in ECS (runs once)
  useEffect(() => {
    if (entityInitialized.current) return
    
    // Create monster entity
    const monster = ecsWorld.createEntity(entityId)
    entityRef.current = monster

    // Add components
    monster
      .addComponent(createHealthComponent(health))
      .addComponent(createCombatStatsComponent({ 
        damage: 15, 
        attackSpeed: 0.8, 
        attackRange: 1.5 
      }))
      .addComponent(createFactionComponent('enemy'))
      .addComponent(createTransformComponent(position.clone()))
      .addComponent(createAIComponent(aggroRange, 1.2)) // 1.2 second attack cooldown
      .addComponent(createMovementComponent(1.5)) // Slower than player

    entityInitialized.current = true
    console.log(`Monster entity ${entityId} created`)

    // Cleanup when component unmounts
    return () => {
      if (entityRef.current) {
        ecsWorld.removeEntity(entityRef.current.id)
        entityRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ecsWorld]) // Only depend on ecsWorld

  // Update mesh from ECS entity every frame
  useFrame(() => {
    if (!entityRef.current || !meshRef.current) return

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
        (mesh.material as THREE.MeshStandardMaterial).color.setHex(0x660000) // Dark red when low health
      } else {
        (mesh.material as THREE.MeshStandardMaterial).color.setHex(0xcc0000) // Normal red
      }

      // Add mesh component for combat system if not present
      if (!entity.hasComponent('mesh')) {
        entity.addComponent(createMeshComponent(mesh))
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
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          color={currentTarget === entityRef.current?.id ? "#ff8800" : "#cc0000"} 
          roughness={0.7}
        />
      </mesh>

      {/* Health Bar */}
      <group position={[position.x, position.y + 1.5, position.z]}>
        {/* Background bar */}
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[1.2, 0.1]} />
          <meshBasicMaterial color="#330000" transparent opacity={0.8} />
        </mesh>
        
        {/* Health bar (will be updated via ECS) */}
        <mesh position={[-0.1, 0, 0.001]}>
          <planeGeometry args={[1.0, 0.08]} />
          <meshBasicMaterial color="#cc0000" transparent opacity={0.9} />
        </mesh>
      </group>
    </group>
  )
}
