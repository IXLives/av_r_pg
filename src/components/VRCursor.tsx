import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useXR } from '@react-three/xr'
import { useGameStore } from '../stores/gameStore'
import * as THREE from 'three'

// VR Cursor/Reticle system for right controller targeting
export default function VRCursor() {
  const xr = useXR()
  const { movePlayerToTarget } = useGameStore()
  
  // Cursor state
  const [cursorPosition, setCursorPosition] = useState(new THREE.Vector3(0, 0, -5))
  const [isVisible, setIsVisible] = useState(false)
  const [isTargeting, setIsTargeting] = useState(false)
  
  // Refs
  const cursorRef = useRef<THREE.Mesh>(null)
  
  // Constants
  const CURSOR_SPEED = 8 // Cursor movement speed
  const THUMBSTICK_DEADZONE = 0.2

  useFrame((_, delta) => {
    if (!xr.session) {
      setIsVisible(false)
      return
    }

    const session = xr.session
    const inputSources = session.inputSources
    let rightControllerFound = false

    // Find right controller
    for (const inputSource of inputSources) {
      if (inputSource.handedness === 'right' && inputSource.gamepad) {
        rightControllerFound = true
        const gamepad = inputSource.gamepad
        const axes = gamepad.axes
        const buttons = gamepad.buttons

        // Right thumbstick controls cursor movement
        if (axes.length >= 4) {
          const x = axes[2] // Right thumbstick X
          const y = axes[3] // Right thumbstick Y
          
          const magnitude = Math.sqrt(x * x + y * y)
          if (magnitude > THUMBSTICK_DEADZONE) {
            // Move cursor based on thumbstick input
            const moveX = x * CURSOR_SPEED * delta
            const moveZ = -y * CURSOR_SPEED * delta // Invert Y
            
            setCursorPosition(prev => {
              const newPos = prev.clone()
              newPos.x += moveX
              newPos.z += moveZ
              
              // Keep cursor within bounds
              newPos.x = Math.max(-8, Math.min(8, newPos.x))
              newPos.z = Math.max(-8, Math.min(8, newPos.z))
              newPos.y = 0.1 // Keep cursor just above floor
              
              return newPos
            })
            setIsTargeting(true)
          } else {
            setIsTargeting(false)
          }
        }

        // Trigger to move player to cursor position
        if (buttons.length > 0 && buttons[0]?.pressed) {
          // Move player to cursor position
          const targetPos = cursorPosition.clone()
          targetPos.y = 0.5 // Player height
          movePlayerToTarget(targetPos)
        }

        // Update cursor position
        if (cursorRef.current) {
          cursorRef.current.position.copy(cursorPosition)
        }

        break
      }
    }

    setIsVisible(rightControllerFound)
  })

  if (!isVisible) return null

  return (
    <group>
      {/* Cursor/Reticle */}
      <mesh ref={cursorRef} position={cursorPosition}>
        {/* Main cursor ring */}
        <ringGeometry args={[0.1, 0.2, 16]} />
        <meshBasicMaterial 
          color={isTargeting ? "#ff4444" : "#44ff44"} 
          transparent 
          opacity={0.8}
          side={THREE.DoubleSide}
        />
        
        {/* Center dot */}
        <mesh>
          <sphereGeometry args={[0.02]} />
          <meshBasicMaterial 
            color={isTargeting ? "#ffffff" : "#88ff88"} 
          />
        </mesh>
        
        {/* Outer targeting ring (when actively targeting) */}
        {isTargeting && (
          <mesh rotation={[0, 0, 0]}>
            <ringGeometry args={[0.25, 0.3, 16]} />
            <meshBasicMaterial 
              color="#ff6666" 
              transparent 
              opacity={0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
      </mesh>

      {/* Floor intersection indicator */}
      <mesh position={[cursorPosition.x, 0.01, cursorPosition.z]}>
        <ringGeometry args={[0.3, 0.4, 16]} />
        <meshBasicMaterial 
          color={isTargeting ? "#ff8888" : "#88ff88"} 
          transparent 
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
