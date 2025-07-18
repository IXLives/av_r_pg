import { useFrame } from '@react-three/fiber'
import { useXR } from '@react-three/xr'
import { useEffect } from 'react'
import { useGameStore } from '../stores/gameStore'
import Player from './Player'
import Monster from './Monster'
import AdvancedMonster from './AdvancedMonster'
import ClickToMove from './ClickToMove'
import VRControls from './VRControls'
import VRCursor from './VRCursor'
import KeyboardControls from './KeyboardControls'
import CameraFollow from './CameraFollow'
import * as THREE from 'three'

// Define monster positions outside component to prevent re-creation on every render
const MONSTER_POSITIONS = {
  monster1: new THREE.Vector3(5, 0.5, 5),
  monster2: new THREE.Vector3(-4, 0.5, 3),
  archer: new THREE.Vector3(-8, 0.5, 2),
  mage: new THREE.Vector3(6, 0.5, -3),
  tank: new THREE.Vector3(-2, 0.5, 8),
  assassin: new THREE.Vector3(8, 0.5, 5),
  grunt: new THREE.Vector3(-6, 0.5, -8),
}

// Define camera offset outside component to prevent re-creation
const CAMERA_OFFSET = new THREE.Vector3(0, 10, 10)

export default function XRScene() {
  const xr = useXR()
  const { updateECS, initializeSystems, systemManager } = useGameStore()

  // Initialize systems once
  useEffect(() => {
    initializeSystems()
    
    // Register player entity with AI system
    systemManager.setPlayerEntity('player_entity')
  }, [initializeSystems, systemManager])

  // Animation loop - runs every frame
  useFrame((_, delta) => {
    // Update ECS systems every frame
    updateECS(delta)
  })

  return (
    <>
      {/* CAMERA SYSTEM */}
      {/* ARPG-style camera that follows the player */}
      <CameraFollow 
        followPlayer={true}
        smoothing={3.0}
        offset={CAMERA_OFFSET}
        lookAtPlayer={false}
        cameraMode="isometric"
      />

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

      {/* MONSTERS */}
      {/* Basic cube enemy for testing combat system */}
      <Monster position={MONSTER_POSITIONS.monster1} health={50} aggroRange={4} />
      <Monster position={MONSTER_POSITIONS.monster2} health={30} aggroRange={3} />
      
      {/* ADVANCED MONSTERS */}
      {/* Different monster types with unique abilities */}
      <AdvancedMonster position={MONSTER_POSITIONS.archer} monsterType="fast" />
      <AdvancedMonster position={MONSTER_POSITIONS.mage} monsterType="basic" />
      <AdvancedMonster position={MONSTER_POSITIONS.tank} monsterType="heavy" />
      <AdvancedMonster position={MONSTER_POSITIONS.assassin} monsterType="fast" />
      <AdvancedMonster position={MONSTER_POSITIONS.grunt} monsterType="basic" />

      {/* CLICK-TO-MOVE SYSTEM */}
      {/* Invisible clickable floor for movement targeting */}
      <ClickToMove />

      {/* VR CONTROLLER SYSTEMS */}
      {/* VR controller input handling */}
      <VRControls />
      
      {/* VR cursor/reticle for right controller */}
      <VRCursor />

      {/* KEYBOARD CONTROLS */}
      {/* Desktop keyboard controls for testing */}
      <KeyboardControls />

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
