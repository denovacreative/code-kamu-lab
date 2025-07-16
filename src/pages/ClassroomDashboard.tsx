import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import ClassroomWhiteboard from '@/components/ClassroomWhiteboard';
import InteractivePoll from '@/components/InteractivePoll';
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
  Blocks,
  FileText,
  Code,
  Palette,
  BarChart3,
  ChevronDown,
  MoreHorizontal
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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

type ViewMode = 'classes' | 'notebook' | 'monitoring' | 'profile' | 'chat' | 'assignments' | 'progress' | 'files' | 'settings' | 'gradebook' | 'whiteboard' | 'polls';

const ClassroomDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<ViewMode>('classes');
  const [userRole, setUserRole] = useState<'teacher' | 'student'>('student');
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  useEffect(() => {
    loadUserRole();
  }, [user]);

  // Setup chat notifications
  useEffect(() => {
    if (!selectedClass || !user) return;

    const channel = supabase
      .channel(`class-chat-notifications-${selectedClass.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'class_messages',
          filter: `class_id=eq.${selectedClass.id}`
        },
        (payload) => {
          const newMessage = payload.new as any;
          // Only show notification if message is from someone else and we're not in chat view
          if (newMessage.user_id !== user.id && currentView !== 'chat') {
            setHasUnreadMessages(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedClass, user, currentView]);

  // Clear notifications when entering chat
  useEffect(() => {
    if (currentView === 'chat') {
      setHasUnreadMessages(false);
    }
  }, [currentView]);

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
      
      case 'whiteboard':
        return selectedClass ? (
          <div className="p-6">
            <ClassroomWhiteboard 
              classId={selectedClass.id} 
              userRole={userRole}
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-white">No class selected</p>
            <Button onClick={handleBackToClasses} className="mt-4 bg-white/20 text-white hover:bg-white/30">
              Back to Classes
            </Button>
          </div>
        );
      
      case 'polls':
        return selectedClass ? (
          <div className="p-6">
            <InteractivePoll 
              classId={selectedClass.id} 
              userRole={userRole}
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-white">No class selected</p>
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
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(var(--primary-variant))] to-[hsl(var(--secondary))]">
      {/* Navigation Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20 p-4 shadow-lg">
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
              onClick={() => navigate('/')}
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            )}
            
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                {selectedClass ? (
                  <BookOpen className="h-5 w-5 text-white" />
                ) : userRole === 'teacher' ? (
                  <GraduationCap className="h-5 w-5 text-white" />
                ) : (
                  <Users className="h-5 w-5 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  {selectedClass ? selectedClass.name : `${userRole === 'teacher' ? 'Teacher' : 'Student'} Classroom`}
                </h1>
                <p className="text-white/70 text-sm">
                  {selectedClass ? 'Collaborative Learning Space' : 'Welcome to your learning dashboard'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Class-specific navigation */}
            {selectedClass && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${getNavButtonClassName('notebook')} rounded-full px-4 py-2 transition-all duration-200 hover:scale-105`}
                  onClick={() => setCurrentView('notebook')}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Notebook
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${getNavButtonClassName('chat')} rounded-full px-4 py-2 transition-all duration-200 hover:scale-105`}
                  onClick={() => setCurrentView('chat')}
                >
                  <div className="relative">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {hasUnreadMessages && (
                      <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse flex items-center justify-center">
                        <div className="h-1.5 w-1.5 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                  Chat
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${getNavButtonClassName('assignments')} rounded-full px-4 py-2 transition-all duration-200 hover:scale-105`}
                  onClick={() => setCurrentView('assignments')}
                >
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Assignments
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 rounded-full px-4 py-2 transition-all duration-200 hover:scale-105 bg-gradient-to-r from-orange-500/20 to-yellow-500/20"
                  onClick={() => navigate('/visual-coding')}
                >
                  <Blocks className="h-4 w-4 mr-2" />
                  Visual Coding
                </Button>
                
                 <Button
                   variant="ghost"
                   size="sm"
                   className={`${getNavButtonClassName('progress')} rounded-full px-4 py-2 transition-all duration-200 hover:scale-105`}
                   onClick={() => setCurrentView('progress')}
                 >
                   <TrendingUp className="h-4 w-4 mr-2" />
                   Progress
                 </Button>
                 
                 {/* Lainnya (Others) Dropdown Menu */}
                 <DropdownMenu>
                   <DropdownMenuTrigger asChild>
                     <Button
                       variant="ghost"
                       size="sm"
                       className="text-white hover:bg-white/20 rounded-full px-4 py-2 transition-all duration-200 hover:scale-105"
                     >
                       <MoreHorizontal className="h-4 w-4 mr-2" />
                       Lainnya
                       <ChevronDown className="h-4 w-4 ml-2" />
                     </Button>
                   </DropdownMenuTrigger>
                   <DropdownMenuContent className="bg-white/95 backdrop-blur-sm border-white/20">
                     {userRole === 'teacher' && (
                       <>
                         <DropdownMenuItem 
                           onClick={() => setCurrentView('monitoring')}
                           className="cursor-pointer hover:bg-white/20"
                         >
                           <Monitor className="h-4 w-4 mr-2" />
                           Monitor
                         </DropdownMenuItem>
                         <DropdownMenuItem 
                           onClick={() => setCurrentView('gradebook')}
                           className="cursor-pointer hover:bg-white/20"
                         >
                           <GraduationCap className="h-4 w-4 mr-2" />
                           Gradebook
                         </DropdownMenuItem>
                       </>
                     )}
                     <DropdownMenuItem 
                       onClick={() => setCurrentView('whiteboard')}
                       className="cursor-pointer hover:bg-white/20"
                     >
                       <Palette className="h-4 w-4 mr-2" />
                       Whiteboard
                     </DropdownMenuItem>
                     <DropdownMenuItem 
                       onClick={() => setCurrentView('polls')}
                       className="cursor-pointer hover:bg-white/20"
                     >
                       <BarChart3 className="h-4 w-4 mr-2" />
                       Interactive Polls
                     </DropdownMenuItem>
                     <DropdownMenuItem 
                       onClick={() => setCurrentView('files')}
                       className="cursor-pointer hover:bg-white/20"
                     >
                       <Folder className="h-4 w-4 mr-2" />
                       Files
                     </DropdownMenuItem>
                     {userRole === 'teacher' && (
                       <DropdownMenuItem 
                         onClick={() => setCurrentView('settings')}
                         className="cursor-pointer hover:bg-white/20"
                       >
                         <Settings className="h-4 w-4 mr-2" />
                         Settings
                       </DropdownMenuItem>
                     )}
                   </DropdownMenuContent>
                 </DropdownMenu>
              </div>
            )}
            
            <div className="flex items-center space-x-3">
                 
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 rounded-full px-4 py-2 transition-all duration-200 hover:scale-105"
                    onClick={() => setCurrentView('profile')}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-red-500/20 rounded-full px-4 py-2 transition-all duration-200 hover:scale-105"
                    onClick={signOut}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
            </div>
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
              <Badge className="text-xs bg-white/20 text-white border-white/30">
                {userRole === 'teacher' ? 'Teaching' : 'Learning'}
              </Badge>
              <Badge className="text-xs bg-white/20 text-white border-white/30">
                {currentView.charAt(0).toUpperCase() + currentView.slice(1)}
              </Badge>
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {renderCurrentView()}
        </div>
      </div>
    </div>
  );
};

export default ClassroomDashboard;