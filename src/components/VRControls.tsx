import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useXR } from '@react-three/xr'
import { useGameStore } from '../stores/gameStore'
import * as THREE from 'three'

// VR Controller input handling for movement and cursor control
export default function VRControls() {
  const xr = useXR()
  const { player, movePlayerToTarget, stopPlayerMovement } = useGameStore()
  
  // Refs for movement state
  const isMovingWithStick = useRef(false)
  
  // Controller input constants
  const MOVEMENT_SPEED = 3.0 // Units per second
  const THUMBSTICK_DEADZONE = 0.2 // Ignore small thumbstick movements

  useFrame((_, delta) => {
    // Only process VR controls when in VR mode
    if (!xr.session) return

    // Access controllers through XR session
    const session = xr.session
    const inputSources = session.inputSources

    // Process each input source (controller)
    for (const inputSource of inputSources) {
      if (!inputSource.gamepad) continue

      const gamepad = inputSource.gamepad
      const axes = gamepad.axes
      const buttons = gamepad.buttons

      // Determine if this is left or right controller based on handedness
      const isLeftController = inputSource.handedness === 'left'
      const isRightController = inputSource.handedness === 'right'

      // LEFT CONTROLLER - Character Movement
      if (isLeftController && axes.length >= 2) {
        const x = axes[0] // Left thumbstick X
        const y = axes[1] // Left thumbstick Y
        
        // Apply deadzone
        const magnitude = Math.sqrt(x * x + y * y)
        
        if (magnitude > THUMBSTICK_DEADZONE) {
          // Normalize and apply movement
          const normalizedX = x / magnitude
          const normalizedY = -y / magnitude // Invert Y for forward/back
          
          // Calculate movement in world space
          const moveX = normalizedX * magnitude
          const moveZ = normalizedY * magnitude
          
          // Apply movement relative to current position
          const currentPos = player.position.clone()
          const targetPos = currentPos.clone().add(
            new THREE.Vector3(moveX, 0, moveZ).multiplyScalar(MOVEMENT_SPEED * delta)
          )
          
          // Constrain to playable area
          const maxDistance = 8
          const distanceFromCenter = targetPos.distanceTo(new THREE.Vector3(0, 0.5, 0))
          if (distanceFromCenter > maxDistance) {
            const direction = targetPos.clone().sub(new THREE.Vector3(0, 0.5, 0)).normalize()
            targetPos.copy(direction.multiplyScalar(maxDistance).add(new THREE.Vector3(0, 0.5, 0)))
          }
          
          // Move player directly
          movePlayerToTarget(targetPos)
          isMovingWithStick.current = true
        } else {
          // Stop movement when thumbstick is released
          if (isMovingWithStick.current) {
            stopPlayerMovement()
            isMovingWithStick.current = false
          }
        }
      }

      // RIGHT CONTROLLER - Actions and Future Cursor Control
      if (isRightController) {
        // Right thumbstick for future cursor movement
        if (axes.length >= 4) {
          const x = axes[2] // Right thumbstick X
          const y = axes[3] // Right thumbstick Y
          
          const magnitude = Math.sqrt(x * x + y * y)
          if (magnitude > THUMBSTICK_DEADZONE) {
            // Future: Move cursor/reticle around the scene
            console.log(`Right stick: X=${x.toFixed(2)}, Y=${y.toFixed(2)}`)
          }
        }
        
        // Button presses for actions
        if (buttons.length > 0) {
          // Trigger button for spell casting
          if (buttons[0]?.pressed) {
            console.log('Right trigger pressed - ready for spell casting!')
          }
          
          // Grip button for interactions
          if (buttons[1]?.pressed) {
            console.log('Right grip pressed - ready for interactions!')
          }
          
          // A button (if available)
          if (buttons[4]?.pressed) {
            console.log('A button pressed - ready for menu/inventory!')
          }
        }
      }
    }
  })

  // Render VR controller indicators when in VR
  return (
    <>
      {xr.session && (
        <group>
          {/* Visual feedback that VR controls are active */}
          <mesh position={[0, 3, 0]}>
            <boxGeometry args={[4, 0.5, 0.1]} />
            <meshBasicMaterial color="#00ff00" transparent opacity={0.8} />
          </mesh>
          
          {/* Instructions indicator */}
          <mesh position={[0, 2.5, 0]}>
            <boxGeometry args={[6, 0.3, 0.05]} />
            <meshBasicMaterial color="#4444ff" transparent opacity={0.7} />
          </mesh>
        </group>
      )}
    </>
  )
}
