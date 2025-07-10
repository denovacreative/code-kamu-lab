import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { 
  Code, 
  FileText, 
  Brain, 
  Box,
  Blocks,
  Laptop,
  LogOut,
  User,
  Users,
  GraduationCap
} from "lucide-react";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const features = [
    // Block Coding Section
    {
      category: "Block Coding",
      items: [
        {
          title: "Junior Blocks",
          description: "Code by stacking puzzle-shaped blocks",
          age: "Ages 4+",
          icon: Blocks,
          color: "bg-pictoblox-orange",
          route: "/junior-blocks"
        },
        {
          title: "Blocks", 
          description: "Code with playful puzzle-shaped blocks",
          age: "Ages 7+",
          icon: Blocks,
          color: "bg-pictoblox-pink",
          route: "/visual-coding"
        }
      ]
    },
    // Python Coding Section
    {
      category: "Python Coding",
      items: [
        {
          title: "Py Editor",
          description: "Code with text based coding in Python.",
          age: "Ages 12+",
          icon: Code,
          color: "bg-pictoblox-blue",
          route: "/py-editor"
        },
        {
          title: "Py Notebook",
          description: "Code with text based coding in Notebook interface.",
          age: "Ages 12+", 
          icon: FileText,
          color: "bg-pictoblox-orange",
          route: "/py-notebook"
        },
        {
          title: "Classroom",
          description: "Interactive classroom for teachers and students with real-time collaboration.",
          age: "Ages 12+", 
          icon: Users,
          color: "bg-pictoblox-purple",
          route: "/classroom"
        }
      ]
    }
  ];

  const advancedFeatures = [
    {
      title: "Machine Learning Environment",
      description: "Train ML models for image, object, face, pose (hand and body), sound, NLP, and numbers",
      age: "Ages 12+",
      icon: Brain,
      color: "bg-pictoblox-purple",
      route: "/ml-environment"
    },
    {
      title: "3D and XR Studio", 
      description: "Create interactive 3D projects in AR/VR with animations, physics, trackers, filters, and much more",
      age: "Ages 12+",
      badge: "Beta",
      icon: Box,
      color: "bg-pictoblox-blue",
      route: "/3d-xr-studio"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--pictoblox-purple))] to-[hsl(var(--pictoblox-purple-dark))] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with User Info */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-white">
            <h2 className="text-lg font-medium">Welcome back!</h2>
            <p className="text-white/80">{user?.email}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => navigate('/classroom')}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Users className="h-4 w-4 mr-2" />
              Classroom
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/classroom?tab=profile')}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
            <Button
              variant="outline"
              onClick={signOut}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Main Question */}
        <div className="text-center mb-12">
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 mb-8 border border-white/20">
            <h1 className="text-4xl font-bold text-white mb-4">What would you like to do?</h1>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 space-y-8">
          {/* Block Coding and Python Coding Sections */}
          {features.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                {section.category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {section.items.map((item, index) => (
                  <Card key={index} className="relative overflow-hidden border-2 border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-lg group cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <Badge variant="outline" className="text-purple-600 border-purple-300 bg-purple-50">
                          {item.age}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 mb-4">
                        <div className={`p-3 rounded-xl ${item.color} text-white`}>
                          <item.icon className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">{item.title}</h3>
                      </div>
                      
                      <p className="text-gray-600 mb-4">
                        {item.description}
                      </p>
                      
                      <Button 
                        className="w-full bg-[hsl(var(--pictoblox-purple))] hover:bg-[hsl(var(--pictoblox-purple-dark))] text-white"
                        onClick={() => {
                          if (item.route === '/py-notebook' || item.route === '/classroom' || item.route === '/visual-coding') {
                            navigate(item.route);
                          } else {
                            console.log(`Navigate to ${item.route} - Coming Soon!`);
                            toast({
                              title: "Coming Soon",
                              description: `${item.title} feature is coming soon!`,
                            });
                          }
                        }}
                      >
                        Start Coding
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {/* Advanced Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {advancedFeatures.map((item, index) => (
              <Card key={index} className="relative overflow-hidden border-2 border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-lg group cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex space-x-2">
                      <Badge variant="outline" className="text-purple-600 border-purple-300 bg-purple-50">
                        {item.age}
                      </Badge>
                      {item.badge && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 mb-4">
                    <div className={`p-3 rounded-xl ${item.color} text-white`}>
                      <item.icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">{item.title}</h3>
                  </div>
                  
                  <p className="text-gray-600 mb-4">
                    {item.description}
                  </p>
                  
                  <Button 
                    className="w-full bg-[hsl(var(--pictoblox-purple))] hover:bg-[hsl(var(--pictoblox-purple-dark))] text-white"
                    onClick={() => {
                      console.log(`Navigate to ${item.route} - Coming Soon!`);
                      toast({
                        title: "Coming Soon",
                        description: `${item.title} feature is coming soon!`,
                      });
                    }}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;