import { useRef, useState } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { useGameStore } from '../stores/gameStore'
import * as THREE from 'three'

export default function ClickToMove() {
  const { movePlayerToTarget } = useGameStore()
  const floorRef = useRef<THREE.Mesh>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Calculate target position from event point
  const calculateTargetPosition = (point: THREE.Vector3) => {
    // Ensure the target is on the floor plane (y = 0)
    const targetPosition = new THREE.Vector3(
      point.x,
      0.5, // Player height above floor
      point.z
    )
    
    // Constrain movement to playable area (within 8 units from center)
    const maxDistance = 8
    if (targetPosition.distanceTo(new THREE.Vector3(0, 0.5, 0)) > maxDistance) {
      const direction = targetPosition.clone().sub(new THREE.Vector3(0, 0.5, 0)).normalize()
      targetPosition.copy(direction.multiplyScalar(maxDistance).add(new THREE.Vector3(0, 0.5, 0)))
    }
    
    return targetPosition
  }

  // Handle mouse down - start dragging
  const handleMouseDown = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    
    // Only respond to left mouse button
    if (event.nativeEvent.button !== 0) return
    
    if (!floorRef.current) return

    setIsDragging(true)
    
    // Calculate initial click position and move player there
    const targetPosition = calculateTargetPosition(event.point)
    movePlayerToTarget(targetPosition)
  }

  // Handle mouse move - continue dragging
  const handleMouseMove = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    
    // Only process if we're dragging
    if (!isDragging || !floorRef.current) return

    // Calculate drag position and move player there
    const targetPosition = calculateTargetPosition(event.point)
    movePlayerToTarget(targetPosition)
  }

  // Handle mouse up - stop dragging
  const handleMouseUp = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    setIsDragging(false)
  }

  // Handle click events on the floor (for single clicks when not dragging)
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    
    if (!floorRef.current) return

    // Calculate click position in 3D space
    const targetPosition = calculateTargetPosition(event.point)
    
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
        onPointerDown={handleMouseDown}
        onPointerMove={handleMouseMove}
        onPointerUp={handleMouseUp}
        visible={false} // Invisible but still clickable
      >
        <planeGeometry args={[20, 20]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </>
  )
}
