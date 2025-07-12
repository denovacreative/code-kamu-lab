import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Lightbulb,
  BookOpen,
  Code,
  Download,
  Share,
  Clock,
  Target,
  Trophy,
  Zap,
  Brain,
  ChartBar,
  FileText,
  Image as ImageIcon,
  Play
} from 'lucide-react';

interface CodeTemplate {
  id: string;
  title: string;
  description: string;
  code: string;
  category: 'basic' | 'data-science' | 'web' | 'algorithms' | 'visualization';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

interface Snippet {
  id: string;
  title: string;
  code: string;
  description: string;
  language: string;
  userId: string;
  isPublic: boolean;
  createdAt: string;
}

interface Hint {
  id: string;
  cellId: string;
  content: string;
  type: 'tip' | 'warning' | 'info' | 'error';
  isVisible: boolean;
}

const CODE_TEMPLATES: CodeTemplate[] = [
  {
    id: 'hello_world',
    title: 'Hello World',
    description: 'Basic Python hello world program',
    code: 'print("Hello, World!")\nprint("Welcome to Python programming!")',
    category: 'basic',
    difficulty: 'beginner',
    tags: ['basics', 'print', 'strings']
  },
  {
    id: 'data_analysis',
    title: 'Data Analysis Starter',
    description: 'Basic data analysis with pandas',
    code: `import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

# Create sample data
data = {
    'x': np.random.randn(100),
    'y': np.random.randn(100)
}
df = pd.DataFrame(data)

# Basic analysis
print(df.describe())
df.plot.scatter(x='x', y='y')
plt.show()`,
    category: 'data-science',
    difficulty: 'intermediate',
    tags: ['pandas', 'matplotlib', 'analysis']
  },
  {
    id: 'web_scraping',
    title: 'Web Scraping Basics',
    description: 'Simple web scraping example',
    code: `import requests
from bs4 import BeautifulSoup

# Make a request
url = "https://httpbin.org/html"
response = requests.get(url)

# Parse HTML
soup = BeautifulSoup(response.content, 'html.parser')
print(soup.title.text)`,
    category: 'web',
    difficulty: 'intermediate',
    tags: ['requests', 'beautifulsoup', 'scraping']
  },
  {
    id: 'sorting_algorithm',
    title: 'Bubble Sort',
    description: 'Implementation of bubble sort algorithm',
    code: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

# Test the algorithm
numbers = [64, 34, 25, 12, 22, 11, 90]
print("Original:", numbers)
sorted_numbers = bubble_sort(numbers.copy())
print("Sorted:", sorted_numbers)`,
    category: 'algorithms',
    difficulty: 'intermediate',
    tags: ['sorting', 'algorithms', 'loops']
  },
  {
    id: 'visualization',
    title: 'Interactive Plot',
    description: 'Create interactive visualizations',
    code: `import plotly.express as px
import pandas as pd

# Sample data
df = px.data.iris()

# Create interactive scatter plot
fig = px.scatter(df, x="sepal_width", y="sepal_length", 
                color="species", title="Iris Dataset")
fig.show()`,
    category: 'visualization',
    difficulty: 'intermediate',
    tags: ['plotly', 'visualization', 'interactive']
  }
];

interface NotebookEnhancementsProps {
  classId?: string;
  onInsertCode: (code: string) => void;
  onAddHint: (hint: string, type: string) => void;
}

const NotebookEnhancements = ({ classId, onInsertCode, onAddHint }: NotebookEnhancementsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('templates');
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [newSnippet, setNewSnippet] = useState({
    title: '',
    code: '',
    description: '',
    language: 'python'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  useEffect(() => {
    if (classId) {
      loadSnippets();
    }
  }, [classId]);

  const loadSnippets = async () => {
    try {
      const { data, error } = await supabase
        .from('class_activities')
        .select('*')
        .eq('class_id', classId)
        .eq('activity_type', 'code_snippet')
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const snippetsData = data?.map(activity => {
        const snippet = JSON.parse(activity.content);
        return {
          ...snippet,
          id: activity.id,
          userId: activity.user_id,
          createdAt: activity.timestamp
        };
      }) || [];

      setSnippets(snippetsData);
    } catch (error) {
      console.error('Error loading snippets:', error);
    }
  };

  const saveSnippet = async () => {
    if (!newSnippet.title.trim() || !newSnippet.code.trim()) {
      toast({
        title: "Error",
        description: "Please fill in title and code",
        variant: "destructive"
      });
      return;
    }

    try {
      const snippet = {
        ...newSnippet,
        isPublic: true
      };

      const { error } = await supabase
        .from('class_activities')
        .insert({
          class_id: classId,
          user_id: user?.id,
          activity_type: 'code_snippet',
          content: JSON.stringify(snippet),
          timestamp: new Date().toISOString()
        });

      if (error) throw error;

      setNewSnippet({ title: '', code: '', description: '', language: 'python' });
      loadSnippets();
      
      toast({
        title: "Snippet Saved",
        description: "Your code snippet has been saved"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save snippet",
        variant: "destructive"
      });
    }
  };

  const insertTemplate = (template: CodeTemplate) => {
    onInsertCode(template.code);
    toast({
      title: "Template Inserted",
      description: `${template.title} has been added to your notebook`
    });
  };

  const insertSnippet = (snippet: Snippet) => {
    onInsertCode(snippet.code);
    toast({
      title: "Snippet Inserted",
      description: `${snippet.title} has been added to your notebook`
    });
  };

  const filteredTemplates = CODE_TEMPLATES.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || template.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'basic': return BookOpen;
      case 'data-science': return ChartBar;
      case 'web': return Zap;
      case 'algorithms': return Brain;
      case 'visualization': return ImageIcon;
      default: return Code;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg">
          <Lightbulb className="h-5 w-5 mr-2 text-yellow-600" />
          Code Assistant
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-3 mx-4">
            <TabsTrigger value="templates" className="text-xs">Templates</TabsTrigger>
            <TabsTrigger value="snippets" className="text-xs">Snippets</TabsTrigger>
            <TabsTrigger value="hints" className="text-xs">Smart Hints</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="p-4 space-y-4">
            {/* Search and Filters */}
            <div className="space-y-2">
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-sm"
              />
              
              <div className="flex space-x-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-xs border rounded px-2 py-1 flex-1"
                >
                  <option value="all">All Categories</option>
                  <option value="basic">Basic</option>
                  <option value="data-science">Data Science</option>
                  <option value="web">Web</option>
                  <option value="algorithms">Algorithms</option>
                  <option value="visualization">Visualization</option>
                </select>
                
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="text-xs border rounded px-2 py-1 flex-1"
                >
                  <option value="all">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            {/* Templates */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredTemplates.map((template) => {
                const CategoryIcon = getCategoryIcon(template.category);
                return (
                  <Card key={template.id} className="p-3 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <CategoryIcon className="h-4 w-4 text-blue-600" />
                        <h4 className="font-medium text-sm">{template.title}</h4>
                      </div>
                      <Badge className={`text-xs ${getDifficultyColor(template.difficulty)}`}>
                        {template.difficulty}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-2">{template.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {template.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => insertTemplate(template)}
                        className="text-xs"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Use
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="snippets" className="p-4 space-y-4">
            {/* Create New Snippet */}
            <Card className="p-3">
              <h4 className="font-medium text-sm mb-2">Create Snippet</h4>
              <div className="space-y-2">
                <Input
                  placeholder="Snippet title"
                  value={newSnippet.title}
                  onChange={(e) => setNewSnippet({...newSnippet, title: e.target.value})}
                  className="text-sm"
                />
                <Textarea
                  placeholder="Code..."
                  value={newSnippet.code}
                  onChange={(e) => setNewSnippet({...newSnippet, code: e.target.value})}
                  className="text-sm font-mono"
                  rows={3}
                />
                <Input
                  placeholder="Description (optional)"
                  value={newSnippet.description}
                  onChange={(e) => setNewSnippet({...newSnippet, description: e.target.value})}
                  className="text-sm"
                />
                <Button size="sm" onClick={saveSnippet} className="w-full">
                  Save Snippet
                </Button>
              </div>
            </Card>

            {/* Saved Snippets */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {snippets.map((snippet) => (
                <Card key={snippet.id} className="p-3 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm">{snippet.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {snippet.language}
                    </Badge>
                  </div>
                  
                  {snippet.description && (
                    <p className="text-xs text-gray-600 mb-2">{snippet.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {new Date(snippet.createdAt).toLocaleDateString()}
                    </span>
                    
                    <Button
                      size="sm"
                      onClick={() => insertSnippet(snippet)}
                      className="text-xs"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Insert
                    </Button>
                  </div>
                </Card>
              ))}
              
              {snippets.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No snippets yet</p>
                  <p className="text-xs">Create your first code snippet above</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="hints" className="p-4 space-y-4">
            {/* Smart Hints */}
            <div className="space-y-3">
              <Card className="p-3 border-blue-200 bg-blue-50">
                <div className="flex items-start space-x-2">
                  <Target className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm text-blue-900">Debugging Tip</h4>
                    <p className="text-xs text-blue-700 mt-1">
                      Use <code>print()</code> statements to debug your code. Add them before and after suspicious lines to trace execution.
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-2 text-xs"
                      onClick={() => onAddHint("# Add print statements for debugging\nprint(f'Variable value: {variable_name}')", 'tip')}
                    >
                      Add Debug Code
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="p-3 border-green-200 bg-green-50">
                <div className="flex items-start space-x-2">
                  <Trophy className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm text-green-900">Best Practice</h4>
                    <p className="text-xs text-green-700 mt-1">
                      Use meaningful variable names. Instead of <code>x</code>, use <code>student_count</code> or <code>temperature</code>.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-3 border-yellow-200 bg-yellow-50">
                <div className="flex items-start space-x-2">
                  <Brain className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm text-yellow-900">Learning Suggestion</h4>
                    <p className="text-xs text-yellow-700 mt-1">
                      Try breaking down complex problems into smaller functions. Each function should do one specific task.
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-2 text-xs"
                      onClick={() => onInsertCode(`def my_function():
    """
    Description of what this function does
    """
    # Your code here
    pass`)}
                    >
                      Add Function Template
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="p-3 border-purple-200 bg-purple-50">
                <div className="flex items-start space-x-2">
                  <Zap className="h-4 w-4 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm text-purple-900">Performance Tip</h4>
                    <p className="text-xs text-purple-700 mt-1">
                      Use list comprehensions for better performance: <code>[x*2 for x in numbers]</code> instead of loops when possible.
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-2 text-xs"
                      onClick={() => onInsertCode("# List comprehension example\nresult = [x * 2 for x in range(10)]\nprint(result)")}
                    >
                      Try Example
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default NotebookEnhancements;