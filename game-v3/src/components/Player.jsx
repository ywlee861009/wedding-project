import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, useState, useEffect } from 'react'
import { useKeyboardControls } from '@react-three/drei'
import * as THREE from 'three'

export default function Player() {
  const group = useRef()
  // public/models/groom.glb 경로로 에셋 로드
  const { scene, animations } = useGLTF('./models/groom.glb')
  const [, getKeys] = useKeyboardControls()
  
  // 이동 속도 설정
  const SPEED = 5
  
  useFrame((state, delta) => {
    const { forward, backward, left, right } = getKeys()
    
    // 이동 벡터 계산
    const moveVector = new THREE.Vector3(0, 0, 0)
    if (forward) moveVector.z -= 1
    if (backward) moveVector.z += 1
    if (left) moveVector.x -= 1
    if (right) moveVector.x += 1
    
    if (moveVector.length() > 0) {
      moveVector.normalize()
      
      // 캐릭터 회전 (이동 방향 바라보기)
      const targetAngle = Math.atan2(moveVector.x, moveVector.z)
      group.current.rotation.y = THREE.MathUtils.lerp(
        group.current.rotation.y,
        targetAngle,
        0.15
      )
      
      // 위치 업데이트
      group.current.position.addScaledVector(moveVector, SPEED * delta)
    }
    
    // 카메라가 캐릭터를 따라가게 (필요시)
    // state.camera.position.lerp(new THREE.Vector3(group.current.position.x + 5, group.current.position.y + 5, group.current.position.z + 5), 0.1)
    // state.camera.lookAt(group.current.position)
  })

  return (
    <group ref={group} dispose={null}>
      <primitive object={scene} scale={0.5} castShadow />
    </group>
  )
}
