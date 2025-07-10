import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Users, 
  Copy, 
  Settings, 
  LogIn,
  GraduationCap,
  BookOpen,
  Activity,
  Eye,
  Code,
  Play
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

interface ClassManagementProps {
  userRole: 'teacher' | 'student';
  onJoinClass: (classData: ClassData) => void;
  onCreateClass: (classData: ClassData) => void;
}

const ClassManagement = ({ userRole, onJoinClass, onCreateClass }: ClassManagementProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Teacher states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassDescription, setNewClassDescription] = useState('');
  
  // Student states
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    if (user) {
      loadClasses();
    }
  }, [user, userRole]);

  const loadClasses = async () => {
    setLoading(true);
    try {
      if (userRole === 'teacher') {
        // Load classes created by teacher
        const { data, error } = await supabase
          .from('classes')
          .select(`
            *,
            class_members!inner(count)
          `)
          .eq('teacher_id', user?.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setClasses((data || []).map(item => ({
          ...item,
          notebook_content: Array.isArray(item.notebook_content) ? item.notebook_content : [],
          member_count: item.class_members?.length || 0
        })) as ClassData[]);
      } else {
        // Load classes joined by student
        const { data, error } = await supabase
          .from('class_members')
          .select(`
            class_id,
            classes (
              id, name, description, class_code, teacher_id, 
              notebook_content, is_active, is_open, created_at
            )
          `)
          .eq('student_id', user?.id)
          .eq('is_active', true);

        if (error) throw error;
        
        const classesData = data?.map(item => ({
          ...(item.classes as any),
          notebook_content: Array.isArray(item.classes?.notebook_content) ? item.classes.notebook_content : [],
          teacher_name: 'Teacher'
        })) || [];
        
        setClasses(classesData as any);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load classes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createClass = async () => {
    if (!newClassName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a class name",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Generate class code
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_class_code');

      if (codeError) throw codeError;

      const { data, error } = await supabase
        .from('classes')
        .insert({
          name: newClassName,
          description: newClassDescription,
          class_code: codeData,
          teacher_id: user?.id,
          notebook_content: [{
            id: '1',
            type: 'code',
            content: '# Welcome to the class!\n# Start coding together...\nprint("Hello, class!")',
            output: ''
          }]
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Class Created!",
        description: `Class "${newClassName}" created with code: ${codeData}`,
      });

      setShowCreateDialog(false);
      setNewClassName('');
      setNewClassDescription('');
      loadClasses();
      onCreateClass({
        ...data,
        notebook_content: Array.isArray(data.notebook_content) ? data.notebook_content : []
      } as ClassData);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const joinClass = async () => {
    if (!joinCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a class code",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Find class by code
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('class_code', joinCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (classError || !classData) {
        toast({
          title: "Error",
          description: "Invalid class code or class not found",
          variant: "destructive"
        });
        return;
      }

      // Check if already joined
      const { data: existingMember } = await supabase
        .from('class_members')
        .select('*')
        .eq('class_id', classData.id)
        .eq('student_id', user?.id)
        .eq('is_active', true)
        .single();

      if (existingMember) {
        toast({
          title: "Already Joined",
          description: "You are already a member of this class",
        });
        onJoinClass({
          ...classData,
          notebook_content: Array.isArray(classData.notebook_content) ? classData.notebook_content : []
        } as ClassData);
        setShowJoinDialog(false);
        return;
      }

      // Join class
      const { error: joinError } = await supabase
        .from('class_members')
        .insert({
          class_id: classData.id,
          student_id: user?.id
        });

      if (joinError) throw joinError;

      // Log activity
      await supabase
        .from('class_activities')
        .insert({
          class_id: classData.id,
          user_id: user?.id,
          activity_type: 'join',
          content: 'Student joined the class'
        });

      toast({
        title: "Joined Class!",
        description: `Successfully joined "${classData.name}"`,
      });

      setShowJoinDialog(false);
      setJoinCode('');
      loadClasses();
      onJoinClass({
        ...classData,
        notebook_content: Array.isArray(classData.notebook_content) ? classData.notebook_content : []
      } as ClassData);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyClassCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: "Class code copied to clipboard",
    });
  };

  const openClass = (classData: ClassData) => {
    if (userRole === 'teacher') {
      onCreateClass(classData);
    } else {
      onJoinClass(classData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {userRole === 'teacher' ? 'My Classes' : 'Joined Classes'}
          </h2>
          <p className="text-gray-600">
            {userRole === 'teacher' 
              ? 'Create and manage your Python classes' 
              : 'Join classes and code together'
            }
          </p>
        </div>
        
        {userRole === 'teacher' ? (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Class</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Class Name</label>
                  <Input
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="e.g., Python Basics 101"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newClassDescription}
                    onChange={(e) => setNewClassDescription(e.target.value)}
                    placeholder="Brief description of the class..."
                    rows={3}
                  />
                </div>
                <Button 
                  onClick={createClass} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Creating...' : 'Create Class'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <LogIn className="h-4 w-4 mr-2" />
                Join Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join Class</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Class Code</label>
                  <Input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-digit class code"
                    maxLength={6}
                  />
                </div>
                <Button 
                  onClick={joinClass} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Joining...' : 'Join Class'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((classData) => (
          <Card 
            key={classData.id}
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => openClass(classData)}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{classData.name}</CardTitle>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {classData.class_code}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyClassCode(classData.class_code);
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {userRole === 'teacher' && (
                  <div className="flex items-center text-blue-600">
                    <Users className="h-4 w-4 mr-1" />
                    <span className="text-sm">{classData.member_count || 0}</span>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              {classData.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {classData.description}
                </p>
              )}
              
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  Created {new Date(classData.created_at).toLocaleDateString()}
                </div>
                
                <div className="flex space-x-1">
                  <Button size="sm" variant="outline" className="h-7 text-xs">
                    <BookOpen className="h-3 w-3 mr-1" />
                    Open
                  </Button>
                  {userRole === 'teacher' && (
                    <Button size="sm" variant="outline" className="h-7 text-xs">
                      <Eye className="h-3 w-3 mr-1" />
                      Monitor
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {classes.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            {userRole === 'teacher' ? (
              <GraduationCap className="h-12 w-12 text-gray-400" />
            ) : (
              <BookOpen className="h-12 w-12 text-gray-400" />
            )}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {userRole === 'teacher' ? 'No Classes Created' : 'No Classes Joined'}
          </h3>
          <p className="text-gray-500 mb-4">
            {userRole === 'teacher' 
              ? 'Create your first class to start teaching Python!' 
              : 'Join a class with a code from your teacher'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;