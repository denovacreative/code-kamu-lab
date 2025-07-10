import { useRef, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import ErrorBoundary from './ErrorBoundary';

interface Sprite3D {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  color: string;
  shape: 'box' | 'sphere' | 'text';
  text?: string;
  visible: boolean;
}

interface ThreeSceneProps {
  sprites: Sprite3D[];
  isRunning: boolean;
  onSpriteClick?: (spriteId: string) => void;
}

const AnimatedSprite = ({ sprite, isRunning }: { sprite: Sprite3D; isRunning: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current && isRunning) {
      // Gentle floating animation when running
      meshRef.current.position.y = sprite.position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      meshRef.current.rotation.y += 0.01;
    }
  });

  const handleClick = () => {
    console.log('Sprite clicked:', sprite.id);
  };

  if (!sprite.visible) return null;

  return (
    <group>
      {sprite.shape === 'box' && (
        <mesh
          ref={meshRef}
          position={sprite.position}
          rotation={sprite.rotation}
          scale={sprite.scale}
          onClick={handleClick}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial 
            color={hovered ? '#ffaa00' : sprite.color} 
            transparent 
            opacity={0.8}
          />
        </mesh>
      )}
      
      {sprite.shape === 'sphere' && (
        <mesh
          ref={meshRef}
          position={sprite.position}
          rotation={sprite.rotation}
          scale={sprite.scale}
          onClick={handleClick}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial 
            color={hovered ? '#ffaa00' : sprite.color} 
            transparent 
            opacity={0.8}
          />
        </mesh>
      )}
      
      {sprite.shape === 'text' && sprite.text && (
        <Text
          position={sprite.position}
          rotation={sprite.rotation}
          scale={sprite.scale}
          color={sprite.color}
          fontSize={1}
          onClick={handleClick}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          {sprite.text}
        </Text>
      )}
    </group>
  );
};

const GridHelper = () => {
  return (
    <group>
      <gridHelper args={[20, 20, '#444444', '#222222']} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshBasicMaterial color="#1a1a1a" transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

const ThreeScene = ({ sprites, isRunning, onSpriteClick }: ThreeSceneProps) => {
  return (
    <div className="w-full h-full bg-gradient-to-b from-gray-900 to-gray-700 relative">
      <ErrorBoundary fallback={
        <div className="w-full h-full flex items-center justify-center text-white bg-gray-800">
          <div className="text-center">
            <div className="text-4xl mb-4">🎮</div>
            <p className="text-lg mb-2">3D Scene Error</p>
            <p className="text-sm text-gray-300">The 3D visualization is temporarily unavailable</p>
          </div>
        </div>
      }>
        <Suspense fallback={
          <div className="w-full h-full flex items-center justify-center text-white">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p>Loading 3D Scene...</p>
            </div>
          </div>
        }>
          <Canvas
            camera={{ position: [5, 5, 5], fov: 75 }}
            className="w-full h-full"
            gl={{ antialias: true }}
            onCreated={({ gl }) => {
              gl.setSize(window.innerWidth, window.innerHeight);
            }}
          >
            {/* Lighting */}
            <ambientLight intensity={0.6} />
            <directionalLight 
              position={[10, 10, 5]} 
              intensity={1}
              castShadow
            />
            <pointLight position={[-10, -10, -10]} intensity={0.3} />

            {/* Scene Elements */}
            <GridHelper />
            
            {/* Sprites */}
            {sprites.map((sprite) => (
              <AnimatedSprite 
                key={sprite.id} 
                sprite={sprite} 
                isRunning={isRunning}
              />
            ))}

            {/* Controls */}
            <OrbitControls 
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={3}
              maxDistance={20}
            />

            {/* Background */}
            <color attach="background" args={['#0a0a0a']} />
          </Canvas>
        </Suspense>
      </ErrorBoundary>
      
      {/* UI Overlay */}
      <div className="absolute top-4 left-4 text-white text-sm bg-black/50 p-2 rounded">
        <p>🖱️ Click & drag to rotate</p>
        <p>🔍 Scroll to zoom</p>
        <p>✨ Click sprites to interact</p>
      </div>
      
      {isRunning && (
        <div className="absolute top-4 right-4 text-white text-sm bg-green-600/80 p-2 rounded">
          🚀 Running Script...
        </div>
      )}
    </div>
  );
};

export default ThreeScene;