import { Grid } from '@react-three/drei'

export default function Scene() {
  return (
    <>
      {/* 바이브를 살려주는 세련된 그리드 바닥 */}
      <Grid
        infiniteGrid
        fadeDistance={50}
        fadeStrength={5}
        sectionSize={3}
        sectionColor="#a2a2a2"
        sectionThickness={1}
        cellSize={1}
        cellColor="#6f6f6f"
        cellThickness={0.6}
      />
      
      {/* 바닥 충돌체 (보이지 않지만 나중에 물리엔진 추가 시 필요) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#f0f0f0" transparent opacity={0} />
      </mesh>
    </>
  )
}
