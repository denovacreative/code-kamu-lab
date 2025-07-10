import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import ClassManagement from '@/components/ClassManagement';
import LiveCollaborativeNotebook from '@/components/LiveCollaborativeNotebook';
import TeacherMonitoringDashboard from '@/components/TeacherMonitoringDashboard';
import ProfileManagement from '@/components/ProfileManagement';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  Users, 
  BookOpen, 
  User, 
  LogOut,
  GraduationCap
} from 'lucide-react';

interface ClassData {
  id: string;
  name: string;
  description: string;
  class_code: string;
  teacher_id: string;
  notebook_content: any[];
  is_active: boolean;
  created_at: string;
  member_count?: number;
}

type ViewMode = 'classes' | 'notebook' | 'monitoring' | 'profile';

const ClassroomDashboard = () => {
  const { user, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<ViewMode>('classes');
  const [userRole, setUserRole] = useState<'teacher' | 'student'>('student');
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);

  useEffect(() => {
    loadUserRole();
  }, [user]);

  const loadUserRole = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (data && data.role) {
        setUserRole(data.role as 'teacher' | 'student');
      }
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  };

  const handleJoinClass = (classData: ClassData) => {
    setSelectedClass(classData);
    setCurrentView('notebook');
  };

  const handleCreateClass = (classData: ClassData) => {
    setSelectedClass(classData);
    setCurrentView('notebook');
  };

  const handleBackToClasses = () => {
    setCurrentView('classes');
    setSelectedClass(null);
  };

  const handleMonitorClass = () => {
    if (selectedClass) {
      setCurrentView('monitoring');
    }
  };

  const getNavButtonClassName = (view: ViewMode) => {
    return `text-white hover:bg-white/20 ${currentView === view ? 'bg-white/20' : ''}`;
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'classes':
        return (
          <ClassManagement
            userRole={userRole}
            onJoinClass={handleJoinClass}
            onCreateClass={handleCreateClass}
          />
        );
      
      case 'notebook':
        return selectedClass ? (
          <LiveCollaborativeNotebook
            classId={selectedClass.id}
            className={selectedClass.name}
            userRole={userRole}
            onClose={handleBackToClasses}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-white">No class selected</p>
            <Button 
              onClick={handleBackToClasses}
              className="mt-4 bg-white/20 text-white hover:bg-white/30"
            >
              Back to Classes
            </Button>
          </div>
        );
      
      case 'monitoring':
        return selectedClass && userRole === 'teacher' ? (
          <TeacherMonitoringDashboard
            classId={selectedClass.id}
            className={selectedClass.name}
            onBack={() => setCurrentView('notebook')}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-white">Access denied or no class selected</p>
            <Button 
              onClick={handleBackToClasses}
              className="mt-4 bg-white/20 text-white hover:bg-white/30"
            >
              Back to Classes
            </Button>
          </div>
        );
      
      case 'profile':
        return (
          <ProfileManagement
            onBack={() => setCurrentView('classes')}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--pictoblox-purple))] to-[hsl(var(--pictoblox-purple-dark))]">
      {/* Navigation Header */}
      {currentView === 'classes' && (
        <div className="bg-white/10 backdrop-blur-sm border-b border-white/20 p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={() => window.location.href = '/'}
              >
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              
              <h1 className="text-xl font-bold text-white flex items-center">
                {userRole === 'teacher' ? (
                  <GraduationCap className="h-5 w-5 mr-2" />
                ) : (
                  <Users className="h-5 w-5 mr-2" />
                )}
                {userRole === 'teacher' ? 'Teacher' : 'Student'} Classroom
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className={getNavButtonClassName('classes')}
                onClick={() => setCurrentView('classes')}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Classes
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className={getNavButtonClassName('profile')}
                onClick={() => setCurrentView('profile')}
              >
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
              
              <div className="text-white text-sm">
                {user?.email}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-white hover:bg-white/20"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {renderCurrentView()}
    </div>
  );
};

export default ClassroomDashboard;