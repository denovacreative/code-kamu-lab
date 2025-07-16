import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Box, Sphere, Cylinder, Plane } from '@react-three/drei';
import * as THREE from 'three';

// Animated Laptop Component
const AnimatedLaptop = ({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) => {
  const laptopRef = useRef<THREE.Group>(null);
  const screenRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (laptopRef.current) {
      laptopRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      laptopRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
    if (screenRef.current) {
      // Simulate screen glow
      const intensity = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      (screenRef.current.material as THREE.MeshStandardMaterial).emissive.setScalar(intensity * 0.1);
    }
  });

  return (
    <group ref={laptopRef} position={position} rotation={rotation}>
      {/* Laptop Base */}
      <Box args={[1.2, 0.05, 0.8]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#2a2a2a" />
      </Box>
      
      {/* Laptop Screen */}
      <Box args={[1.15, 0.7, 0.02]} position={[0, 0.375, -0.38]} rotation={[-0.1, 0, 0]}>
        <meshStandardMaterial color="#1a1a1a" />
      </Box>
      
      {/* Screen Content */}
      <mesh ref={screenRef} position={[0, 0.375, -0.37]} rotation={[-0.1, 0, 0]}>
        <planeGeometry args={[1, 0.6]} />
        <meshStandardMaterial 
          color="#00ff41" 
          emissive="#002200"
          emissiveIntensity={0.3}
        />
      </mesh>
      
      {/* Code Text on Screen */}
      <Text
        position={[0, 0.375, -0.36]}
        rotation={[-0.1, 0, 0]}
        fontSize={0.03}
        color="#00ff41"
        anchorX="center"
        anchorY="middle"
      >
        {`function animate() {\n  console.log("Hello World!");\n  requestAnimationFrame(animate);\n}`}
      </Text>
    </group>
  );
};

// Animated Character Component
const AnimatedCharacter = ({ position, color }: { position: [number, number, number], color: string }) => {
  const characterRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (characterRef.current) {
      // Subtle breathing animation
      characterRef.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.02;
      // Slight head bob
      characterRef.current.children[0].rotation.x = Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  return (
    <group ref={characterRef} position={position}>
      {/* Head */}
      <Sphere args={[0.15]} position={[0, 0.6, 0]}>
        <meshStandardMaterial color={color} />
      </Sphere>
      
      {/* Body */}
      <Cylinder args={[0.1, 0.15, 0.4]} position={[0, 0.2, 0]}>
        <meshStandardMaterial color={color} />
      </Cylinder>
      
      {/* Arms */}
      <Cylinder args={[0.05, 0.05, 0.3]} position={[-0.2, 0.3, 0]} rotation={[0, 0, -0.3]}>
        <meshStandardMaterial color={color} />
      </Cylinder>
      <Cylinder args={[0.05, 0.05, 0.3]} position={[0.2, 0.3, 0]} rotation={[0, 0, 0.3]}>
        <meshStandardMaterial color={color} />
      </Cylinder>
      
      {/* Legs */}
      <Cylinder args={[0.05, 0.05, 0.3]} position={[-0.1, -0.15, 0]}>
        <meshStandardMaterial color={color} />
      </Cylinder>
      <Cylinder args={[0.05, 0.05, 0.3]} position={[0.1, -0.15, 0]}>
        <meshStandardMaterial color={color} />
      </Cylinder>
    </group>
  );
};

// Floating Code Blocks
const FloatingCodeBlock = ({ position, text, color }: { position: [number, number, number], text: string, color: string }) => {
  const blockRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (blockRef.current) {
      blockRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8 + position[0]) * 0.2;
      blockRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });

  return (
    <group ref={blockRef} position={position}>
      <Box args={[0.3, 0.2, 0.1]}>
        <meshStandardMaterial color={color} />
      </Box>
      <Text
        position={[0, 0, 0.06]}
        fontSize={0.04}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {text}
      </Text>
    </group>
  );
};

// Main Scene Component
const Scene = () => {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
      <pointLight position={[-5, 5, 0]} intensity={0.3} color="#4169E1" />
      <pointLight position={[5, 5, 0]} intensity={0.3} color="#9370DB" />

      {/* Background Plane */}
      <Plane args={[20, 20]} position={[0, 0, -8]} rotation={[0, 0, 0]}>
        <meshStandardMaterial 
          color="#0a0a0a" 
          transparent 
          opacity={0.1}
        />
      </Plane>

      {/* Characters with Laptops */}
      <AnimatedCharacter position={[-2, 0, 0]} color="#4169E1" />
      <AnimatedLaptop position={[-2, -0.3, 0.5]} rotation={[0, 0, 0]} />
      
      <AnimatedCharacter position={[2, 0, 0]} color="#9370DB" />
      <AnimatedLaptop position={[2, -0.3, 0.5]} rotation={[0, 0, 0]} />
      
      <AnimatedCharacter position={[0, 0, -2]} color="#FF6347" />
      <AnimatedLaptop position={[0, -0.3, -1.5]} rotation={[0, 0, 0]} />

      {/* Floating Code Blocks */}
      <FloatingCodeBlock position={[-3, 2, 1]} text="if" color="#FF6B6B" />
      <FloatingCodeBlock position={[3, 2.5, 1]} text="for" color="#4ECDC4" />
      <FloatingCodeBlock position={[0, 3, 2]} text="def" color="#45B7D1" />
      <FloatingCodeBlock position={[-1, 2.8, -1]} text="class" color="#96CEB4" />
      <FloatingCodeBlock position={[1.5, 2.2, -1]} text="while" color="#FFEAA7" />
      <FloatingCodeBlock position={[-2.5, 1.5, 2]} text="return" color="#DDA0DD" />

      {/* Central Title Text */}
      <Text
        position={[0, 1.5, 0]}
        fontSize={0.3}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        EduCode Platform
      </Text>
      
      <Text
        position={[0, 1, 0]}
        fontSize={0.15}
        color="#cccccc"
        anchorX="center"
        anchorY="middle"
      >
        Learn to Code with Interactive Lessons
      </Text>

      {/* Orbit Controls */}
      <OrbitControls 
        enableZoom={false} 
        enablePan={false}
        autoRotate 
        autoRotateSpeed={0.5}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 3}
      />
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