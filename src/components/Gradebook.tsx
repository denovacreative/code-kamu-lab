import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  BookOpen, 
  Download, 
  Users, 
  Trophy,
  ArrowLeft,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface GradebookProps {
  classId: string;
  className: string;
  onBack: () => void;
}

interface StudentGrade {
  student_id: string;
  student_name: string;
  assignment_scores: { [assignmentId: string]: number | null };
  total_score: number;
  total_possible: number;
  percentage: number;
}

interface Assignment {
  id: string;
  title: string;
  max_score: number;
  due_date: string | null;
}

const Gradebook = ({ classId, className, onBack }: GradebookProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentGrade[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadGradebook();
  }, [classId]);

  const loadGradebook = async () => {
    try {
      setIsLoading(true);

      // Load assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select('id, title, max_score, due_date')
        .eq('class_id', classId)
        .eq('is_published', true)
        .order('created_at');

      if (assignmentsError) throw assignmentsError;

      // Load students
      const { data: studentsData, error: studentsError } = await supabase
        .from('class_members')
        .select(`
          student_id,
          profiles!class_members_student_id_fkey (
            display_name
          )
        `)
        .eq('class_id', classId)
        .eq('is_active', true);

      if (studentsError) throw studentsError;

      // Load all submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('assignment_student_submissions')
        .select('assignment_id, student_id, score')
        .in('assignment_id', (assignmentsData || []).map(a => a.id));

      if (submissionsError) throw submissionsError;

      // Process data
      const assignmentsList = assignmentsData || [];
      const totalPossible = assignmentsList.reduce((sum, a) => sum + (a.max_score || 0), 0);

      const studentsWithGrades = (studentsData || []).map(student => {
        const studentSubmissions = (submissionsData || []).filter(s => s.student_id === student.student_id);
        
        const assignmentScores: { [key: string]: number | null } = {};
        let totalScore = 0;
        
        assignmentsList.forEach(assignment => {
          const submission = studentSubmissions.find(s => s.assignment_id === assignment.id);
          const score = submission?.score || null;
          assignmentScores[assignment.id] = score;
          if (score !== null) {
            totalScore += score;
          }
        });

        return {
          student_id: student.student_id,
          student_name: (student.profiles as any)?.display_name || 'Unknown Student',
          assignment_scores: assignmentScores,
          total_score: totalScore,
          total_possible: totalPossible,
          percentage: totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0
        };
      });

      setAssignments(assignmentsList);
      setStudents(studentsWithGrades);

    } catch (error) {
      console.error('Error loading gradebook:', error);
      toast({
        title: "Error",
        description: "Failed to load gradebook",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportGradebook = async () => {
    try {
      const csvData = [
        ['Gradebook Export - ' + className],
        ['Student Name', ...assignments.map(a => `${a.title} (${a.max_score}pts)`), 'Total Score', 'Percentage'],
        ...students.map(student => [
          student.student_name,
          ...assignments.map(a => student.assignment_scores[a.id] ?? 'Not Submitted'),
          `${student.total_score}/${student.total_possible}`,
          `${student.percentage.toFixed(1)}%`
        ])
      ];

      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', `${className}_gradebook.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast({
        title: "Export Successful",
        description: "Gradebook has been exported to CSV"
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export gradebook",
        variant: "destructive"
      });
    }
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getGradeLetter = (percentage: number) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="bg-white/95 backdrop-blur-sm">
          <CardContent className="flex items-center justify-center h-64">
            <div className="animate-pulse text-muted-foreground">Loading gradebook...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-bold text-white flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            Gradebook: {className}
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-white border-white/30">
            {students.length} student{students.length !== 1 ? 's' : ''}
          </Badge>
          <Badge variant="outline" className="text-white border-white/30">
            {assignments.length} assignment{assignments.length !== 1 ? 's' : ''}
          </Badge>
          <Button variant="outline" onClick={exportGradebook} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/95 backdrop-blur-sm">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {students.length}
            </div>
            <div className="text-sm text-gray-600">Total Students</div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/95 backdrop-blur-sm">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {assignments.length}
            </div>
            <div className="text-sm text-gray-600">Assignments</div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/95 backdrop-blur-sm">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {students.length > 0 ? (students.reduce((sum, s) => sum + s.percentage, 0) / students.length).toFixed(1) : 0}%
            </div>
            <div className="text-sm text-gray-600">Class Average</div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/95 backdrop-blur-sm">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {assignments.reduce((sum, a) => sum + (a.max_score || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Total Points</div>
          </CardContent>
        </Card>
      </div>

      {/* Gradebook Table */}
      <Card className="bg-white/95 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Grade Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No students enrolled yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Student</th>
                    {assignments.map(assignment => (
                      <th key={assignment.id} className="text-center p-2 font-medium min-w-24">
                        <div className="truncate" title={assignment.title}>
                          {assignment.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {assignment.max_score}pts
                        </div>
                      </th>
                    ))}
                    <th className="text-center p-2 font-medium">Total</th>
                    <th className="text-center p-2 font-medium">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.student_id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{student.student_name}</td>
                      {assignments.map(assignment => {
                        const score = student.assignment_scores[assignment.id];
                        return (
                          <td key={assignment.id} className="text-center p-2">
                            {score !== null ? (
                              <Badge variant="outline" className="text-xs">
                                {score}/{assignment.max_score}
                              </Badge>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="text-center p-2 font-medium">
                        {student.total_score}/{student.total_possible}
                      </td>
                      <td className="text-center p-2">
                        <div className={`font-bold ${getGradeColor(student.percentage)}`}>
                          {getGradeLetter(student.percentage)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {student.percentage.toFixed(1)}%
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Gradebook;