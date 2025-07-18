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
    
    // Constrain movement to playable area (rectangular bounds)
    const maxX = 9  // Allow movement to edges of the 20x20 plane
    const maxZ = 9
    targetPosition.x = Math.max(-maxX, Math.min(maxX, targetPosition.x))
    targetPosition.z = Math.max(-maxZ, Math.min(maxZ, targetPosition.z))
    
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
