import React from 'react';

// Temporary CSS-based animation while we fix Three.js issues
const ThreeScene = () => {
  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/30 to-pink-900/20">
        
        {/* Floating Code Blocks - CSS Animation */}
        <div className="absolute top-20 left-20 animate-bounce">
          <div className="bg-blue-500/30 backdrop-blur-sm rounded-lg p-4 border border-blue-400/50">
            <code className="text-blue-200 text-sm font-mono">def learn():</code>
          </div>
        </div>
        
        <div className="absolute top-40 right-32 animate-pulse">
          <div className="bg-purple-500/30 backdrop-blur-sm rounded-lg p-4 border border-purple-400/50">
            <code className="text-purple-200 text-sm font-mono">for i in range(10):</code>
          </div>
        </div>
        
        <div className="absolute bottom-32 left-32 animate-bounce delay-200">
          <div className="bg-pink-500/30 backdrop-blur-sm rounded-lg p-4 border border-pink-400/50">
            <code className="text-pink-200 text-sm font-mono">if coding:</code>
          </div>
        </div>
        
        <div className="absolute top-60 left-1/2 animate-pulse delay-300">
          <div className="bg-green-500/30 backdrop-blur-sm rounded-lg p-4 border border-green-400/50">
            <code className="text-green-200 text-sm font-mono">print("Hello World")</code>
          </div>
        </div>
        
        <div className="absolute bottom-40 right-20 animate-bounce delay-500">
          <div className="bg-yellow-500/30 backdrop-blur-sm rounded-lg p-4 border border-yellow-400/50">
            <code className="text-yellow-200 text-sm font-mono">while True:</code>
          </div>
        </div>

        {/* Animated Particles */}
        <div className="absolute inset-0">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        {/* Central Content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
              Interactive Learning
            </h2>
            <p className="text-lg text-gray-300 animate-fade-in">
              Code • Learn • Create
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreeScene;