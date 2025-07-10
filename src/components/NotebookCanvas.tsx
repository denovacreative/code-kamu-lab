import { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Download,
  Settings,
  Play,
  Palette,
  Code,
  Image,
  BarChart3
} from 'lucide-react';

interface NotebookCanvasProps {
  isVisible: boolean;
  onToggle: () => void;
}

const NotebookCanvas = ({ isVisible, onToggle }: NotebookCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canvasCode, setCanvasCode] = useState(`# Python Canvas - Interactive Plotting
import matplotlib.pyplot as plt
import numpy as np

# Generate sample data
x = np.linspace(0, 10, 100)
y1 = np.sin(x)
y2 = np.cos(x)

# Create the plot
plt.figure(figsize=(10, 6))
plt.plot(x, y1, 'b-', label='sin(x)', linewidth=2)
plt.plot(x, y2, 'r--', label='cos(x)', linewidth=2)

plt.title('Interactive Trigonometric Functions', fontsize=14)
plt.xlabel('x')
plt.ylabel('y')
plt.legend()
plt.grid(True, alpha=0.3)

# Show the plot
plt.show()

print("Canvas plot generated successfully!")
`);
  const [isExecuting, setIsExecuting] = useState(false);
  const [output, setOutput] = useState('');
  const [outputType, setOutputType] = useState<'text' | 'image' | 'error'>('text');
  const [lastExecuted, setLastExecuted] = useState<Date | null>(null);

  useEffect(() => {
    if (canvasRef.current && isVisible) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set canvas size
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        // Draw initial placeholder
        drawPlaceholder(ctx, canvas.width, canvas.height);
      }
    }
  }, [isVisible]);

  const drawPlaceholder = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Draw background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);
    
    // Draw border
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, width, height);
    
    // Draw placeholder text
    ctx.fillStyle = '#6c757d';
    ctx.font = '16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Run Python code to see visualization here', width / 2, height / 2 - 10);
    ctx.fillStyle = '#adb5bd';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('Click "Run Code" button to execute the canvas code', width / 2, height / 2 + 10);
  };

  const executeCanvasCode = async () => {
    if (!canvasCode.trim()) {
      toast({
        title: "No Code",
        description: "Please enter some Python code to execute",
        variant: "destructive"
      });
      return;
    }

    setIsExecuting(true);
    setOutput('');

    try {
      const { data, error } = await supabase.functions.invoke('python-compiler', {
        body: { 
          code: canvasCode,
          context: { canvas_mode: true }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      const result = data.output || data.error || 'No output';
      setOutput(result);
      setLastExecuted(new Date());

      // Determine output type
      if (data.error) {
        setOutputType('error');
        toast({
          title: "Execution Error",
          description: "Check the output for details",
          variant: "destructive"
        });
      } else if (result.includes('<img') || result.includes('data:image') || result.includes('.png') || result.includes('.jpg')) {
        setOutputType('image');
        toast({
          title: "Plot Generated!",
          description: "Your visualization has been created",
        });
        
        // If we have image data, try to draw it on canvas
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx && result.includes('data:image')) {
            const img = document.createElement('img');
            img.onload = () => {
              ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
              ctx.drawImage(img, 0, 0, canvasRef.current!.width, canvasRef.current!.height);
            };
            img.src = result.match(/data:image[^"]+/)?.[0] || '';
          }
        }
      } else {
        setOutputType('text');
        toast({
          title: "Code Executed",
          description: "Check the output below",
        });
      }

    } catch (error) {
      setOutput(`Error: ${error.message}`);
      setOutputType('error');
      toast({
        title: "Execution Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        drawPlaceholder(ctx, canvasRef.current.width, canvasRef.current.height);
      }
    }
    setOutput('');
    setOutputType('text');
    setLastExecuted(null);
    toast({
      title: "Canvas Cleared",
      description: "Ready for new visualizations",
    });
  };

  const loadExample = (exampleType: 'plot' | 'chart' | 'data') => {
    const examples = {
      plot: `# Interactive Line Plot Example
import matplotlib.pyplot as plt
import numpy as np

# Generate data
x = np.linspace(0, 2*np.pi, 100)
y1 = np.sin(x)
y2 = np.cos(x)
y3 = np.sin(2*x)

# Create the plot
plt.figure(figsize=(12, 8))
plt.plot(x, y1, 'b-', label='sin(x)', linewidth=2)
plt.plot(x, y2, 'r--', label='cos(x)', linewidth=2)
plt.plot(x, y3, 'g:', label='sin(2x)', linewidth=2)

plt.title('Trigonometric Functions Comparison', fontsize=16)
plt.xlabel('x (radians)')
plt.ylabel('y')
plt.legend()
plt.grid(True, alpha=0.3)
plt.axhline(y=0, color='k', linewidth=0.5)
plt.axvline(x=0, color='k', linewidth=0.5)

plt.show()`,

      chart: `# Interactive Bar Chart Example
import matplotlib.pyplot as plt
import numpy as np

# Sample data
categories = ['Python', 'JavaScript', 'Java', 'C++', 'Go', 'Rust']
popularity = [85, 75, 65, 45, 35, 25]
colors = ['#3776ab', '#f7df1e', '#ed8b00', '#00599c', '#00add8', '#ce422b']

# Create bar chart
plt.figure(figsize=(10, 6))
bars = plt.bar(categories, popularity, color=colors, alpha=0.8, edgecolor='black', linewidth=1)

# Add value labels on bars
for bar, value in zip(bars, popularity):
    plt.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1, 
             f'{value}%', ha='center', va='bottom', fontweight='bold')

plt.title('Programming Language Popularity 2024', fontsize=16, fontweight='bold')
plt.xlabel('Programming Languages')
plt.ylabel('Popularity (%)')
plt.ylim(0, 100)
plt.grid(axis='y', alpha=0.3)

plt.tight_layout()
plt.show()`,

      data: `# Data Visualization Example
import matplotlib.pyplot as plt
import numpy as np

# Generate sample dataset
np.random.seed(42)
n_points = 100

# Create random data with some correlation
x = np.random.randn(n_points)
y = 2 * x + np.random.randn(n_points) * 0.5
colors = np.random.rand(n_points)
sizes = 1000 * np.random.rand(n_points)

# Create the scatter plot
plt.figure(figsize=(10, 8))
scatter = plt.scatter(x, y, c=colors, s=sizes, alpha=0.6, cmap='viridis', edgecolors='black', linewidth=0.5)

plt.colorbar(scatter, label='Color Scale')
plt.title('Interactive Scatter Plot with Variable Size and Color', fontsize=16)
plt.xlabel('X Values')
plt.ylabel('Y Values')
plt.grid(True, alpha=0.3)

# Add trend line
z = np.polyfit(x, y, 1)
p = np.poly1d(z)
plt.plot(x, p(x), "r--", alpha=0.8, linewidth=2, label=f'Trend: y={z[0]:.2f}x+{z[1]:.2f}')
plt.legend()

plt.tight_layout()
plt.show()

print(f"Generated {n_points} data points with correlation coefficient: {np.corrcoef(x, y)[0,1]:.3f}")`
    };

    setCanvasCode(examples[exampleType]);
    toast({
      title: "Example Loaded",
      description: `${exampleType.charAt(0).toUpperCase() + exampleType.slice(1)} example loaded. Click "Run Code" to execute.`,
    });
  };

  if (!isVisible) return null;

  return (
    <Card className={`${isFullscreen ? 'fixed inset-4 z-50' : 'h-full'} bg-white border border-gray-200`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-lg flex items-center">
              <Palette className="h-5 w-5 mr-2 text-purple-600" />
              Interactive Canvas
            </CardTitle>
            {isExecuting && (
              <Badge variant="outline" className="text-orange-600 border-orange-300 animate-pulse">
                Executing...
              </Badge>
            )}
            {lastExecuted && (
              <Badge variant="outline" className="text-green-600 border-green-300">
                Last run: {lastExecuted.toLocaleTimeString()}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              Python Visualization
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-7 w-7 p-0"
            >
              {isFullscreen ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onToggle}
              className="h-7 w-7 p-0"
            >
              <Minimize2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        {/* Code Editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Canvas Code:</label>
            <div className="flex space-x-1">
              <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => loadExample('plot')}>
                <BarChart3 className="h-3 w-3 mr-1" />
                Plot
              </Button>
              <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => loadExample('chart')}>
                <BarChart3 className="h-3 w-3 mr-1" />
                Chart
              </Button>
              <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => loadExample('data')}>
                <Image className="h-3 w-3 mr-1" />
                Data
              </Button>
            </div>
          </div>
          <Textarea
            value={canvasCode}
            onChange={(e) => setCanvasCode(e.target.value)}
            placeholder="# Enter your Python visualization code here..."
            className="font-mono text-sm resize-none bg-gray-50"
            rows={8}
          />
        </div>

        {/* Canvas Toolbar */}
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Button 
              size="sm" 
              onClick={executeCanvasCode}
              disabled={isExecuting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Play className="h-3 w-3 mr-1" />
              {isExecuting ? 'Running...' : 'Run Code'}
            </Button>
            <Button size="sm" variant="outline" onClick={clearCanvas}>
              <RotateCcw className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" className="h-7 text-xs">
              <Settings className="h-3 w-3 mr-1" />
              Settings
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs">
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="relative bg-white border border-gray-200 rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full cursor-crosshair"
            style={{ height: isFullscreen ? '50vh' : '16rem' }}
          />
          
          <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
            Canvas Ready
          </div>
        </div>

        {/* Output Display */}
        {output && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Output:</label>
            {outputType === 'error' ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <pre className="text-red-800 text-sm whitespace-pre-wrap font-mono">
                  {output}
                </pre>
              </div>
            ) : outputType === 'image' ? (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <div dangerouslySetInnerHTML={{ __html: output }} />
              </div>
            ) : (
              <div className="p-3 bg-gray-900 text-green-400 rounded-md border border-gray-700">
                <pre className="whitespace-pre-wrap font-mono text-sm">
                  {output}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Canvas Info */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div className="text-blue-800">
              <strong>Status:</strong> {isExecuting ? 'Executing code...' : 'Ready for visualization'}
            </div>
            <div className="text-blue-600 text-xs">
              Interactive Python Canvas
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotebookCanvas;