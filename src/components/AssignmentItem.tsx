import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Users, 
  Eye,
  Edit,
  CheckCircle,
  Trophy
} from 'lucide-react';
import { Assignment } from '@/types/assignment';
import { 
  formatDueDate, 
  getStatusColor, 
  getStatusText, 
  getAssignmentTypeIcon, 
  getAssignmentTypeLabel 
} from '@/utils/assignmentUtils';

interface AssignmentItemProps {
  assignment: Assignment;
  userRole: 'teacher' | 'student';
  onEdit: (assignment: Assignment) => void;
  onView: (assignment: Assignment) => void;
  onGrade?: (assignment: Assignment) => void;
  onTogglePublish: (assignmentId: string, currentStatus: boolean) => void;
}

const AssignmentItem = ({ 
  assignment, 
  userRole, 
  onEdit, 
  onView, 
  onGrade,
  onTogglePublish 
}: AssignmentItemProps) => {
  const TypeIcon = getAssignmentTypeIcon(assignment.assignment_type);

  return (
    <Card className="border-l-4 border-l-orange-500">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-medium text-foreground truncate">
                {assignment.title}
              </h4>
              <Badge variant="outline" className="text-xs">
                <TypeIcon className="h-4 w-4" />
                <span className="ml-1">{getAssignmentTypeLabel(assignment.assignment_type)}</span>
              </Badge>
            </div>
            {assignment.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {assignment.description}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <Badge className={`text-white ${getStatusColor(assignment, userRole)}`}>
              {getStatusText(assignment, userRole)}
            </Badge>
            
            {userRole === 'teacher' && (
              <Button
                size="sm"
                variant={assignment.is_published ? "default" : "outline"}
                onClick={() => onTogglePublish(assignment.id, assignment.is_published)}
                className="h-6 text-xs"
              >
                {assignment.is_published ? 'Published' : 'Draft'}
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-3">
          <div className="flex items-center space-x-4">
            {assignment.due_date && (
              <span className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDueDate(assignment.due_date)}
              </span>
            )}
            
            <span className="flex items-center">
              <Trophy className="h-3 w-3 mr-1" />
              {assignment.max_score} pts
            </span>
            
            {userRole === 'teacher' && (
              <span className="flex items-center">
                <Users className="h-3 w-3 mr-1" />
                {assignment.submission_count} submission{assignment.submission_count !== 1 ? 's' : ''}
              </span>
            )}
            
            {userRole === 'student' && assignment.my_submission && assignment.my_submission.score !== null && (
              <span className="flex items-center text-green-600 font-medium">
                <CheckCircle className="h-3 w-3 mr-1" />
                Score: {assignment.my_submission.score}/{assignment.max_score}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            {userRole === 'student' ? (
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 w-16 text-xs"
                onClick={() => onView(assignment)}
              >
                {assignment.my_submission ? 'View' : 'Submit'}
              </Button>
            ) : (
              <>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-6 w-6 p-0"
                  onClick={() => onView(assignment)}
                >
                  <Eye className="h-3 w-3" />
                </Button>
                {onGrade && assignment.submission_count && assignment.submission_count > 0 && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 w-8 p-0 text-xs"
                    onClick={() => onGrade(assignment)}
                  >
                    Grade
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-6 w-6 p-0"
                  onClick={() => onEdit(assignment)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssignmentItem;