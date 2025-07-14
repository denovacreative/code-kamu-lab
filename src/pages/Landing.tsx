import React, { Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ThreeScene from '@/components/ThreeScene';
import { 
  Code, 
  Users, 
  BookOpen, 
  Zap, 
  Play, 
  Star,
  ArrowRight,
  Monitor,
  Gamepad2,
  Brain,
  Target,
  CheckCircle,
  Sparkles
} from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* Hero Section with Three.js Background */}
      <section className="relative h-screen flex items-center justify-center">
        {/* Three.js Background */}
        <div className="absolute inset-0 z-0">
          <Suspense fallback={
            <div className="w-full h-full bg-gradient-to-br from-blue-900/20 to-purple-900/20 flex items-center justify-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
            </div>
          }>
            <ThreeScene />
          </Suspense>
        </div>
        
        {/* Overlay Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="backdrop-blur-sm bg-black/20 rounded-2xl p-8 border border-white/10">
            <Badge className="mb-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
              🚀 Interactive Learning Platform
            </Badge>
            
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              EduCode Platform
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Master programming through interactive lessons, visual coding, and collaborative learning. 
              Join thousands of students and teachers in our innovative coding education platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 px-8 py-3 text-lg group">
                  Start Learning
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              
              <Link to="/visual-coding">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-3 text-lg">
                  <Play className="mr-2 h-5 w-5" />
                  Try Visual Coding
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 animate-bounce">
          <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-3 border border-blue-400/30">
            <Code className="h-6 w-6 text-blue-400" />
          </div>
        </div>
        
        <div className="absolute top-32 right-20 animate-pulse">
          <div className="bg-purple-500/20 backdrop-blur-sm rounded-lg p-3 border border-purple-400/30">
            <Zap className="h-6 w-6 text-purple-400" />
          </div>
        </div>
        
        <div className="absolute bottom-32 left-20 animate-bounce delay-200">
          <div className="bg-pink-500/20 backdrop-blur-sm rounded-lg p-3 border border-pink-400/30">
            <Brain className="h-6 w-6 text-pink-400" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 relative z-10 bg-gradient-to-b from-transparent to-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Why Choose EduCode?
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Our platform combines the best of modern education technology with proven teaching methods
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300 group">
              <CardHeader>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Monitor className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-white">Interactive Coding Environment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Write, run, and debug code directly in your browser with our advanced Python notebook environment.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-blue-400/30 text-blue-400">Python</Badge>
                  <Badge variant="outline" className="border-blue-400/30 text-blue-400">Real-time</Badge>
                  <Badge variant="outline" className="border-blue-400/30 text-blue-400">Collaborative</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300 group">
              <CardHeader>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Gamepad2 className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-white">Visual Block Coding</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Learn programming concepts through drag-and-drop blocks, perfect for beginners and visual learners.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-purple-400/30 text-purple-400">Scratch-like</Badge>
                  <Badge variant="outline" className="border-purple-400/30 text-purple-400">Beginner-friendly</Badge>
                  <Badge variant="outline" className="border-purple-400/30 text-purple-400">Interactive</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300 group">
              <CardHeader>
                <div className="bg-gradient-to-br from-pink-500 to-pink-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-white">Classroom Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Teachers can create classes, assign projects, track progress, and provide real-time feedback to students.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-pink-400/30 text-pink-400">Live Monitoring</Badge>
                  <Badge variant="outline" className="border-pink-400/30 text-pink-400">Assignments</Badge>
                  <Badge variant="outline" className="border-pink-400/30 text-pink-400">Analytics</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12 text-white">Trusted by Educators Worldwide</h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-400 mb-2">10K+</div>
              <div className="text-gray-300">Active Students</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-400 mb-2">500+</div>
              <div className="text-gray-300">Teachers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-pink-400 mb-2">1M+</div>
              <div className="text-gray-300">Code Executions</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">50+</div>
              <div className="text-gray-300">Countries</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Ready to Start Your Coding Journey?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of students and teachers who are already learning and teaching with EduCode Platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 px-8 py-3 text-lg group">
                <Sparkles className="mr-2 h-5 w-5" />
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-slate-900/50 backdrop-blur-sm border-t border-white/10">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            EduCode Platform
          </div>
          <p className="text-gray-400 mb-6">
            Empowering the next generation of programmers through interactive education.
          </p>
          <div className="flex justify-center space-x-6 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
            <a href="#" className="hover:text-white transition-colors">About</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;