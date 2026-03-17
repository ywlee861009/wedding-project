import { Canvas } from '@react-three/fiber'
import { KeyboardControls, OrbitControls, Sky, ContactShadows } from '@react-three/drei'
import { Suspense } from 'react'
import Scene from './components/Scene'
import Player from './components/Player'

// 키보드 조작 매핑
const keyboardMap = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'right', keys: ['ArrowRight', 'KeyD'] },
  { name: 'jump', keys: ['Space'] },
]

function App() {
  return (
    <KeyboardControls map={keyboardMap}>
      <Canvas shadows camera={{ position: [5, 5, 5], fov: 45 }}>
        <Suspense fallback={null}>
          <Sky sunPosition={[100, 20, 100]} />
          <ambientLight intensity={0.7} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1.5}
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
          
          <Scene />
          <Player />
          
          <ContactShadows 
            opacity={0.4} 
            scale={20} 
            blur={2.4} 
            far={4.5} 
          />
          <OrbitControls makeDefault />
        </Suspense>
      </Canvas>
      
      {/* UI 레이어 (나중에 추가 가능) */}
      <div style={{ position: 'absolute', bottom: 20, left: 20, color: '#333', fontFamily: 'sans-serif' }}>
        WASD 또는 화살표 키로 이동
      </div>
    </KeyboardControls>
  )
}

export default App
