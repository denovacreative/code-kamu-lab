import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Target, 
  Play, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff,
  Code,
  CheckCircle,
  XCircle,
  Clock,
  Award
} from 'lucide-react';

interface TestCase {
  id?: string;
  notebook_id: string;
  cell_index: number;
  test_type: 'output_match' | 'code_contains' | 'function_exists' | 'variable_value';
  test_config: any;
  points: number;
  is_hidden: boolean;
}

interface AutoGraderProps {
  notebookId: string;
  cellCount: number;
  onTestCasesChange?: (testCases: TestCase[]) => void;
}

const AutoGrader = ({ notebookId, cellCount, onTestCasesChange }: AutoGraderProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTestCase, setNewTestCase] = useState<Partial<TestCase>>({
    notebook_id: notebookId,
    cell_index: 0,
    test_type: 'code_contains',
    test_config: {},
    points: 1,
    is_hidden: false
  });

  useEffect(() => {
    fetchTestCases();
  }, [notebookId]);

  const fetchTestCases = async () => {
    try {
      const { data, error } = await supabase
        .from('notebook_test_cases')
        .select('*')
        .eq('notebook_id', notebookId)
        .order('cell_index');

      if (error) throw error;
      setTestCases(data as TestCase[] || []);
      onTestCasesChange?.(data as TestCase[] || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch test cases",
        variant: "destructive"
      });
    }
  };

  const addTestCase = async () => {
    if (!newTestCase.test_config || Object.keys(newTestCase.test_config).length === 0) {
      toast({
        title: "Error",
        description: "Please configure the test case properly",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notebook_test_cases')
        .insert([newTestCase as any])
        .select()
        .single();

      if (error) throw error;

      setTestCases([...testCases, data]);
      setShowAddForm(false);
      setNewTestCase({
        notebook_id: notebookId,
        cell_index: 0,
        test_type: 'code_contains',
        test_config: {},
        points: 1,
        is_hidden: false
      });

      toast({
        title: "Success",
        description: "Test case added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add test case",
        variant: "destructive"
      });
    }
  };

  const deleteTestCase = async (testCaseId: string) => {
    try {
      const { error } = await supabase
        .from('notebook_test_cases')
        .delete()
        .eq('id', testCaseId);

      if (error) throw error;

      setTestCases(testCases.filter(tc => tc.id !== testCaseId));
      toast({
        title: "Success",
        description: "Test case deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete test case",
        variant: "destructive"
      });
    }
  };

  const runAutoGrader = async (submissionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('auto-grade', {
        body: { submission_id: submissionId }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Auto-grading completed. Score: ${data.percentage}%`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Auto-grading failed",
        variant: "destructive"
      });
    }
  };

  const updateTestConfig = (field: string, value: any) => {
    setNewTestCase({
      ...newTestCase,
      test_config: {
        ...newTestCase.test_config,
        [field]: value
      }
    });
  };

  const getTestTypeIcon = (type: string) => {
    switch (type) {
      case 'output_match': return Target;
      case 'code_contains': return Code;
      case 'function_exists': return CheckCircle;
      case 'variable_value': return Award;
      default: return Target;
    }
  };

  const renderTestConfig = () => {
    switch (newTestCase.test_type) {
      case 'output_match':
        return (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Expected Output</label>
              <Textarea
                placeholder="Enter expected output..."
                value={newTestCase.test_config?.expected_output || ''}
                onChange={(e) => updateTestConfig('expected_output', e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={newTestCase.test_config?.exact_match || false}
                onChange={(e) => updateTestConfig('exact_match', e.target.checked)}
              />
              <label className="text-sm">Exact match required</label>
            </div>
          </div>
        );

      case 'code_contains':
        return (
          <div>
            <label className="text-sm font-medium">Required Code Pattern</label>
            <Input
              placeholder="e.g., for i in range"
              value={newTestCase.test_config?.contains || ''}
              onChange={(e) => updateTestConfig('contains', e.target.value)}
              className="mt-1"
            />
          </div>
        );

      case 'function_exists':
        return (
          <div>
            <label className="text-sm font-medium">Function Name</label>
            <Input
              placeholder="e.g., calculate_average"
              value={newTestCase.test_config?.function_name || ''}
              onChange={(e) => updateTestConfig('function_name', e.target.value)}
              className="mt-1"
            />
          </div>
        );

      case 'variable_value':
        return (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Variable Name</label>
              <Input
                placeholder="e.g., result"
                value={newTestCase.test_config?.variable_name || ''}
                onChange={(e) => updateTestConfig('variable_name', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Expected Value</label>
              <Input
                placeholder="e.g., 42"
                value={newTestCase.test_config?.expected_value || ''}
                onChange={(e) => updateTestConfig('expected_value', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Auto-Grading Setup</h3>
          <p className="text-sm text-gray-600">Define test cases for automatic grading</p>
        </div>
        <Button 
          onClick={() => setShowAddForm(true)}
          size="sm"
          className="bg-[hsl(var(--pictoblox-orange))] hover:bg-[hsl(var(--pictoblox-orange))/80]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Test Case
        </Button>
      </div>

      {/* Add Test Case Form */}
      {showAddForm && (
        <Card className="border-2 border-[hsl(var(--pictoblox-orange))] animate-fade-in">
          <CardHeader>
            <CardTitle className="text-base">Create Test Case</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Cell Index</label>
                <Select 
                  value={newTestCase.cell_index?.toString()} 
                  onValueChange={(value) => setNewTestCase({...newTestCase, cell_index: parseInt(value)})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select cell..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: cellCount }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        Cell {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Test Type</label>
                <Select 
                  value={newTestCase.test_type} 
                  onValueChange={(value: any) => setNewTestCase({...newTestCase, test_type: value, test_config: {}})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="output_match">Output Match</SelectItem>
                    <SelectItem value="code_contains">Code Contains</SelectItem>
                    <SelectItem value="function_exists">Function Exists</SelectItem>
                    <SelectItem value="variable_value">Variable Value</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {renderTestConfig()}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Points</label>
                <Input
                  type="number"
                  min="1"
                  value={newTestCase.points}
                  onChange={(e) => setNewTestCase({...newTestCase, points: parseInt(e.target.value) || 1})}
                  className="mt-1"
                />
              </div>

              <div className="flex items-center space-x-2 mt-6">
                <input
                  type="checkbox"
                  checked={newTestCase.is_hidden}
                  onChange={(e) => setNewTestCase({...newTestCase, is_hidden: e.target.checked})}
                />
                <label className="text-sm">Hidden from students</label>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button onClick={addTestCase} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Test Case
              </Button>
              <Button onClick={() => setShowAddForm(false)} variant="outline" size="sm">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Cases List */}
      <div className="space-y-3">
        {testCases.map((testCase, index) => {
          const Icon = getTestTypeIcon(testCase.test_type);
          return (
            <Card key={testCase.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <Icon className="h-4 w-4 text-[hsl(var(--pictoblox-blue))]" />
                      <span className="font-medium">Cell {testCase.cell_index + 1}</span>
                    </div>
                    
                    <Badge variant="secondary">
                      {testCase.test_type.replace('_', ' ')}
                    </Badge>
                    
                    <Badge variant="outline">
                      {testCase.points} pts
                    </Badge>
                    
                    {testCase.is_hidden && (
                      <Badge className="bg-gray-100 text-gray-700">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Hidden
                      </Badge>
                    )}
                  </div>

                  <Button
                    onClick={() => deleteTestCase(testCase.id!)}
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                <div className="mt-2 text-sm text-gray-600">
                  {testCase.test_type === 'output_match' && (
                    <span>Expected output: "{testCase.test_config.expected_output}"</span>
                  )}
                  {testCase.test_type === 'code_contains' && (
                    <span>Must contain: "{testCase.test_config.contains}"</span>
                  )}
                  {testCase.test_type === 'function_exists' && (
                    <span>Function: {testCase.test_config.function_name}()</span>
                  )}
                  {testCase.test_type === 'variable_value' && (
                    <span>{testCase.test_config.variable_name} = {testCase.test_config.expected_value}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {testCases.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Target className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>No test cases defined yet</p>
          <p className="text-sm">Add test cases to enable auto-grading</p>
        </div>
      )}

      {testCases.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 text-blue-800">
            <Award className="h-5 w-5" />
            <span className="font-medium">Total Points: {testCases.reduce((sum, tc) => sum + tc.points, 0)}</span>
          </div>
          <p className="text-sm text-blue-600 mt-1">
            {testCases.length} test case(s) configured for auto-grading
          </p>
        </div>
      )}
    </div>
  );
};

export default AutoGrader;