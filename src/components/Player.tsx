import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../stores/gameStore'
import * as THREE from 'three'

export default function Player() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  // Get player state and actions from store
  const { player, setPlayerPosition, setPlayerRotation, stopPlayerMovement } = useGameStore()
  
  // Movement calculation constants
  const MOVEMENT_THRESHOLD = 0.1 // Stop moving when this close to target
  const ROTATION_SPEED = 8 // Rotation interpolation speed

  // Initialize player position on mesh
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.copy(player.position)
      meshRef.current.rotation.y = player.rotationY
    }
  }, [player.position, player.rotationY])

  // Handle movement and rotation every frame
  useFrame((state, delta) => {
    if (!meshRef.current) return

    const mesh = meshRef.current
    const currentPos = mesh.position
    
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
