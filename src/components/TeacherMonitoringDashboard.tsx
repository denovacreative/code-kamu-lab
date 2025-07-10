import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Activity, 
  Code, 
  Clock, 
  Eye, 
  Play,
  TrendingUp,
  BarChart3,
  UserCheck,
  AlertCircle,
  BookOpen
} from 'lucide-react';

interface StudentData {
  id: string;
  student_id: string;
  display_name: string;
  email: string;
  joined_at: string;
  last_activity: string;
  is_active: boolean;
  is_online: boolean;
  active_cell?: string;
  total_executions: number;
  total_time_spent: number;
}

interface ClassActivity {
  id: string;
  user_id: string;
  activity_type: string;
  cell_id?: string;
  content?: string;
  timestamp: string;
  user_name?: string;
}

interface TeacherMonitoringDashboardProps {
  classId: string;
  className: string;
  onBack: () => void;
}

const TeacherMonitoringDashboard = ({ classId, className, onBack }: TeacherMonitoringDashboardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [activities, setActivities] = useState<ClassActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  useEffect(() => {
    if (classId) {
      loadStudents();
      loadActivities();
      setupRealtimeUpdates();
    }
  }, [classId]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('class_members')
        .select(`
          id,
          student_id,
          joined_at,
          last_activity,
          is_active,
          profiles!class_members_student_id_fkey (
            display_name,
            user_id
          )
        `)
        .eq('class_id', classId)
        .eq('is_active', true);

      if (error) throw error;

      // Get session data for each student
      const studentsWithSessions = await Promise.all(
        (data || []).map(async (member) => {
          const { data: sessionData } = await supabase
            .from('class_sessions')
            .select('*')
            .eq('class_id', classId)
            .eq('user_id', member.student_id)
            .single();

          const { data: activityCount } = await supabase
            .from('class_activities')
            .select('id')
            .eq('class_id', classId)
            .eq('user_id', member.student_id)
            .eq('activity_type', 'cell_execute');

          return {
            id: member.id,
            student_id: member.student_id,
            display_name: member.profiles?.display_name || 'Student',
            email: member.student_id, // This should be fetched properly
            joined_at: member.joined_at,
            last_activity: member.last_activity,
            is_active: member.is_active,
            is_online: sessionData?.is_online || false,
            active_cell: sessionData?.active_cell,
            total_executions: activityCount?.length || 0,
            total_time_spent: 0 // Calculate from session data
          };
        })
      );

      setStudents(studentsWithSessions);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load student data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('class_activities')
        .select(`
          *,
          profiles!class_activities_user_id_fkey (
            display_name
          )
        `)
        .eq('class_id', classId)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;

      const activitiesWithNames = (data || []).map(activity => ({
        ...activity,
        user_name: activity.profiles?.display_name || 'Unknown User'
      }));

      setActivities(activitiesWithNames);
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  const setupRealtimeUpdates = () => {
    const channel = supabase
      .channel(`teacher_monitor_${classId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'class_activities',
          filter: `class_id=eq.${classId}`
        }, 
        () => {
          loadActivities();
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'class_sessions',
          filter: `class_id=eq.${classId}`
        }, 
        () => {
          loadStudents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'cell_execute': return Play;
      case 'cell_create': return Code;
      case 'cell_edit': return Eye;
      case 'join': return UserCheck;
      case 'leave': return AlertCircle;
      default: return Activity;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'cell_execute': return 'text-green-600';
      case 'cell_create': return 'text-blue-600';
      case 'cell_edit': return 'text-yellow-600';
      case 'join': return 'text-purple-600';
      case 'leave': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const exportClassData = async () => {
    try {
      const csvData = [
        ['Student Name', 'Email', 'Joined', 'Last Activity', 'Executions', 'Status'],
        ...students.map(student => [
          student.display_name,
          student.email,
          new Date(student.joined_at).toLocaleDateString(),
          formatTimeAgo(student.last_activity),
          student.total_executions,
          student.is_online ? 'Online' : 'Offline'
        ])
      ];

      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', `${className}_students.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast({
        title: "Export Successful",
        description: "Student data has been exported to CSV",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export student data",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--pictoblox-purple))] to-[hsl(var(--pictoblox-purple-dark))]">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={onBack}
            >
              ← Back to Notebook
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                {className} - Teacher Dashboard
              </h1>
              <p className="text-white/80 text-sm">Monitor student activity and progress</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={exportClassData}
              className="text-white border-white/30 hover:bg-white/20"
            >
              Export Data
            </Button>
            <Badge variant="outline" className="text-white border-white/30">
              {students.filter(s => s.is_online).length}/{students.length} online
            </Badge>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto p-6">
        <Tabs defaultValue="students" className="space-y-6">
          <TabsList className="bg-white/10 backdrop-blur-sm">
            <TabsTrigger value="students" className="text-white">
              <Users className="h-4 w-4 mr-2" />
              Students ({students.length})
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-white">
              <Activity className="h-4 w-4 mr-2" />
              Live Activity
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-white">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Students List */}
              <div className="lg:col-span-2 space-y-4">
                {students.map((student) => (
                  <Card 
                    key={student.id}
                    className={`bg-white/95 backdrop-blur-sm cursor-pointer transition-all ${
                      selectedStudent === student.student_id ? 'ring-2 ring-blue-400' : ''
                    }`}
                    onClick={() => setSelectedStudent(student.student_id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <Avatar>
                              <AvatarFallback>
                                {student.display_name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {student.is_online && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold">{student.display_name}</h3>
                            <p className="text-sm text-gray-600">{student.email}</p>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span>Joined {formatTimeAgo(student.joined_at)}</span>
                              <span>•</span>
                              <span>Active {formatTimeAgo(student.last_activity)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge variant={student.is_online ? "default" : "secondary"}>
                              {student.is_online ? 'Online' : 'Offline'}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Play className="h-3 w-3" />
                              <span>{student.total_executions} executions</span>
                            </div>
                          </div>
                          {student.active_cell && (
                            <div className="text-xs text-blue-600 mt-1">
                              Working on cell {student.active_cell}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Student Detail Panel */}
              <div className="space-y-4">
                <Card className="bg-white/95 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Student Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedStudent ? (
                      <div className="space-y-4">
                        {(() => {
                          const student = students.find(s => s.student_id === selectedStudent);
                          if (!student) return <p>Student not found</p>;
                          
                          return (
                            <>
                              <div className="text-center">
                                <Avatar className="mx-auto mb-2">
                                  <AvatarFallback>
                                    {student.display_name.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <h3 className="font-semibold">{student.display_name}</h3>
                                <p className="text-sm text-gray-600">{student.email}</p>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm">Status:</span>
                                  <Badge variant={student.is_online ? "default" : "secondary"}>
                                    {student.is_online ? 'Online' : 'Offline'}
                                  </Badge>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Joined:</span>
                                  <span className="text-sm">{formatTimeAgo(student.joined_at)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Last Activity:</span>
                                  <span className="text-sm">{formatTimeAgo(student.last_activity)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Executions:</span>
                                  <span className="text-sm">{student.total_executions}</span>
                                </div>
                                {student.active_cell && (
                                  <div className="flex justify-between">
                                    <span className="text-sm">Active Cell:</span>
                                    <span className="text-sm text-blue-600">{student.active_cell}</span>
                                  </div>
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center">Select a student to view details</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <Card className="bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Live Activity Feed</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {activities.map((activity) => {
                      const Icon = getActivityIcon(activity.activity_type);
                      const colorClass = getActivityColor(activity.activity_type);
                      
                      return (
                        <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                          <Icon className={`h-4 w-4 mt-1 ${colorClass}`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{activity.user_name}</span>
                              <span className="text-xs text-gray-500">
                                {formatTimeAgo(activity.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {activity.activity_type === 'cell_execute' && 'Executed a code cell'}
                              {activity.activity_type === 'cell_create' && 'Created a new cell'}
                              {activity.activity_type === 'cell_edit' && 'Edited a cell'}
                              {activity.activity_type === 'join' && 'Joined the class'}
                              {activity.activity_type === 'leave' && 'Left the class'}
                            </p>
                            {activity.content && (
                              <p className="text-xs text-gray-500 mt-1 truncate">
                                {activity.content}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="bg-white/95 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold">{students.length}</p>
                      <p className="text-sm text-gray-600">Total Students</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/95 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold">{students.filter(s => s.is_online).length}</p>
                      <p className="text-sm text-gray-600">Online Now</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/95 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Play className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="text-2xl font-bold">
                        {students.reduce((sum, s) => sum + s.total_executions, 0)}
                      </p>
                      <p className="text-sm text-gray-600">Total Executions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/95 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-8 w-8 text-orange-600" />
                    <div>
                      <p className="text-2xl font-bold">{activities.length}</p>
                      <p className="text-sm text-gray-600">Total Activities</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Class Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Most Active Students</h4>
                    <div className="space-y-2">
                      {students
                        .sort((a, b) => b.total_executions - a.total_executions)
                        .slice(0, 5)
                        .map((student, index) => (
                          <div key={student.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">{index + 1}</Badge>
                              <span className="font-medium">{student.display_name}</span>
                            </div>
                            <span className="text-sm text-gray-600">
                              {student.total_executions} executions
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TeacherMonitoringDashboard;