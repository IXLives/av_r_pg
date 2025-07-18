// Camera Follow System for ARPG-style camera behavior
import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useXR } from '@react-three/xr'
import { useGameStore } from '../stores/gameStore'
import * as THREE from 'three'

interface CameraFollowProps {
  followPlayer?: boolean
  smoothing?: number
  offset?: THREE.Vector3
  lookAtPlayer?: boolean
  cameraMode?: 'isometric' | 'follow' // New prop for camera behavior
}

export default function CameraFollow({ 
  followPlayer = true,
  smoothing = 2.0,
  offset = new THREE.Vector3(0, 10, 10),
  lookAtPlayer = true,
  cameraMode = 'isometric'
}: CameraFollowProps) {
  const { camera, scene } = useThree()
  const xr = useXR()
  const { player } = useGameStore()
  
  // Target position for smooth following
  const targetPosition = useRef(new THREE.Vector3())
  
  // VR comfort settings
  const vrCameraGroup = useRef<THREE.Group>()
  const lastPlayerPosition = useRef(new THREE.Vector3())
  const TELEPORT_THRESHOLD = 5 // Units before teleporting VR camera

  // Initialize camera group for VR
  useEffect(() => {
    const group = new THREE.Group()
    vrCameraGroup.current = group
    scene.add(group)
    
    return () => {
      if (vrCameraGroup.current) {
        scene.remove(vrCameraGroup.current)
      }
    }
  }, [scene])

  useFrame((_, delta) => {
    if (!followPlayer) return

    const isVRMode = xr.session !== null
    
    if (isVRMode) {
      // VR MODE: Handle camera following with comfort
      handleVRCameraFollow(delta)
    } else {
      // FLAT MODE: Traditional ARPG camera following
      handleFlatCameraFollow(delta)
    }
  })

  const handleFlatCameraFollow = (delta: number) => {
    // Calculate target camera position based on player position + offset
    targetPosition.current.copy(player.position).add(offset)
    
    // Smooth interpolation to target position
    camera.position.lerp(targetPosition.current, smoothing * delta)
    
    // For isometric ARPG camera, we want minimal rotation changes
    // Only update look-at when necessary to prevent auto-rotation
    if (lookAtPlayer && cameraMode === 'follow') {
      camera.lookAt(player.position)
    }
    // For isometric mode, we maintain the fixed angle from the offset
  }

  const handleVRCameraFollow = (delta: number) => {
    // In VR, we need to be very careful about moving the camera
    // as it can cause motion sickness
    
    const playerPosition = player.position.clone()
    const cameraWorldPosition = new THREE.Vector3()
    camera.getWorldPosition(cameraWorldPosition)
    
    // Check distance from player
    const distanceFromPlayer = cameraWorldPosition.distanceTo(playerPosition)
    
    if (distanceFromPlayer > TELEPORT_THRESHOLD) {
      // Player has moved too far, teleport camera smoothly
      const teleportTarget = playerPosition.clone().add(offset)
      
      if (vrCameraGroup.current) {
        // Smooth teleport by moving the camera group
        vrCameraGroup.current.position.lerp(teleportTarget, 3.0 * delta)
      }
      
      console.log(`VR Camera teleporting: distance ${distanceFromPlayer.toFixed(2)}`)
    }
    
    // Always update last known player position
    lastPlayerPosition.current.copy(playerPosition)
  }

  // Component doesn't render anything visible
  return null
}
