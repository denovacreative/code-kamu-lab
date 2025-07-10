import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Users, 
  Code, 
  GraduationCap,
  ChevronRight,
  Play,
  Monitor,
  Share2,
  CheckCircle
} from 'lucide-react';

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
      // Navigate to auth with role parameter
      window.location.href = `/auth?role=${userType}`;
    } else {
      // If no role selected, go to auth page
      window.location.href = '/auth';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--pictoblox-purple))] to-[hsl(var(--pictoblox-purple-dark))]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Python Learning
              <span className="block text-[hsl(var(--pictoblox-orange))]">Made Simple</span>
            </h1>
            <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto">
              Interactive Python notebook environment for teachers and students. 
              Create, share, and learn Python programming with real-time compilation and feedback.
            </p>
            
            {/* User Type Selection */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button
                size="lg"
                variant={userType === 'student' ? 'default' : 'outline'}
                onClick={() => setUserType('student')}
                className={`px-8 py-6 text-lg ${
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
                className={`px-8 py-6 text-lg ${
                  userType === 'teacher' 
                    ? 'bg-[hsl(var(--pictoblox-orange))] hover:bg-[hsl(var(--pictoblox-orange))/80]' 
                    : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                }`}
              >
                <GraduationCap className="h-5 w-5 mr-2" />
                I'm a Teacher
              </Button>
            </div>

            {userType && (
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="px-8 py-6 text-lg bg-white text-[hsl(var(--pictoblox-purple))] hover:bg-white/90 font-semibold"
              >
                Get Started as {userType === 'student' ? 'Student' : 'Teacher'}
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            )}
          </div>

          {/* Demo Preview */}
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
            <div className="bg-gray-900 rounded-lg p-6 font-mono text-sm">
              <div className="flex items-center mb-4">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="ml-4 text-gray-400">Python Notebook</span>
              </div>
              <div className="text-green-400">
                <span className="text-blue-400"># Welcome to Python Learning Platform</span><br/>
                <span className="text-yellow-400">print</span>(<span className="text-red-400">"Hello, Python!"</span>)<br/>
                <span className="text-gray-500">Hello, Python!</span><br/><br/>
                <span className="text-blue-400"># Let's learn together!</span><br/>
                <span className="text-yellow-400">for</span> i <span className="text-yellow-400">in</span> <span className="text-yellow-400">range</span>(<span className="text-red-400">3</span>):<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-yellow-400">print</span>(<span className="text-red-400">"Step " + str(i+1)</span>)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white/95 backdrop-blur-sm py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Powerful Features for Modern Learning
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to teach and learn Python programming effectively
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-lg">
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
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-gradient-to-br from-[hsl(var(--pictoblox-purple))] to-[hsl(var(--pictoblox-purple-dark))] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* For Teachers */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center">
                  <GraduationCap className="h-6 w-6 mr-2" />
                  For Teachers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Badge className="bg-[hsl(var(--pictoblox-orange))] text-white">1</Badge>
                  <p>Create interactive Python notebooks with exercises</p>
                </div>
                <div className="flex items-start space-x-3">
                  <Badge className="bg-[hsl(var(--pictoblox-orange))] text-white">2</Badge>
                  <p>Share assignments with students instantly</p>
                </div>
                <div className="flex items-start space-x-3">
                  <Badge className="bg-[hsl(var(--pictoblox-orange))] text-white">3</Badge>
                  <p>Monitor progress and provide real-time feedback</p>
                </div>
                <div className="flex items-start space-x-3">
                  <Badge className="bg-[hsl(var(--pictoblox-orange))] text-white">4</Badge>
                  <p>Auto-grade submissions and track student performance</p>
                </div>
              </CardContent>
            </Card>

            {/* For Students */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center">
                  <Users className="h-6 w-6 mr-2" />
                  For Students
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Badge className="bg-[hsl(var(--pictoblox-blue))] text-white">1</Badge>
                  <p>Access assignments from your teachers</p>
                </div>
                <div className="flex items-start space-x-3">
                  <Badge className="bg-[hsl(var(--pictoblox-blue))] text-white">2</Badge>
                  <p>Code in Python with instant compilation</p>
                </div>
                <div className="flex items-start space-x-3">
                  <Badge className="bg-[hsl(var(--pictoblox-blue))] text-white">3</Badge>
                  <p>Get immediate feedback on your code</p>
                </div>
                <div className="flex items-start space-x-3">
                  <Badge className="bg-[hsl(var(--pictoblox-blue))] text-white">4</Badge>
                  <p>Submit completed work and track your progress</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white/95 backdrop-blur-sm py-20">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl font-bold text-gray-800 mb-6">
            Ready to Start Learning Python?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of students and teachers already using our platform
          </p>
          
          {!userType && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button
                size="lg"
                onClick={() => setUserType('student')}
                className="px-8 py-6 text-lg bg-[hsl(var(--pictoblox-blue))] hover:bg-[hsl(var(--pictoblox-blue))/80]"
              >
                <Users className="h-5 w-5 mr-2" />
                Sign Up as Student
              </Button>
              <Button
                size="lg"
                onClick={() => setUserType('teacher')}
                className="px-8 py-6 text-lg bg-[hsl(var(--pictoblox-orange))] hover:bg-[hsl(var(--pictoblox-orange))/80]"
              >
                <GraduationCap className="h-5 w-5 mr-2" />
                Sign Up as Teacher
              </Button>
            </div>
          )}
          
          {userType && (
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="px-8 py-6 text-lg bg-[hsl(var(--pictoblox-purple))] hover:bg-[hsl(var(--pictoblox-purple-dark))] text-white"
            >
              Get Started Now
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Landing;