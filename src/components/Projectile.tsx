// Visual Projectile Component for React Three Fiber
import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../stores/gameStore'
import {
  createMeshComponent,
  type TransformComponent
} from '../systems/CombatComponents'
import type { ProjectileComponent as ProjectileComponentType } from '../systems/ProjectileSystem'
import * as THREE from 'three'

interface ProjectileProps {
  entityId: string
  projectileType: 'fireball' | 'iceShard' | 'lightning'
}

export default function Projectile({ entityId, projectileType }: ProjectileProps) {
  const { ecsWorld } = useGameStore()
  const meshRef = useRef<THREE.Mesh>(null)

  // Get projectile entity
  const projectileEntity = ecsWorld.getEntity(entityId)

  // Visual settings based on projectile type
  const getProjectileVisuals = (type: string) => {
    switch (type) {
      case 'fireball':
        return {
          color: '#ff4400',
          emissive: '#ff2200',
          size: 0.3,
          trail: true
        }
      case 'iceShard':
        return {
          color: '#44aaff',
          emissive: '#2288ff',
          size: 0.2,
          trail: false
        }
      case 'lightning':
        return {
          color: '#ffff44',
          emissive: '#ffff00',
          size: 0.15,
          trail: true
        }
      default:
        return {
          color: '#ffffff',
          emissive: '#888888',
          size: 0.2,
          trail: false
        }
    }
  }

  const visuals = getProjectileVisuals(projectileType)

  // Update mesh component when Three.js mesh is ready
  useEffect(() => {
    if (meshRef.current && projectileEntity) {
      const meshComponent = createMeshComponent(meshRef.current)
      projectileEntity.addComponent(meshComponent)
    }
  }, [projectileEntity])

  // Sync ECS transform with Three.js mesh
  useFrame(() => {
    if (!projectileEntity || !meshRef.current) return

    const transform = projectileEntity.getComponent<TransformComponent>('transform')
    const projectileComp = projectileEntity.getComponent<ProjectileComponentType>('projectile')
    
    if (transform) {
      // Update mesh position from ECS
      meshRef.current.position.copy(transform.position)
      
      // Rotate projectile to face movement direction
      if (projectileComp) {
        const direction = projectileComp.targetPosition.clone()
          .sub(transform.position)
          .normalize()
        
        const angle = Math.atan2(direction.x, direction.z)
        meshRef.current.rotation.y = angle
      }
    }
  })

  // Don't render if entity doesn't exist
  if (!projectileEntity) {
    return null
  }

  return (
    <group>
      {/* Main projectile mesh */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[visuals.size, 8, 8]} />
        <meshStandardMaterial 
          color={visuals.color}
          emissive={visuals.emissive}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Particle trail effect for certain projectiles */}
      {visuals.trail && (
        <mesh position={[0, 0, -0.5]}>
          <sphereGeometry args={[visuals.size * 0.7, 6, 6]} />
          <meshBasicMaterial 
            color={visuals.color}
            transparent
            opacity={0.4}
          />
        </mesh>
      )}

      {/* Glow effect */}
      <mesh>
        <sphereGeometry args={[visuals.size * 1.5, 8, 8]} />
        <meshBasicMaterial 
          color={visuals.emissive}
          transparent
          opacity={0.2}
        />
      </mesh>
    </group>
  )
}
