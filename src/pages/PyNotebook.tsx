import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import NotebookSidebar from '@/components/NotebookSidebar';
import NotebookCanvas from '@/components/NotebookCanvas';
import { 
  Play, 
  Plus, 
  Trash2, 
  Save, 
  FileText, 
  Home,
  User,
  LogOut,
  Terminal,
  Clock,
  Maximize2,
  Minimize2,
  Layout,
  Settings,
  Palette
} from 'lucide-react';

interface NotebookCell {
  id: string;
  type: 'code' | 'markdown';
  content: string;
  output?: string;
  outputType?: 'text' | 'image' | 'html' | 'error';
  executionTime?: number;
  isExecuting?: boolean;
  executionCount?: number;
  lastExecuted?: Date;
}

const PyNotebook = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [showTerminal, setShowTerminal] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    'Python 3.9.0 - Interactive Terminal',
    'Type Python code below and press Enter to execute',
    '>>> '
  ]);
  const [cells, setCells] = useState<NotebookCell[]>([
    {
      id: '1',
      type: 'code',
      content: '# Welcome to Interactive Python Notebook!\n# Try running this cell to see the output\nprint("Hello, Python!")\n\n# Variables persist between cells\nname = "Python Learner"\nprint(f"Welcome, {name}!")\n\n# Try some calculations\nimport math\nresult = math.sqrt(16)\nprint(f"Square root of 16 = {result}")',
      output: '',
      executionCount: 0
    },
    {
      id: '2', 
      type: 'code',
      content: '# Variables from previous cells are available\nprint(f"Your name is: {name}")\n\n# Create a simple visualization\nimport matplotlib.pyplot as plt\nimport numpy as np\n\n# Generate data\nx = np.linspace(0, 10, 50)\ny = np.sin(x)\n\n# Create plot\nplt.figure(figsize=(8, 5))\nplt.plot(x, y, "b-", linewidth=2)\nplt.title("Sine Wave")\nplt.xlabel("x")\nplt.ylabel("sin(x)")\nplt.grid(True)\nplt.show()',
      output: '',
      executionCount: 0
    }
  ]);
  const [globalExecutionCount, setGlobalExecutionCount] = useState(1);
  const [sessionVariables, setSessionVariables] = useState<Record<string, any>>({});
  const [activeCell, setActiveCell] = useState<string | null>('1');
  const textareaRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});

  // Enhanced Python execution with session support
  const executePythonCode = async (code: string, cellId: string): Promise<{ output: string, outputType: string, executionTime: number, variables?: Record<string, any> }> => {
    try {
      const { data, error } = await supabase.functions.invoke('python-compiler', {
        body: { 
          code,
          session_id: cellId,
          context: sessionVariables
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Update session variables if returned
      if (data.variables) {
        setSessionVariables(prev => ({ ...prev, ...data.variables }));
      }

      // Determine output type
      let outputType = 'text';
      if (data.error) {
        outputType = 'error';
      } else if (data.output && (data.output.includes('<img') || data.output.includes('data:image'))) {
        outputType = 'image';
      } else if (data.output && data.output.includes('<')) {
        outputType = 'html';
      }

      return {
        output: data.output || data.error || 'No output',
        outputType,
        executionTime: data.execution_time || 0,
        variables: data.variables
      };
    } catch (error) {
      return {
        output: `Error: ${error.message}`,
        outputType: 'error',
        executionTime: 0
      };
    }
  };

  const executeTerminalCommand = async (command: string) => {
    setTerminalHistory(prev => [...prev, `>>> ${command}`]);
    
    try {
      const result = await executePythonCode(command, 'terminal');
      setTerminalHistory(prev => [...prev, result.output, '>>> ']);
    } catch (error) {
      setTerminalHistory(prev => [...prev, `Error: ${error.message}`, '>>> ']);
    }
    setTerminalInput('');
  };

  const handleTerminalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && terminalInput.trim()) {
      executeTerminalCommand(terminalInput.trim());
    }
  };

  const addCell = (type: 'code' | 'markdown' = 'code', index?: number) => {
    const newCell: NotebookCell = {
      id: Date.now().toString(),
      type,
      content: type === 'code' ? '# New code cell\n' : '# Markdown Cell\nWrite your markdown here...',
      output: '',
      executionCount: 0
    };
    
    if (index !== undefined) {
      const newCells = [...cells];
      newCells.splice(index + 1, 0, newCell);
      setCells(newCells);
    } else {
      setCells([...cells, newCell]);
    }
    setActiveCell(newCell.id);
  };

  const deleteCell = (cellId: string) => {
    if (cells.length === 1) return; // Keep at least one cell
    setCells(cells.filter(cell => cell.id !== cellId));
    if (activeCell === cellId) {
      setActiveCell(cells[0]?.id || null);
    }
  };

  const updateCellContent = (cellId: string, content: string) => {
    setCells(cells.map(cell => 
      cell.id === cellId ? { ...cell, content } : cell
    ));
  };

  const executeCell = async (cellId: string) => {
    const cell = cells.find(c => c.id === cellId);
    if (!cell || cell.type !== 'code') return;

    // Update cell to executing state
    setCells(cells.map(c => 
      c.id === cellId ? { ...c, isExecuting: true } : c
    ));

    try {
      const result = await executePythonCode(cell.content, cellId);
      const executionCount = globalExecutionCount;
      setGlobalExecutionCount(prev => prev + 1);
      
      setCells(cells.map(c => 
        c.id === cellId ? { 
          ...c, 
          output: result.output, 
          outputType: result.outputType as any,
          executionTime: result.executionTime,
          executionCount,
          lastExecuted: new Date(),
          isExecuting: false 
        } : c
      ));
    } catch (error) {
      setCells(cells.map(c => 
        c.id === cellId ? { 
          ...c, 
          output: `Error: ${error}`, 
          outputType: 'error' as any,
          executionTime: 0,
          isExecuting: false 
        } : c
      ));
    }
  };

  const executeAllCells = async () => {
    for (const cell of cells) {
      if (cell.type === 'code') {
        await executeCell(cell.id);
        // Small delay between executions
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  };

  const clearAllOutputs = () => {
    setCells(cells.map(cell => ({ 
      ...cell, 
      output: '', 
      outputType: undefined,
      executionCount: 0 
    })));
    setSessionVariables({});
    setGlobalExecutionCount(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent, cellId: string) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      executeCell(cellId);
    } else if (e.shiftKey && e.key === 'Enter') {
      e.preventDefault();
      executeCell(cellId);
      const currentIndex = cells.findIndex(c => c.id === cellId);
      if (currentIndex < cells.length - 1) {
        setActiveCell(cells[currentIndex + 1].id);
      } else {
        addCell('code', currentIndex);
      }
    }
  };

  useEffect(() => {
    if (activeCell && textareaRefs.current[activeCell]) {
      textareaRefs.current[activeCell]?.focus();
    }
  }, [activeCell]);

  const handleFileSelect = (file: any) => {
    console.log('File selected:', file);
  };

  const handleLoadContent = (content: string, fileName: string) => {
    // Parse content into cells based on file type
    if (fileName.endsWith('.ipynb') || fileName.endsWith('.py')) {
      const newCells = content.split('\n\n').map((cellContent, index) => ({
        id: `loaded-${Date.now()}-${index}`,
        type: 'code' as const,
        content: cellContent.trim(),
        output: '',
        executionCount: 0
      }));
      
      setCells(newCells);
      setActiveCell(newCells[0]?.id || null);
      toast({
        title: "Content Loaded",
        description: `${fileName} loaded with ${newCells.length} cells`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--pictoblox-purple))] to-[hsl(var(--pictoblox-purple-dark))]">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={() => window.history.back()}
            >
              <Home className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-xl font-bold text-white flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Python Notebook
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-white text-sm">
              <User className="h-4 w-4 inline mr-1" />
              {user?.email}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="text-white hover:bg-white/20"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {showSidebar && (
          <NotebookSidebar 
            onFileSelect={handleFileSelect} 
            onLoadContent={handleLoadContent}
          />
        )}

        {/* Notebook Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Enhanced Toolbar */}
          <div className="bg-white/95 backdrop-blur-sm p-4 border-b border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => addCell('code')}
                  size="sm"
                  className="bg-[hsl(var(--pictoblox-blue))] hover:bg-[hsl(var(--pictoblox-blue))/80]"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Code
                </Button>
                <Button
                  onClick={() => addCell('markdown')}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Markdown
                </Button>
                <Button
                  onClick={executeAllCells}
                  variant="outline"
                  size="sm"
                  className="text-green-600 border-green-300 hover:bg-green-50"
                >
                  <Play className="h-4 w-4 mr-1" />
                  Run All
                </Button>
                <Button
                  onClick={clearAllOutputs}
                  variant="outline"
                  size="sm"
                  className="text-orange-600 border-orange-300 hover:bg-orange-50"
                >
                  Clear Outputs
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setShowTerminal(!showTerminal)}
                  variant={showTerminal ? "default" : "outline"}
                  size="sm"
                  className={showTerminal ? "bg-[hsl(var(--pictoblox-purple))]" : ""}
                >
                  <Terminal className="h-4 w-4 mr-1" />
                  Terminal
                </Button>
                <Button
                  onClick={() => setShowCanvas(!showCanvas)}
                  variant={showCanvas ? "default" : "outline"}
                  size="sm"
                  className={showCanvas ? "bg-[hsl(var(--pictoblox-blue))]" : ""}
                >
                  <Palette className="h-4 w-4 mr-1" />
                  Canvas
                </Button>
                <Button
                  onClick={() => setShowSidebar(!showSidebar)}
                  variant={showSidebar ? "default" : "outline"}
                  size="sm"
                >
                  <Layout className="h-4 w-4 mr-1" />
                  Files
                </Button>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  {cells.length} cells
                </Badge>
                <Badge variant="outline" className="bg-blue-100 text-blue-700">
                  Session: {Object.keys(sessionVariables).length} vars
                </Badge>
              </div>
            </div>
          </div>

          {/* Main Content Layout */}
          <div className="flex-1 overflow-hidden p-6">
            <div className={`grid gap-6 h-full ${showTerminal || showCanvas ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
              {/* Notebook Cells */}
              <div className="space-y-4 overflow-y-auto">
                {cells.map((cell, index) => (
                  <Card
                    key={cell.id}
                    className={`border-2 transition-all duration-200 ${
                      activeCell === cell.id 
                        ? 'border-[hsl(var(--pictoblox-purple))] shadow-lg' 
                        : 'border-gray-200 hover:border-gray-300'
                    } bg-white/95 backdrop-blur-sm`}
                    onClick={() => setActiveCell(cell.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={cell.type === 'code' ? 'default' : 'secondary'}
                            className={cell.type === 'code' ? 'bg-[hsl(var(--pictoblox-blue))]' : ''}
                          >
                            {cell.type === 'code' ? `Code [${cell.executionCount || ' '}]` : 'Markdown'} [{index + 1}]
                          </Badge>
                          {cell.isExecuting && (
                            <Badge variant="outline" className="text-orange-600 border-orange-300 animate-pulse">
                              Executing...
                            </Badge>
                          )}
                          {cell.executionTime && cell.executionTime > 0 && (
                            <Badge variant="outline" className="text-blue-600 border-blue-300">
                              <Clock className="h-3 w-3 mr-1" />
                              {cell.executionTime.toFixed(0)}ms
                            </Badge>
                          )}
                          {cell.lastExecuted && (
                            <Badge variant="outline" className="text-gray-600 border-gray-300 text-xs">
                              {cell.lastExecuted.toLocaleTimeString()}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                const currentIndex = cells.findIndex(c => c.id === cell.id);
                                addCell('code', currentIndex);
                              }}
                              size="sm"
                              variant="outline"
                              className="text-blue-600 border-blue-300 hover:bg-blue-50 mr-1"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          {cell.type === 'code' && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                executeCell(cell.id);
                              }}
                              size="sm"
                              variant="outline"
                              disabled={cell.isExecuting}
                              className="text-green-600 border-green-300 hover:bg-green-50"
                            >
                              <Play className="h-3 w-3 mr-1" />
                              {cell.isExecuting ? 'Running...' : 'Run'}
                            </Button>
                          )}
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCell(cell.id);
                            }}
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <Textarea
                        ref={(el) => (textareaRefs.current[cell.id] = el)}
                        value={cell.content}
                        onChange={(e) => updateCellContent(cell.id, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, cell.id)}
                        placeholder={
                          cell.type === 'code' 
                            ? "# Write your Python code here...\n# Press Ctrl+Enter to run\n# Press Shift+Enter to run and create new cell"
                            : "Write your markdown here..."
                        }
                        className="min-h-24 font-mono text-sm resize-none border-0 focus:ring-0 bg-gray-50"
                        style={{ 
                          height: Math.max(96, cell.content.split('\n').length * 24 + 48) + 'px'
                        }}
                      />
                      
                      {/* Enhanced Output Display */}
                      {cell.type === 'code' && cell.output !== undefined && (
                        <div className="mt-3">
                          {cell.outputType === 'error' ? (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                              <div className="text-red-600 text-xs mb-1 font-semibold">Error:</div>
                              <pre className="text-red-800 text-sm whitespace-pre-wrap font-mono">
                                {cell.output}
                              </pre>
                            </div>
                          ) : cell.outputType === 'image' ? (
                            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                              <div className="text-gray-600 text-xs mb-2">Output:</div>
                              <div dangerouslySetInnerHTML={{ __html: cell.output }} />
                            </div>
                          ) : cell.outputType === 'html' ? (
                            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                              <div className="text-gray-600 text-xs mb-2">HTML Output:</div>
                              <div dangerouslySetInnerHTML={{ __html: cell.output }} />
                            </div>
                          ) : (
                            <div className="p-3 bg-gray-900 text-green-400 rounded-md border border-gray-700">
                              <div className="text-gray-400 text-xs mb-1">Output:</div>
                              <pre className="whitespace-pre-wrap font-mono text-sm">
                                {cell.output || '(no output)'}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Right Panel */}
              {(showTerminal || showCanvas) && (
                <div className="flex flex-col gap-6 overflow-y-auto">
                  {/* Terminal Panel */}
                  {showTerminal && (
                    <Card className="bg-gray-900 text-green-400 border-gray-700 max-h-96">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg flex items-center text-green-400">
                            <Terminal className="h-4 w-4 mr-2" />
                            Python Terminal
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowTerminal(false)}
                            className="text-green-400 hover:text-green-300 hover:bg-gray-800"
                          >
                            <Minimize2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="bg-black rounded-md p-3 font-mono text-sm h-64 overflow-y-auto mb-3">
                          {terminalHistory.map((line, index) => (
                            <div key={index} className={line.startsWith('>>>') ? 'text-blue-400' : 'text-green-400'}>
                              {line}
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-400">{'>>>'}</span>
                          <Input
                            value={terminalInput}
                            onChange={(e) => setTerminalInput(e.target.value)}
                            onKeyDown={handleTerminalKeyDown}
                            placeholder="Type Python code here..."
                            className="bg-gray-800 border-gray-600 text-green-400 font-mono text-sm"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Canvas Panel */}
                  {showCanvas && (
                    <NotebookCanvas 
                      isVisible={showCanvas} 
                      onToggle={() => setShowCanvas(false)} 
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Help Section */}
          {!showTerminal && !showCanvas && (
            <div className="p-6">
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-800">🐍 Interactive Python Notebook Guide</CardTitle>
                </CardHeader>
                <CardContent className="text-blue-700">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <h4 className="font-semibold mb-2">Keyboard Shortcuts:</h4>
                      <ul className="space-y-1">
                        <li>• <kbd className="bg-blue-200 px-1 rounded">Ctrl+Enter</kbd> - Run cell</li>
                        <li>• <kbd className="bg-blue-200 px-1 rounded">Shift+Enter</kbd> - Run cell & create new</li>
                        <li>• Click cell to select/edit</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Features:</h4>
                      <ul className="space-y-1">
                        <li>• Variables persist between cells</li>
                        <li>• Rich output display (text, images, HTML)</li>
                        <li>• Execution count tracking</li>
                        <li>• Real-time collaboration</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Try These Examples:</h4>
                      <ul className="space-y-1">
                        <li>• <code>print("Hello World!")</code></li>
                        <li>• <code>import matplotlib.pyplot as plt</code></li>
                        <li>• <code>import numpy as np</code></li>
                        <li>• <code>name = "Your Name"</code></li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PyNotebook;