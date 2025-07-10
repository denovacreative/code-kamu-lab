import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList, Plus } from 'lucide-react';
import { Assignment, ClassAssignmentsProps, ViewMode } from '@/types/assignment';
import { useAssignments } from '@/hooks/useAssignments';
import AssignmentEditor from './AssignmentEditor';
import AssignmentSubmission from './AssignmentSubmission';
import AssignmentItem from './AssignmentItem';

const ClassAssignments = ({ classId, userRole, className = "" }: ClassAssignmentsProps) => {
  const { assignments, isLoading, fetchAssignments, togglePublishAssignment } = useAssignments(classId, userRole);
  const [currentView, setCurrentView] = useState<ViewMode>('list');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);

  // Handle view changes
  const handleEditAssignment = (assignment: Assignment) => {
    setEditingAssignmentId(assignment.id);
    setCurrentView('editor');
  };

  const handleViewSubmission = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setCurrentView('submission');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedAssignment(null);
    setEditingAssignmentId(null);
    fetchAssignments(); // Refresh the list
  };

  // Render different views
  if (currentView === 'editor') {
    return (
      <AssignmentEditor
        assignmentId={editingAssignmentId || undefined}
        classId={classId}
        onBack={handleBackToList}
      />
    );
  }

  if (currentView === 'submission' && selectedAssignment) {
    return (
      <AssignmentSubmission
        assignment={selectedAssignment}
        onBack={handleBackToList}
      />
    );
  }

  if (isLoading) {
    return (
      <Card className={`h-full ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <ClipboardList className="h-5 w-5 mr-2 text-orange-600" />
            Assignments
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading assignments...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`h-full ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg">
            <ClipboardList className="h-5 w-5 mr-2 text-orange-600" />
            Assignments
          </CardTitle>
          
          {userRole === 'teacher' && (
            <Button 
              size="sm" 
              className="flex items-center"
              onClick={() => {
                setEditingAssignmentId(null);
                setCurrentView('editor');
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Create
            </Button>
          )}
        </div>
        
        <div className="text-sm text-muted-foreground">
          {assignments.length} assignment{assignments.length !== 1 ? 's' : ''} found
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {assignments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No assignments yet</p>
            {userRole === 'teacher' && (
              <p className="text-xs mt-1">Create your first assignment to get started</p>
            )}
          </div>
        ) : (
          assignments.map((assignment) => (
            <AssignmentItem
              key={assignment.id}
              assignment={assignment}
              userRole={userRole}
              onEdit={handleEditAssignment}
              onView={handleViewSubmission}
              onTogglePublish={togglePublishAssignment}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default ClassAssignments;