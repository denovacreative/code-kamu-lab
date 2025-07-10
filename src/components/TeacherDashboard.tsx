import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import AssignmentManager from './AssignmentManager';
import { 
  BookOpen, 
  Users, 
  Award, 
  Calendar, 
  Plus,
  Eye,
  Edit,
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  GraduationCap
} from 'lucide-react';

interface TeacherStats {
  totalNotebooks: number;
  totalAssignments: number;
  totalStudents: number;
  averageCompletionRate: number;
}

interface RecentActivity {
  id: string;
  type: 'submission' | 'assignment' | 'notebook';
  title: string;
  student_name?: string;
  timestamp: string;
  status?: string;
}

interface Notebook {
  id: string;
  title: string;
  description?: string;
  difficulty?: string;
  created_at: string;
  is_shared: boolean;
  assignment_count: number;
}

const TeacherDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState<TeacherStats>({
    totalNotebooks: 0,
    totalAssignments: 0,
    totalStudents: 0,
    averageCompletionRate: 0
  });
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      await Promise.all([
        fetchStats(),
        fetchNotebooks(),
        fetchRecentActivity()
      ]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch notebooks count
      const { count: notebooksCount } = await supabase
        .from('notebooks')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user?.id);

      // Fetch assignments count
      const { count: assignmentsCount } = await supabase
        .from('notebook_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', user?.id);

      // Fetch unique students count
      const { data: uniqueStudents } = await supabase
        .from('notebook_assignments')
        .select('student_id')
        .eq('teacher_id', user?.id);

      const uniqueStudentIds = [...new Set(uniqueStudents?.map(s => s.student_id) || [])];

      // Fetch completion rate
      const { data: completions } = await supabase
        .from('notebook_assignments')
        .select('status')
        .eq('teacher_id', user?.id);

      const completedCount = completions?.filter(c => 
        c.status === 'submitted' || c.status === 'graded'
      ).length || 0;
      
      const completionRate = completions?.length ? 
        (completedCount / completions.length) * 100 : 0;

      setStats({
        totalNotebooks: notebooksCount || 0,
        totalAssignments: assignmentsCount || 0,
        totalStudents: uniqueStudentIds.length,
        averageCompletionRate: completionRate
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchNotebooks = async () => {
    try {
      const { data, error } = await supabase
        .from('notebooks')
        .select('*')
        .eq('created_by', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      
      const notebooksWithCount = (data || []).map(notebook => ({
        ...notebook,
        assignment_count: 0
      }));
      
      setNotebooks(notebooksWithCount);
    } catch (error) {
      console.error('Error fetching notebooks:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      // Fetch recent submissions
      const { data: submissions, error: submissionsError } = await supabase
        .from('notebook_assignments')
        .select(`
          id,
          submitted_at,
          status,
          notebooks (title)
        `)
        .eq('teacher_id', user?.id)
        .not('submitted_at', 'is', null)
        .order('submitted_at', { ascending: false })
        .limit(10);

      if (submissionsError) throw submissionsError;

      const activities: RecentActivity[] = (submissions || []).map(sub => ({
        id: sub.id,
        type: 'submission',
        title: sub.notebooks?.title || 'Unknown Notebook',
        student_name: 'Student',
        timestamp: sub.submitted_at!,
        status: sub.status
      }));

      setRecentActivity(activities);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const createNewNotebook = () => {
    navigate('/py-notebook');
  };

  const openNotebook = (notebookId: string) => {
    navigate(`/py-notebook?notebook=${notebookId}`);
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'submitted': return CheckCircle;
      case 'graded': return Award;
      case 'assigned': return BookOpen;
      default: return Clock;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-[hsl(var(--pictoblox-purple))] to-[hsl(var(--pictoblox-orange))] rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
            <p className="text-white/80">Manage your Python courses and student progress</p>
          </div>
          <Button 
            onClick={createNewNotebook}
            className="bg-white text-[hsl(var(--pictoblox-purple))] hover:bg-white/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Notebook
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Notebooks</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalNotebooks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <GraduationCap className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Assignments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAssignments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.averageCompletionRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Notebooks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Recent Notebooks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notebooks.map((notebook) => (
                    <div key={notebook.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{notebook.title}</h3>
                        <div className="flex items-center space-x-2">
                          {notebook.difficulty && (
                            <Badge className={getDifficultyColor(notebook.difficulty)}>
                              {notebook.difficulty}
                            </Badge>
                          )}
                          {notebook.is_shared && (
                            <Badge variant="outline">Shared</Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">
                        {notebook.description || 'No description'}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(notebook.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="text-xs">
                            {notebook.assignment_count || 0} assignments
                          </Badge>
                          <Button
                            onClick={() => openNotebook(notebook.id)}
                            size="sm"
                            variant="outline"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Open
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {notebooks.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No notebooks created yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => {
                    const Icon = getStatusIcon(activity.status);
                    return (
                      <div key={activity.id} className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Icon className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {activity.student_name} • {new Date(activity.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        {activity.status && (
                          <Badge variant="outline" className="text-xs">
                            {activity.status}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                  
                  {recentActivity.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No recent activity</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assignments">
          <AssignmentManager />
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Analytics coming soon</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Assignment Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Trends analysis coming soon</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherDashboard;