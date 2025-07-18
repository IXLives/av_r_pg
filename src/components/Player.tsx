import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../stores/gameStore'
import {
  createHealthComponent,
  createCombatStatsComponent,
  createFactionComponent,
  createTransformComponent,
  createMeshComponent,
  createMovementComponent
} from '../systems/CombatComponents'
import * as THREE from 'three'

export default function Player() {
  const meshRef = useRef<THREE.Mesh>(null)
  const entityInitialized = useRef(false)
  
  // Get player state and actions from store
  const { player, ecsWorld, setPlayerPosition, setPlayerRotation, stopPlayerMovement } = useGameStore()
  
  // Movement calculation constants
  const MOVEMENT_THRESHOLD = 0.1 // Stop moving when this close to target
  const ROTATION_SPEED = 8 // Rotation interpolation speed

  // Create player entity in ECS (only once)
  useEffect(() => {
    if (entityInitialized.current) return
    
    // Check if player entity already exists
    let playerEntity = ecsWorld.getEntity('player_entity')
    
    if (!playerEntity) {
      // Create player entity
      playerEntity = ecsWorld.createEntity('player_entity')
      
      // Add components
      playerEntity
        .addComponent(createHealthComponent(100)) // Player has 100 HP
        .addComponent(createCombatStatsComponent({ 
          damage: 25, 
          attackSpeed: 1.5, 
          attackRange: 5.0 // Increased from 2.0 for easier testing
        }))
        .addComponent(createFactionComponent('player'))
        .addComponent(createTransformComponent(player.position.clone()))
        .addComponent(createMovementComponent(player.moveSpeed))
      
      entityInitialized.current = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ecsWorld]) // Only depend on ecsWorld to prevent re-creation on position changes

  // Add mesh component when mesh is ready (only once)
  useEffect(() => {
    if (!meshRef.current || !entityInitialized.current) return
    
    const playerEntity = ecsWorld.getEntity('player_entity')
    if (playerEntity) {
      const meshComponent = createMeshComponent(meshRef.current)
      playerEntity.addComponent(meshComponent)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once

  // Handle movement and rotation every frame
  useFrame((state, delta) => {
    if (!meshRef.current) return

    const mesh = meshRef.current
    const currentPos = mesh.position
    
    // Initialize mesh position if needed (only once)
    if (!mesh.userData.initialized) {
      mesh.position.copy(player.position)
      mesh.rotation.y = player.rotationY
      mesh.userData.initialized = true
    }
    
    // Handle movement to target
    if (player.isMoving && player.targetPosition) {
      const target = player.targetPosition
      const direction = new THREE.Vector3().subVectors(target, currentPos)
      const distance = direction.length()
      
      // Check if we've reached the target
      if (distance < MOVEMENT_THRESHOLD) {
        // Snap to target and stop moving
        mesh.position.copy(target)
        setPlayerPosition(target)
        stopPlayerMovement()
      } else {
        // Continue moving toward target
        direction.normalize()
        const moveDistance = player.moveSpeed * delta
        
        // Calculate new position
        const newPosition = currentPos.clone().add(
          direction.multiplyScalar(Math.min(moveDistance, distance))
        )
        
        // Constrain to map boundaries
        const maxX = 9, maxZ = 9, minX = -9, minZ = -9
        newPosition.x = Math.max(minX, Math.min(maxX, newPosition.x))
        newPosition.z = Math.max(minZ, Math.min(maxZ, newPosition.z))
        newPosition.y = 0.5 // Keep player at proper height
        
        // Update mesh position
        mesh.position.copy(newPosition)
        setPlayerPosition(newPosition)
        
        // Rotate player to face movement direction
        if (direction.length() > 0) {
          const targetRotation = Math.atan2(direction.x, direction.z)
          
          // Smooth rotation interpolation
          const currentRotation = mesh.rotation.y
          let rotationDiff = targetRotation - currentRotation
          
          // Handle rotation wrap-around (shortest path)
          if (rotationDiff > Math.PI) rotationDiff -= 2 * Math.PI
          if (rotationDiff < -Math.PI) rotationDiff += 2 * Math.PI
          
          const newRotation = currentRotation + rotationDiff * ROTATION_SPEED * delta
          mesh.rotation.y = newRotation
          setPlayerRotation(newRotation)
        }
      }
    }
    
    // Add subtle idle animation when not moving
    if (!player.isMoving) {
      const time = state.clock.getElapsedTime()
      mesh.position.y = player.position.y + Math.sin(time * 2) * 0.02 // Gentle bobbing
    }
  })

  return (
    <group>
      {/* Main Player Character */}
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
      >
        {/* Character body - slightly taller rectangle */}
        <boxGeometry args={[0.8, 1.2, 0.6]} />
        <meshStandardMaterial color="#ff6b6b" />
        
        {/* Character "head" - smaller cube on top */}
        <mesh position={[0, 0.8, 0]} castShadow>
          <boxGeometry args={[0.4, 0.4, 0.4]} />
          <meshStandardMaterial color="#ff8888" />
        </mesh>
        
        {/* Direction indicator - shows facing direction */}
        <mesh position={[0, 0.2, 0.4]} castShadow>
          <boxGeometry args={[0.2, 0.2, 0.1]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </mesh>
      
      {/* Movement target indicator */}
      {player.targetPosition && player.isMoving && (
        <mesh position={[player.targetPosition.x, 0.05, player.targetPosition.z]}>
          <ringGeometry args={[0.3, 0.5, 16]} />
          <meshBasicMaterial 
            color="#00ff00" 
            transparent 
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  )
}
