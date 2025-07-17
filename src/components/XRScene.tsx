import { useFrame } from '@react-three/fiber'
import { useXR } from '@react-three/xr'
import Player from './Player'
import ClickToMove from './ClickToMove'
import * as THREE from 'three'

export default function XRScene() {
  const xr = useXR()

  // Animation loop - runs every frame
  useFrame(() => {
    // Future: This is where we'll handle global scene updates
    // Player movement is now handled in the Player component
  })

  return (
    <>
      {/* LIGHTING SETUP */}
      {/* Ambient light provides base illumination for all objects */}
      <ambientLight intensity={0.4} />
      
      {/* Directional light acts like sunlight - good for isometric view */}
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      {/* CAMERA SETUP */}
      {/* Position camera for isometric/top-down view */}
      {/* Note: Camera position is also set in App.tsx Canvas props */}
      
      {/* ENVIRONMENT - FLOOR */}
      {/* Large floor plane that serves as the game world foundation */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]} // Rotate to be horizontal
        position={[0, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial 
          color="#2d4a2b" 
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ENVIRONMENT - GRID LINES (Optional visual aid) */}
      {/* Helps visualize the game space during development */}
      <gridHelper
        args={[20, 20, '#4a4a4a', '#4a4a4a']}
        position={[0, 0.01, 0]} // Slightly above floor to prevent z-fighting
      />

      {/* PLAYER CHARACTER */}
      {/* Enhanced player character with movement system */}
      <Player />

      {/* CLICK-TO-MOVE SYSTEM */}
      {/* Invisible clickable floor for movement targeting */}
      <ClickToMove />

      {/* VR-SPECIFIC ELEMENTS */}
      {/* Only show certain elements when in VR mode */}
      {xr.session && (
        <>
          {/* Future: VR controller representations will go here */}
          {/* Future: VR-specific UI elements */}
        </>
      )}

      {/* SCENE BOUNDS VISUALIZATION (Development aid) */}
      {/* Wireframe box to show the playable area boundaries */}
      <mesh position={[0, 2, 0]}>
        <boxGeometry args={[18, 4, 18]} />
        <meshBasicMaterial 
          color="#666666" 
          wireframe 
          transparent 
          opacity={0.1} 
        />
      </mesh>
    </>
  )
}
