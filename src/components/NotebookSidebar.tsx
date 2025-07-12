import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Folder, 
  File, 
  FileText, 
  Search, 
  Plus, 
  Download,
  Upload,
  Play,
  Code,
  Database,
  Image,
  Settings,
  ChevronRight,
  ChevronDown,
  Trash2
} from 'lucide-react';

interface NotebookFile {
  id: string;
  name: string;
  type: 'notebook' | 'python' | 'data' | 'image' | 'folder';
  size?: string;
  modified?: string;
  content?: string;
  children?: NotebookFile[];
}

interface NotebookSidebarProps {
  onFileSelect: (file: NotebookFile) => void;
  onLoadContent: (content: string, fileName: string) => void;
}

const NotebookSidebar = ({ onFileSelect, onLoadContent }: NotebookSidebarProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['samples', 'notebooks']));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<NotebookFile[]>([
    {
      id: 'notebooks',
      name: 'Notebooks',
      type: 'folder',
      children: [
        {
          id: 'notebook-1',
          name: 'main.ipynb',
          type: 'notebook',
          size: '2.3 KB',
          modified: '2 min ago',
          content: `# Welcome to Interactive Python Notebook!
# Try running this cell to see the output
print("Hello, Python!")

# Variables persist between cells
name = "Python Learner"
print(f"Welcome, {name}!")

# Try some calculations
import math
result = math.sqrt(16)
print(f"Square root of 16 = {result}")

# Create a simple plot
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 10, 100)
y = np.sin(x)

plt.figure(figsize=(8, 5))
plt.plot(x, y, 'b-', linewidth=2)
plt.title('Sine Wave')
plt.xlabel('x')
plt.ylabel('sin(x)')
plt.grid(True)
plt.show()`
        },
        {
          id: 'notebook-2',
          name: 'data_analysis.ipynb',
          type: 'notebook',
          size: '5.1 KB',
          modified: '1 hour ago',
          content: `# Data Analysis Notebook
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# Create sample data
data = {
    'x': np.random.randn(100),
    'y': np.random.randn(100),
    'category': np.random.choice(['A', 'B', 'C'], 100)
}
df = pd.DataFrame(data)

print("Dataset created:")
print(df.head())

# Basic statistics
print("\\nDataset statistics:")
print(df.describe())

# Create visualization
plt.figure(figsize=(10, 6))
sns.scatterplot(data=df, x='x', y='y', hue='category')
plt.title('Sample Data Visualization')
plt.show()`
        },
        {
          id: 'notebook-3',
          name: 'visualization.ipynb',
          type: 'notebook',
          size: '8.7 KB',
          modified: '3 hours ago',
          content: `# Advanced Visualization Examples
import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns

# Set style
plt.style.use('seaborn-v0_8')
sns.set_palette("husl")

# Example 1: Multiple subplots
fig, axes = plt.subplots(2, 2, figsize=(12, 8))

# Subplot 1: Line plot
x = np.linspace(0, 10, 100)
axes[0,0].plot(x, np.sin(x), label='sin(x)')
axes[0,0].plot(x, np.cos(x), label='cos(x)')
axes[0,0].set_title('Trigonometric Functions')
axes[0,0].legend()

# Subplot 2: Bar chart
categories = ['A', 'B', 'C', 'D']
values = [23, 45, 56, 78]
axes[0,1].bar(categories, values)
axes[0,1].set_title('Bar Chart')

# Subplot 3: Scatter plot
x_scatter = np.random.randn(50)
y_scatter = np.random.randn(50)
axes[1,0].scatter(x_scatter, y_scatter, alpha=0.6)
axes[1,0].set_title('Scatter Plot')

# Subplot 4: Histogram
data_hist = np.random.normal(0, 1, 1000)
axes[1,1].hist(data_hist, bins=30, alpha=0.7)
axes[1,1].set_title('Histogram')

plt.tight_layout()
plt.show()

print("Multiple visualizations created successfully!")`
        }
      ]
    },
    {
      id: 'samples',
      name: 'Sample Files',
      type: 'folder',
      children: [
        {
          id: 'python-1',
          name: 'hello_world.py',
          type: 'python',
          size: '0.5 KB',
          modified: '1 day ago',
          content: `# Simple Hello World
print("Hello, World!")

# Variables and data types
name = "Python"
version = 3.9
is_awesome = True

print(f"Language: {name}")
print(f"Version: {version}")
print(f"Is awesome: {is_awesome}")

# Simple function
def greet(name):
    return f"Hello, {name}!"

print(greet("Developer"))`
        },
        {
          id: 'python-2',
          name: 'math_examples.py',
          type: 'python',
          size: '1.2 KB',
          modified: '2 days ago',
          content: `# Mathematical operations and functions
import math
import random

# Basic operations
a = 10
b = 3

print(f"Addition: {a} + {b} = {a + b}")
print(f"Subtraction: {a} - {b} = {a - b}")
print(f"Multiplication: {a} * {b} = {a * b}")
print(f"Division: {a} / {b} = {a / b}")
print(f"Power: {a} ** {b} = {a ** b}")

# Math module functions
print(f"\\nSquare root of {a}: {math.sqrt(a)}")
print(f"Factorial of {b}: {math.factorial(b)}")
print(f"Sin(π/2): {math.sin(math.pi/2)}")

# Random numbers
print(f"\\nRandom integer (1-10): {random.randint(1, 10)}")
print(f"Random float (0-1): {random.random()}")

# List operations
numbers = [1, 2, 3, 4, 5]
print(f"\\nOriginal list: {numbers}")
print(f"Sum: {sum(numbers)}")
print(f"Average: {sum(numbers)/len(numbers)}")
print(f"Max: {max(numbers)}")
print(f"Min: {min(numbers)}")`
        },
        {
          id: 'data-1',
          name: 'sample_data.csv',
          type: 'data',
          size: '15.3 KB',
          modified: '5 days ago',
          content: `# This would load CSV data
import pandas as pd
import io

# Sample CSV data as string
csv_data = """name,age,city,salary
John,25,New York,50000
Alice,30,San Francisco,75000
Bob,35,Chicago,60000
Carol,28,Boston,55000
David,32,Seattle,70000"""

# Load into DataFrame
df = pd.read_csv(io.StringIO(csv_data))
print("Sample data loaded:")
print(df)

print(f"\\nDataset shape: {df.shape}")
print(f"\\nColumn info:")
print(df.info())

print(f"\\nSummary statistics:")
print(df.describe())`
        }
      ]
    }
  ]);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleFileClick = (file: NotebookFile) => {
    if (file.type === 'folder') {
      toggleFolder(file.id);
      return;
    }

    setSelectedFile(file.id);
    onFileSelect(file);
    
    if (file.content) {
      onLoadContent(file.content, file.name);
      toast({
        title: "File Loaded",
        description: `${file.name} has been loaded into the editor`,
      });
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const fileId = `user-upload-${Date.now()}`;
    const filePath = `${user.id}/${file.name}`;

    try {
      // Show loading toast
      const { dismiss } = toast({
        title: "Uploading File...",
        description: `Uploading ${file.name}, please wait.`,
        duration: 120000, // 2 minutes timeout
      });

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('notebook-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        throw error;
      }

      // Read file content for local state
      const content = await file.text();
      const fileType = file.name.endsWith('.py') ? 'python' :
                       file.name.endsWith('.ipynb') ? 'notebook' :
                       file.name.endsWith('.csv') ? 'data' : 'file';

      const newFile: NotebookFile = {
        id: fileId,
        name: file.name,
        type: fileType as any,
        size: `${(file.size / 1024).toFixed(2)} KB`,
        modified: new Date().toLocaleTimeString(),
        content: content,
      };

      // Update state
      setFiles(prevFiles => {
        const userUploadsFolder = prevFiles.find(f => f.id === 'user-uploads');
        if (userUploadsFolder) {
          return prevFiles.map(f =>
            f.id === 'user-uploads' ? { ...f, children: [...(f.children || []), newFile] } : f
          );
        } else {
          return [
            ...prevFiles,
            {
              id: 'user-uploads',
              name: 'My Uploads',
              type: 'folder',
              children: [newFile],
            },
          ];
        }
      });

      setExpandedFolders(prev => new Set(prev).add('user-uploads'));
      setSelectedFile(newFile.id);
      onLoadContent(content, file.name);

      // Dismiss loading toast and show success
      dismiss();
      toast({
        title: "Upload Successful",
        description: `${file.name} has been uploaded and loaded.`,
      });

    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload Failed",
        description: `Failed to upload ${file.name}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileDoubleClick = (file: NotebookFile) => {
    if (file.type === 'folder') return;
    
    if (file.content) {
      onLoadContent(file.content, file.name);
      toast({
        title: "File Opened",
        description: `${file.name} content loaded into new cells`,
      });
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'folder': return Folder;
      case 'notebook': return FileText;
      case 'python': return Code;
      case 'data': return Database;
      case 'image': return Image;
      default: return File;
    }
  };

  const getFileColor = (type: string) => {
    switch (type) {
      case 'notebook': return 'text-blue-600';
      case 'python': return 'text-green-600';
      case 'data': return 'text-purple-600';
      case 'image': return 'text-pink-600';
      default: return 'text-gray-600';
    }
  };

  const filteredFiles = files.map(folder => ({
    ...folder,
    children: folder.children?.filter(file => 
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }));

  const renderFileTree = (items: NotebookFile[], level: number = 0) => {
    return items.map(item => {
      const Icon = getFileIcon(item.type);
      const isExpanded = expandedFolders.has(item.id);
      const isSelected = selectedFile === item.id;

      return (
        <div key={item.id} className={`ml-${level * 4}`}>
          <div
            className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer transition-colors ${
              isSelected 
                ? 'bg-blue-100 border border-blue-300' 
                : 'hover:bg-gray-100'
            }`}
            onClick={() => handleFileClick(item)}
            onDoubleClick={() => handleFileDoubleClick(item)}
          >
            {item.type === 'folder' && (
              isExpanded ? 
                <ChevronDown className="h-4 w-4 text-gray-500" /> : 
                <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
            <Icon className={`h-4 w-4 ${getFileColor(item.type)}`} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {item.name}
              </div>
              {item.size && item.modified && (
                <div className="text-xs text-gray-500">
                  {item.size} • {item.modified}
                </div>
              )}
            </div>
            {item.type === 'notebook' && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                .ipynb
              </Badge>
            )}
            {item.type === 'python' && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                .py
              </Badge>
            )}
          </div>
          
          {item.type === 'folder' && isExpanded && item.children && (
            <div className="ml-4 border-l border-gray-200 pl-2">
              {renderFileTree(item.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <Card className="w-80 h-full bg-white border-r border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Folder className="h-5 w-5 mr-2 text-blue-600" />
          Project Files
        </CardTitle>
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-1">
            <Button size="sm" variant="outline" className="h-7 text-xs">
              <Plus className="h-3 w-3 mr-1" />
              New
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleUploadClick}>
              <Upload className="h-3 w-3 mr-1" />
              Upload
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".py,.ipynb,.csv,.txt,.md"
            />
          </div>
          <Badge variant="secondary" className="text-xs">
            {files.reduce((acc, folder) => acc + (folder.children?.length || 0), 0)} files
          </Badge>
        </div>

        <div className="space-y-1 max-h-96 overflow-y-auto">
          {renderFileTree(filteredFiles)}
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-600 mb-2">
            <strong>Quick Actions:</strong>
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <div>• Single click to select</div>
            <div>• Double click to load content</div>
            <div>• Click folder to expand/collapse</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotebookSidebar;