import { VRButton, XR, createXRStore } from '@react-three/xr'
import { Canvas } from '@react-three/fiber'
import XRScene from './components/XRScene'
import './App.css'

function App() {
  // Create XR store for managing VR session state
  const store = createXRStore()

  return (
    <>
      {/* VR Entry Button - Shows when WebXR is available */}
      <VRButton store={store} />
      
      {/* Main XR Canvas - handles both 2D preview and VR modes */}
      <Canvas
        style={{ width: '100vw', height: '100vh' }}
        camera={{
          position: [0, 10, 10], // Elevated position for isometric view
          fov: 50
        }}
      >
        {/* XR Provider enables WebXR functionality */}
        <XR store={store}>
          <XRScene />
        </XR>
      </Canvas>
    </>
  )
}

export default App
