import { VRButton, XR } from '@react-three/xr'
import { Canvas } from '@react-three/fiber'
import XRScene from './components/XRScene'
import PlayerUI from './components/PlayerUI'
import './App.css'

function App() {
  return (
    <>
      {/* VR Entry Button - Shows when WebXR is available */}
      <VRButton />
      
      {/* Player UI Overlay */}
      <PlayerUI />
      
      {/* Main XR Canvas - handles both 2D preview and VR modes */}
      <Canvas
        style={{ width: '100vw', height: '100vh' }}
        camera={{
          position: [0, 10, 10], // Initial isometric position - will be controlled by CameraFollow
          fov: 60, // Slightly wider FOV for better ARPG view
          near: 0.1,
          far: 100
        }}
      >
        {/* XR Provider enables WebXR functionality */}
        <XR>
          <XRScene />
        </XR>
      </Canvas>
    </>
  )
}

export default App
