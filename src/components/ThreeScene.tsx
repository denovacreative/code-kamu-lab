import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Simple floating cube component
const FloatingCube = ({ position, color }: { position: [number, number, number], color: string }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.5;
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

// Simplified Scene Component
const Scene = () => {
  return (
    <>
      {/* Basic Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      
      {/* Floating Cubes */}
      <FloatingCube position={[-2, 0, 0]} color="#4169E1" />
      <FloatingCube position={[2, 0, 0]} color="#9370DB" />
      <FloatingCube position={[0, 2, -1]} color="#FF6347" />
      <FloatingCube position={[-1, 1, 1]} color="#32CD32" />
      <FloatingCube position={[1, -1, 0]} color="#FFD700" />
    </>
  );
};

// Main ThreeScene Component
const ThreeScene = () => {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 3, 6], fov: 60 }}
        shadows
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Scene />
      </Canvas>
    </div>
  );
};

export default ThreeScene;