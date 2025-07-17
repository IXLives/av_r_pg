import { useRef } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { useGameStore } from '../stores/gameStore'
import * as THREE from 'three'

export default function ClickToMove() {
  const { movePlayerToTarget } = useGameStore()
  const floorRef = useRef<THREE.Mesh>(null)

  // Handle click events on the floor
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    
    if (!floorRef.current) return

    // Calculate click position in 3D space
    const intersectionPoint = event.point
    
    // Ensure the target is on the floor plane (y = 0)
    const targetPosition = new THREE.Vector3(
      intersectionPoint.x,
      0.5, // Player height above floor
      intersectionPoint.z
    )
    
    // Constrain movement to playable area (within 8 units from center)
    const maxDistance = 8
    if (targetPosition.distanceTo(new THREE.Vector3(0, 0.5, 0)) > maxDistance) {
      targetPosition.normalize().multiplyScalar(maxDistance)
      targetPosition.y = 0.5
    }
    
    // Tell the player to move to this position
    movePlayerToTarget(targetPosition)
  }

  return (
    <>
      {/* Invisible clickable floor plane */}
      <mesh
        ref={floorRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onClick={handleClick}
        visible={false} // Invisible but still clickable
      >
        <planeGeometry args={[20, 20]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </>
  )
}
