import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Clock, 
  Award, 
  Calendar, 
  Play,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  User,
  Target,
  BarChart3
} from 'lucide-react';

interface Assignment {
  id: string;
  notebook_id: string;
  status: string;
  assigned_at: string;
  submitted_at?: string;
  grade?: string;
  teacher_feedback?: string;
  notebooks: {
    title: string;
    description?: string;
    difficulty?: string;
    estimated_time?: number;
  };
}

interface Progress {
  notebook_id: string;
  cells_completed: number;
  total_cells: number;
  time_spent: number;
  completion_percentage: number;
  last_accessed: string;
}

const StudentDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [stats, setStats] = useState({
    totalAssignments: 0,
    completedAssignments: 0,
    averageGrade: 0,
    totalTimeSpent: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAssignments();
      fetchProgress();
    }
  }, [user]);

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('notebook_assignments')
        .select(`
          *,
          notebooks (title, description, difficulty, estimated_time)
        `)
        .eq('student_id', user?.id)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      
      setAssignments(data || []);
      
      // Calculate stats
      const total = data?.length || 0;
      const completed = data?.filter(a => a.status === 'submitted' || a.status === 'graded').length || 0;
      const gradesData = data?.filter(a => a.grade).map(a => parseFloat(a.grade!)) || [];
      const avgGrade = gradesData.length > 0 ? gradesData.reduce((sum, grade) => sum + grade, 0) / gradesData.length : 0;

      setStats(prev => ({
        ...prev,
        totalAssignments: total,
        completedAssignments: completed,
        averageGrade: avgGrade
      }));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch assignments",
        variant: "destructive"
      });
    }
  };

  const fetchProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', user?.id);

      if (error) throw error;
      
      setProgress(data || []);
      
      // Calculate total time spent
      const totalTime = data?.reduce((sum, p) => sum + p.time_spent, 0) || 0;
      setStats(prev => ({
        ...prev,
        totalTimeSpent: totalTime
      }));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch progress",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const openNotebook = (assignmentId: string, notebookId: string) => {
    navigate(`/py-notebook?assignment=${assignmentId}&notebook=${notebookId}`);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      assigned: { color: 'bg-blue-100 text-blue-700', icon: BookOpen, text: 'New' },
      in_progress: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, text: 'In Progress' },
      submitted: { color: 'bg-green-100 text-green-700', icon: CheckCircle, text: 'Submitted' },
      graded: { color: 'bg-purple-100 text-purple-700', icon: Award, text: 'Graded' },
      overdue: { color: 'bg-red-100 text-red-700', icon: AlertCircle, text: 'Overdue' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.assigned;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
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
      <div className="bg-gradient-to-r from-[hsl(var(--pictoblox-purple))] to-[hsl(var(--pictoblox-blue))] rounded-lg p-6 text-white">
        <div className="flex items-center space-x-3">
          <User className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Welcome back!</h1>
            <p className="text-white/80">Continue your Python learning journey</p>
          </div>
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
                <p className="text-sm text-gray-600">Total Assignments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAssignments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedAssignments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Average Grade</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.averageGrade > 0 ? `${stats.averageGrade.toFixed(1)}%` : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Time Spent</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTimeSpent}m</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Your Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assignments.slice(0, 5).map((assignment) => {
              const progressData = progress.find(p => p.notebook_id === assignment.notebook_id);
              
              return (
                <div key={assignment.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {assignment.notebooks.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {assignment.notebooks.description}
                      </p>
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                        </span>
                        {assignment.notebooks.estimated_time && (
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {assignment.notebooks.estimated_time} min
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {assignment.notebooks.difficulty && (
                        <Badge className={getDifficultyColor(assignment.notebooks.difficulty)}>
                          {assignment.notebooks.difficulty}
                        </Badge>
                      )}
                      {getStatusBadge(assignment.status)}
                    </div>
                  </div>

                  {progressData && (
                    <div className="mb-3">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress: {progressData.cells_completed}/{progressData.total_cells} cells</span>
                        <span>{progressData.completion_percentage.toFixed(0)}%</span>
                      </div>
                      <Progress value={progressData.completion_percentage} className="h-2" />
                    </div>
                  )}

                  {assignment.grade && (
                    <div className="mb-3 p-2 bg-green-50 rounded border border-green-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-800">
                          Grade: {assignment.grade}%
                        </span>
                        <Award className="h-4 w-4 text-green-600" />
                      </div>
                      {assignment.teacher_feedback && (
                        <p className="text-sm text-green-700 mt-1">
                          {assignment.teacher_feedback}
                        </p>
                      )}
                    </div>
                  )}

                  <Button 
                    onClick={() => openNotebook(assignment.id, assignment.notebook_id)}
                    size="sm"
                    className="w-full bg-[hsl(var(--pictoblox-blue))] hover:bg-[hsl(var(--pictoblox-blue))/80]"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {assignment.status === 'assigned' ? 'Start Assignment' : 'Continue Working'}
                  </Button>
                </div>
              );
            })}
          </div>

          {assignments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments yet</h3>
              <p className="text-gray-600">Your teacher will assign notebooks for you to complete</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Learning Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {progress.slice(0, 3).map((p, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Notebook Progress</span>
                      <span>{p.completion_percentage.toFixed(0)}%</span>
                    </div>
                    <Progress value={p.completion_percentage} className="h-2" />
                  </div>
                </div>
              ))}
              {progress.length === 0 && (
                <p className="text-sm text-gray-500">No progress data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {assignments.slice(0, 3).map((assignment) => (
                <div key={assignment.id} className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-[hsl(var(--pictoblox-blue))] rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-gray-900">{assignment.notebooks.title}</p>
                    <p className="text-gray-500 text-xs">
                      {assignment.submitted_at 
                        ? `Submitted ${new Date(assignment.submitted_at).toLocaleDateString()}`
                        : `Assigned ${new Date(assignment.assigned_at).toLocaleDateString()}`
                      }
                    </p>
                  </div>
                </div>
              ))}
              {assignments.length === 0 && (
                <p className="text-sm text-gray-500">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;