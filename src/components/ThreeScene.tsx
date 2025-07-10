import { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Box, Sphere, Plane } from '@react-three/drei';
import * as THREE from 'three';

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
    } else if (meshRef.current) {
      // Return to original position
      meshRef.current.position.set(...sprite.position);
      meshRef.current.rotation.set(...sprite.rotation);
    }
  });

  const handleClick = () => {
    if (meshRef.current) {
      // Add click animation
      meshRef.current.scale.setScalar(sprite.scale * 1.2);
      setTimeout(() => {
        if (meshRef.current) {
          meshRef.current.scale.setScalar(sprite.scale);
        }
      }, 200);
    }
  };

  if (!sprite.visible) return null;

  return (
    <group>
      {sprite.shape === 'box' && (
        <Box
          ref={meshRef}
          position={sprite.position}
          rotation={sprite.rotation}
          scale={sprite.scale}
          onClick={handleClick}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <meshStandardMaterial 
            color={hovered ? '#ffaa00' : sprite.color} 
            transparent 
            opacity={0.8}
          />
        </Box>
      )}
      
      {sprite.shape === 'sphere' && (
        <Sphere
          ref={meshRef}
          position={sprite.position}
          rotation={sprite.rotation}
          scale={sprite.scale}
          onClick={handleClick}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <meshStandardMaterial 
            color={hovered ? '#ffaa00' : sprite.color} 
            transparent 
            opacity={0.8}
          />
        </Sphere>
      )}
      
      {sprite.shape === 'text' && sprite.text && (
        <Text
          ref={meshRef as any}
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
      <Plane args={[20, 20]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <meshBasicMaterial color="#1a1a1a" transparent opacity={0.3} />
      </Plane>
    </group>
  );
};

const ThreeScene = ({ sprites, isRunning, onSpriteClick }: ThreeSceneProps) => {
  return (
    <div className="w-full h-full bg-gradient-to-b from-gray-900 to-gray-700 relative">
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