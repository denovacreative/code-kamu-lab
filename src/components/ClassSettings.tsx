import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Settings, 
  Users, 
  UserPlus, 
  UserMinus, 
  Lock, 
  Unlock,
  Download,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ClassSettingsProps {
  classId: string;
  className: string;
  isOpen: boolean;
  isActive: boolean;
  onBack: () => void;
}

const ClassSettings = ({ classId, className, isOpen, isActive, onBack }: ClassSettingsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [classIsOpen, setClassIsOpen] = useState(isOpen);
  const [classIsActive, setClassIsActive] = useState(isActive);
  const [isLoading, setIsLoading] = useState(false);
  const [members, setMembers] = useState<any[]>([]);

  const toggleClassOpen = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('classes')
        .update({ is_open: !classIsOpen })
        .eq('id', classId);

      if (error) throw error;

      setClassIsOpen(!classIsOpen);
      toast({
        title: "Success",
        description: `Class ${!classIsOpen ? 'opened' : 'closed'} successfully`
      });
    } catch (error) {
      console.error('Error toggling class status:', error);
      toast({
        title: "Error",
        description: "Failed to update class status",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleClassActive = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('classes')
        .update({ is_active: !classIsActive })
        .eq('id', classId);

      if (error) throw error;

      setClassIsActive(!classIsActive);
      toast({
        title: "Success",
        description: `Class ${!classIsActive ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      console.error('Error toggling class active status:', error);
      toast({
        title: "Error",
        description: "Failed to update class status",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportClassData = async () => {
    try {
      // Get class data with members and assignments
      const { data: classData, error } = await supabase
        .from('classes')
        .select(`
          *,
          class_members (
            student_id,
            joined_at,
            profiles (display_name)
          ),
          assignments (
            title,
            description,
            due_date,
            max_score,
            is_published
          )
        `)
        .eq('id', classId)
        .single();

      if (error) throw error;

      const csvData = [
        ['Class Export Report'],
        ['Class Name:', className],
        ['Total Members:', classData.class_members?.length || 0],
        ['Total Assignments:', classData.assignments?.length || 0],
        [''],
        ['Members:'],
        ['Name', 'Joined Date'],
        ...(classData.class_members?.map((member: any) => [
          member.profiles?.display_name || 'Unknown',
          new Date(member.joined_at).toLocaleDateString()
        ]) || []),
        [''],
        ['Assignments:'],
        ['Title', 'Description', 'Due Date', 'Max Score', 'Published'],
        ...(classData.assignments?.map((assignment: any) => [
          assignment.title,
          assignment.description || '',
          assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No due date',
          assignment.max_score,
          assignment.is_published ? 'Yes' : 'No'
        ]) || [])
      ];

      const csvContent = csvData.map(row => Array.isArray(row) ? row.join(',') : row).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', `${className}_export.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast({
        title: "Export Successful",
        description: "Class data has been exported to CSV"
      });
    } catch (error) {
      console.error('Error exporting class data:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export class data",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack} className="text-white hover:bg-white/20">
            ← Back
          </Button>
          <h1 className="text-xl font-bold text-white flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Class Settings: {className}
          </h1>
        </div>
      </div>

      {/* Settings Cards */}
      <div className="grid gap-6">
        {/* Class Status */}
        <Card className="bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="h-5 w-5 mr-2" />
              Class Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Class Open Status</h3>
                <p className="text-sm text-gray-600">
                  When closed, students cannot join the class
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={classIsOpen ? "default" : "destructive"}>
                  {classIsOpen ? 'Open' : 'Closed'}
                </Badge>
                <Switch
                  checked={classIsOpen}
                  onCheckedChange={toggleClassOpen}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Class Active Status</h3>
                <p className="text-sm text-gray-600">
                  Inactive classes are hidden from students
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={classIsActive ? "default" : "secondary"}>
                  {classIsActive ? 'Active' : 'Inactive'}
                </Badge>
                <Switch
                  checked={classIsActive}
                  onCheckedChange={toggleClassActive}
                  disabled={isLoading}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="flex items-center justify-center"
                onClick={exportClassData}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Class Data
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center justify-center"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.origin + '/join/' + classId);
                  toast({
                    title: "Link Copied",
                    description: "Class join link copied to clipboard"
                  });
                }}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Copy Join Link
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClassSettings;