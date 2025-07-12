import { useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial } from '@react-three/drei';
import { 
  Users, 
  GraduationCap,
  ChevronRight,
  Code,
  Share2,
  Monitor,
  CheckCircle
} from 'lucide-react';

const AnimatedCard = motion(Card);

const Landing = () => {
  const [userType, setUserType] = useState<'student' | 'teacher' | null>(null);

  const features = [
    {
      icon: Code,
      title: "Interactive Python Notebook",
      description: "Code, compile, and run Python online with real-time execution",
      color: "bg-blue-500"
    },
    {
      icon: Share2,
      title: "Assignment Sharing",
      description: "Teachers can share notebooks for students to complete and submit",
      color: "bg-green-500"
    },
    {
      icon: Monitor,
      title: "Live Terminal",
      description: "Full Python environment with terminal access and package support",
      color: "bg-purple-500"
    },
    {
      icon: CheckCircle,
      title: "Auto Grading",
      description: "Automatic feedback and grading system for submitted assignments",
      color: "bg-orange-500"
    }
  ];

  const handleGetStarted = () => {
    if (userType) {
      window.location.href = `/auth?role=${userType}`;
    } else {
      window.location.href = '/auth';
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.2,
        duration: 0.5,
        ease: "easeOut"
      }
    })
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--pictoblox-purple))] to-[hsl(var(--pictoblox-purple-dark))] text-white overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 z-0">
          <Canvas>
            <Suspense fallback={null}>
              <OrbitControls enableZoom={false} />
              <ambientLight intensity={0.5} />
              <directionalLight position={[3, 5, 2]} />
              <Sphere visible args={[1, 100, 200]} scale={2}>
                <MeshDistortMaterial
                  color="#8A2BE2"
                  attach="material"
                  distort={0.5}
                  speed={2}
                />
              </Sphere>
            </Suspense>
          </Canvas>
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-16"
          >
            <motion.h1
              className="text-5xl md:text-6xl font-bold mb-6"
              initial={{ letterSpacing: "-0.1em" }}
              animate={{ letterSpacing: "0em" }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              Python Learning
              <span className="block text-[hsl(var(--pictoblox-orange))]">Made Simple</span>
            </motion.h1>
            <motion.p
              className="text-xl text-white/80 mb-8 max-w-3xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1 }}
            >
              Interactive Python notebook environment for teachers and students. 
              Create, share, and learn Python programming with real-time compilation and feedback.
            </motion.p>
            
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.5 }}
            >
              <Button
                size="lg"
                variant={userType === 'student' ? 'default' : 'outline'}
                onClick={() => setUserType('student')}
                className={`px-8 py-6 text-lg transition-transform transform hover:scale-105 ${
                  userType === 'student' 
                    ? 'bg-[hsl(var(--pictoblox-orange))] hover:bg-[hsl(var(--pictoblox-orange))/80]' 
                    : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                }`}
              >
                <Users className="h-5 w-5 mr-2" />
                I'm a Student
              </Button>
              <Button
                size="lg"
                variant={userType === 'teacher' ? 'default' : 'outline'}
                onClick={() => setUserType('teacher')}
                className={`px-8 py-6 text-lg transition-transform transform hover:scale-105 ${
                  userType === 'teacher' 
                    ? 'bg-[hsl(var(--pictoblox-orange))] hover:bg-[hsl(var(--pictoblox-orange))/80]' 
                    : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                }`}
              >
                <GraduationCap className="h-5 w-5 mr-2" />
                I'm a Teacher
              </Button>
            </motion.div>

            {userType && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Button
                  size="lg"
                  onClick={handleGetStarted}
                  className="px-8 py-6 text-lg bg-white text-[hsl(var(--pictoblox-purple))] hover:bg-white/90 font-semibold"
                >
                  Get Started as {userType === 'student' ? 'Student' : 'Teacher'}
                  <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white/95 backdrop-blur-sm py-20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Powerful Features for Modern Learning
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to teach and learn Python programming effectively
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <AnimatedCard
                key={index}
                custom={index}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.5 }}
                className="border-2 border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-lg"
              >
                <CardHeader>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className={`p-3 rounded-xl ${feature.color} text-white`}>
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-xl text-gray-800">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
