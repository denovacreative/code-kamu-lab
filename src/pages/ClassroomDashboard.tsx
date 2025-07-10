import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import ClassManagement from '@/components/ClassManagement';
import LiveCollaborativeNotebook from '@/components/LiveCollaborativeNotebook';
import TeacherMonitoringDashboard from '@/components/TeacherMonitoringDashboard';
import ProfileManagement from '@/components/ProfileManagement';
import ClassChat from '@/components/ClassChat';
import ClassAssignments from '@/components/ClassAssignments';
import ClassProgressDashboard from '@/components/ClassProgressDashboard';
import ClassSettings from '@/components/ClassSettings';
import ClassFileManager from '@/components/ClassFileManager';
import Gradebook from '@/components/Gradebook';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Users, 
  BookOpen, 
  User, 
  LogOut,
  GraduationCap,
  MessageCircle,
  ClipboardList,
  TrendingUp,
  Monitor,
  ArrowLeft,
  Folder,
  Settings,
  Blocks
} from 'lucide-react';

interface ClassData {
  id: string;
  name: string;
  description: string;
  class_code: string;
  teacher_id: string;
  notebook_content: any[];
  is_active: boolean;
  is_open?: boolean;
  created_at: string;
  member_count?: number;
}

type ViewMode = 'classes' | 'notebook' | 'monitoring' | 'profile' | 'chat' | 'assignments' | 'progress' | 'files' | 'settings' | 'gradebook';

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
      
      case 'chat':
        return selectedClass ? (
          <div className="p-6">
            <ClassChat classId={selectedClass.id} className="max-w-4xl mx-auto" />
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-white">No class selected</p>
            <Button onClick={handleBackToClasses} className="mt-4 bg-white/20 text-white hover:bg-white/30">
              Back to Classes
            </Button>
          </div>
        );
      
      case 'assignments':
        return selectedClass ? (
          <div className="p-6">
            <ClassAssignments classId={selectedClass.id} userRole={userRole} className="max-w-4xl mx-auto" />
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-white">No class selected</p>
            <Button onClick={handleBackToClasses} className="mt-4 bg-white/20 text-white hover:bg-white/30">
              Back to Classes
            </Button>
          </div>
        );
      
      case 'progress':
        return selectedClass ? (
          <div className="p-6">
            <ClassProgressDashboard classId={selectedClass.id} userRole={userRole} className="max-w-4xl mx-auto" />
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-white">No class selected</p>
            <Button onClick={handleBackToClasses} className="mt-4 bg-white/20 text-white hover:bg-white/30">
              Back to Classes
            </Button>
          </div>
        );
      
      case 'files':
        return selectedClass ? (
          <div className="p-6">
            <ClassFileManager classId={selectedClass.id} className={selectedClass.name} userRole={userRole} />
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-white">No class selected</p>
            <Button onClick={handleBackToClasses} className="mt-4 bg-white/20 text-white hover:bg-white/30">
              Back to Classes
            </Button>
          </div>
        );
      
      case 'settings':
        return selectedClass && userRole === 'teacher' ? (
          <div className="p-6">
            <ClassSettings 
              classId={selectedClass.id} 
              className={selectedClass.name}
              isOpen={selectedClass.is_open || true}
              isActive={selectedClass.is_active}
              onBack={() => setCurrentView('notebook')}
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-white">Access denied or no class selected</p>
            <Button onClick={handleBackToClasses} className="mt-4 bg-white/20 text-white hover:bg-white/30">
              Back to Classes
            </Button>
          </div>
        );
      
      case 'gradebook':
        return selectedClass && userRole === 'teacher' ? (
          <div className="p-6">
            <Gradebook 
              classId={selectedClass.id} 
              className={selectedClass.name}
              onBack={() => setCurrentView('notebook')}
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-white">Access denied or no class selected</p>
            <Button onClick={handleBackToClasses} className="mt-4 bg-white/20 text-white hover:bg-white/30">
              Back to Classes
            </Button>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--pictoblox-purple))] to-[hsl(var(--pictoblox-purple-dark))]">
      {/* Navigation Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-6">
            {selectedClass ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={handleBackToClasses}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Classes
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={() => window.location.href = '/'}
              >
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            )}
            
            <h1 className="text-xl font-bold text-white flex items-center">
              {selectedClass ? (
                <>
                  <BookOpen className="h-5 w-5 mr-2" />
                  {selectedClass.name}
                </>
              ) : (
                <>
                  {userRole === 'teacher' ? (
                    <GraduationCap className="h-5 w-5 mr-2" />
                  ) : (
                    <Users className="h-5 w-5 mr-2" />
                  )}
                  {userRole === 'teacher' ? 'Teacher' : 'Student'} Classroom
                </>
              )}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Class-specific navigation */}
            {selectedClass && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className={getNavButtonClassName('notebook')}
                  onClick={() => setCurrentView('notebook')}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Notebook
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className={getNavButtonClassName('chat')}
                  onClick={() => setCurrentView('chat')}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className={getNavButtonClassName('assignments')}
                  onClick={() => setCurrentView('assignments')}
                >
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Assignments
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                  onClick={() => window.open('/visual-coding', '_blank')}
                >
                  <Blocks className="h-4 w-4 mr-2" />
                  Visual Coding
                </Button>
                
                 <Button
                   variant="ghost"
                   size="sm"
                   className={getNavButtonClassName('progress')}
                   onClick={() => setCurrentView('progress')}
                 >
                   <TrendingUp className="h-4 w-4 mr-2" />
                   Progress
                 </Button>
                 
                 <Button
                   variant="ghost"
                   size="sm"
                   className={getNavButtonClassName('files')}
                   onClick={() => setCurrentView('files')}
                 >
                   <Folder className="h-4 w-4 mr-2" />
                   Files
                 </Button>
                 
                 {userRole === 'teacher' && (
                   <>
                     <Button
                       variant="ghost"
                       size="sm"
                       className={getNavButtonClassName('monitoring')}
                       onClick={() => setCurrentView('monitoring')}
                     >
                       <Monitor className="h-4 w-4 mr-2" />
                       Monitor
                     </Button>
                     
                     <Button
                       variant="ghost"
                       size="sm"
                       className={getNavButtonClassName('gradebook')}
                       onClick={() => setCurrentView('gradebook')}
                     >
                       <GraduationCap className="h-4 w-4 mr-2" />
                       Gradebook
                     </Button>
                     
                     <Button
                       variant="ghost"
                       size="sm"
                       className={getNavButtonClassName('settings')}
                       onClick={() => setCurrentView('settings')}
                     >
                       <Settings className="h-4 w-4 mr-2" />
                       Settings
                     </Button>
                   </>
                 )}
              </>
            )}
            
            {/* Global navigation */}
            {!selectedClass && (
              <>
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
              </>
            )}
            
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
        
        {/* Class info bar */}
        {selectedClass && (
          <div className="max-w-7xl mx-auto mt-3 flex items-center justify-between">
            <div className="flex items-center space-x-4 text-white/80 text-sm">
              <span>Class Code: <code className="bg-white/20 px-2 py-1 rounded">{selectedClass.class_code}</code></span>
              {selectedClass.description && (
                <span>• {selectedClass.description}</span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                {userRole === 'teacher' ? 'Teaching' : 'Learning'}
              </Badge>
              <Badge variant="outline" className="text-xs text-white border-white/40">
                {currentView.charAt(0).toUpperCase() + currentView.slice(1)}
              </Badge>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      {renderCurrentView()}
    </div>
  );
};

export default ClassroomDashboard;