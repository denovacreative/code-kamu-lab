import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  TrendingUp, 
  Clock, 
  Trophy, 
  Users, 
  BookOpen,
  Target,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface StudentProgress {
  student_id: string;
  student_name: string;
  assignments_completed: number;
  total_assignments: number;
  average_score: number;
  total_time_spent: number;
  last_activity: string;
  completion_percentage: number;
}

interface ClassStats {
  total_students: number;
  total_assignments: number;
  average_completion: number;
  active_students: number;
}

interface ClassProgressDashboardProps {
  classId: string;
  userRole: 'teacher' | 'student';
  className?: string;
}

const ClassProgressDashboard = ({ classId, userRole, className = "" }: ClassProgressDashboardProps) => {
  const { toast } = useToast();
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
  const [classStats, setClassStats] = useState<ClassStats>({
    total_students: 0,
    total_assignments: 0,
    average_completion: 0,
    active_students: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userRole === 'teacher') {
      fetchClassProgress();
    } else {
      fetchStudentProgress();
    }
  }, [classId, userRole]);

  const fetchClassProgress = async () => {
    try {
      setIsLoading(true);

      // Get class members
      const { data: members, error: membersError } = await supabase
        .from('class_members')
        .select('student_id')
        .eq('class_id', classId)
        .eq('is_active', true);

      if (membersError) throw membersError;

      // Get profiles for members
      const memberIds = members?.map(m => m.student_id) || [];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', memberIds);

      if (profilesError) throw profilesError;

      // Get assignments for this class
      const { data: assignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select('id')
        .eq('class_id', classId)
        .eq('is_published', true);

      if (assignmentsError) throw assignmentsError;

      const totalAssignments = assignments?.length || 0;

      const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Get submissions for each student
      const progressData: StudentProgress[] = [];
      for (const member of members || []) {
        const profile = profilesMap.get(member.student_id);
        const { data: submissions, error: submissionsError } = await supabase
          .from('assignment_student_submissions')
          .select('score, assignment_id')
          .eq('student_id', member.student_id)
          .in('assignment_id', assignments?.map(a => a.id) || []);

        if (submissionsError) continue;

        const completedAssignments = submissions?.length || 0;
        const averageScore = submissions?.length 
          ? submissions.reduce((sum, sub) => sum + (sub.score || 0), 0) / submissions.length
          : 0;

        progressData.push({
          student_id: member.student_id,
          student_name: profile?.display_name || 'Unknown',
          assignments_completed: completedAssignments,
          total_assignments: totalAssignments,
          average_score: averageScore,
          total_time_spent: 0, // We'll implement this later
          last_activity: new Date().toISOString(),
          completion_percentage: totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0
        });
      }

      setStudentProgress(progressData);
      
      // Calculate class stats
      const activeStudents = progressData.filter(p => p.completion_percentage > 0).length;
      const averageCompletion = progressData.length > 0 
        ? progressData.reduce((sum, p) => sum + p.completion_percentage, 0) / progressData.length
        : 0;

      setClassStats({
        total_students: progressData.length,
        total_assignments: totalAssignments,
        average_completion: averageCompletion,
        active_students: activeStudents
      });

    } catch (error) {
      console.error('Error fetching class progress:', error);
      toast({
        title: "Error",
        description: "Failed to load class progress",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudentProgress = async () => {
    try {
      setIsLoading(true);
      // For students, show their own progress
      // Implementation will be simpler - just their own stats
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching student progress:', error);
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  if (isLoading) {
    return (
      <Card className={`h-full ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
            Progress Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading progress...</div>
        </CardContent>
      </Card>
    );
  }

  if (userRole === 'student') {
    return (
      <Card className={`h-full ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
            My Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Student progress view coming soon</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`h-full ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-lg">
          <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
          Class Progress Dashboard
        </CardTitle>
        
        {/* Class Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600">Total Students</p>
                <p className="text-lg font-bold text-blue-700">{classStats.total_students}</p>
              </div>
              <Users className="h-5 w-5 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-orange-600">Assignments</p>
                <p className="text-lg font-bold text-orange-700">{classStats.total_assignments}</p>
              </div>
              <BookOpen className="h-5 w-5 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-600">Active Students</p>
                <p className="text-lg font-bold text-green-700">{classStats.active_students}</p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          </div>
          
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-purple-600">Avg Completion</p>
                <p className="text-lg font-bold text-purple-700">{classStats.average_completion.toFixed(1)}%</p>
              </div>
              <Trophy className="h-5 w-5 text-purple-500" />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <h4 className="font-medium text-gray-900 mb-3">Student Progress</h4>
        
        {studentProgress.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No students enrolled yet</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {studentProgress.map((student) => (
              <Card key={student.student_id} className="border-l-4 border-l-purple-500">
                <CardContent className="p-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-purple-500 text-white text-xs">
                        {getInitials(student.student_name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="font-medium text-gray-900 truncate">
                          {student.student_name}
                        </h5>
                        <Badge className={`text-white text-xs ${getProgressColor(student.completion_percentage)}`}>
                          {student.completion_percentage.toFixed(0)}%
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>Progress</span>
                          <span>{student.assignments_completed}/{student.total_assignments} assignments</span>
                        </div>
                        
                        <Progress 
                          value={student.completion_percentage} 
                          className="h-2"
                        />
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="flex items-center">
                            <Trophy className="h-3 w-3 mr-1" />
                            Avg: {student.average_score.toFixed(1)}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTime(student.total_time_spent)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClassProgressDashboard;