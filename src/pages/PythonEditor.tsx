import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  Play, 
  Save, 
  FileText, 
  Home,
  User,
  LogOut,
  Terminal,
  Clock,
  Maximize2,
  Minimize2,
  FolderOpen,
  Download,
  Upload,
  BookOpen,
  Code,
  RotateCcw,
  Settings,
  Zap,
  Trash2
} from 'lucide-react';

const PythonEditor = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showTerminal, setShowTerminal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [code, setCode] = useState(`# Welcome to Python Editor!
# Write your Python code here and press Run to execute

print("Hello, Python Editor!")

# Try some basic operations
name = "Python Developer"
print(f"Welcome, {name}!")

# Mathematical operations
import math
result = math.sqrt(25)
print(f"Square root of 25 = {result}")

# Create a list and iterate
numbers = [1, 2, 3, 4, 5]
squared = [x**2 for x in numbers]
print(f"Squared numbers: {squared}")
`);
  const [output, setOutput] = useState('');
  const [outputType, setOutputType] = useState<'text' | 'error' | 'html'>('text');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionTime, setExecutionTime] = useState(0);
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    'Python 3.9.0 - Interactive Terminal',
    'Type Python code below and press Enter to execute',
    '>>> '
  ]);
  const [fileName, setFileName] = useState('untitled.py');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [savedFiles, setSavedFiles] = useState<Array<{id: string, name: string, content: string, lastModified: Date}>>([]);
  const [showFileManager, setShowFileManager] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Enhanced Python execution
  const executePythonCode = async (codeToExecute: string): Promise<{ output: string, outputType: string, executionTime: number }> => {
    try {
      const startTime = Date.now();
      const { data, error } = await supabase.functions.invoke('python-compiler', {
        body: { 
          code: codeToExecute,
          session_id: 'editor'
        }
      });

      const endTime = Date.now();
      const execTime = endTime - startTime;

      if (error) {
        throw new Error(error.message);
      }

      // Determine output type
      let outputType = 'text';
      if (data.error) {
        outputType = 'error';
      } else if (data.output && data.output.includes('<')) {
        outputType = 'html';
      }

      return {
        output: data.output || data.error || 'No output',
        outputType,
        executionTime: execTime
      };
    } catch (error) {
      return {
        output: `Error: ${error.message}`,
        outputType: 'error',
        executionTime: 0
      };
    }
  };

  const runCode = async () => {
    if (!code.trim()) {
      toast({
        title: "No Code",
        description: "Please write some Python code to execute",
        variant: "destructive"
      });
      return;
    }

    setIsExecuting(true);
    setOutput('');
    
    try {
      const result = await executePythonCode(code);
      setOutput(result.output);
      setOutputType(result.outputType as any);
      setExecutionTime(result.executionTime);
      
      toast({
        title: "Code Executed",
        description: `Execution completed in ${result.executionTime}ms`
      });
    } catch (error) {
      setOutput(`Error: ${error.message}`);
      setOutputType('error');
      toast({
        title: "Execution Error",
        description: "Failed to execute code",
        variant: "destructive"
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const executeTerminalCommand = async (command: string) => {
    setTerminalHistory(prev => [...prev, `>>> ${command}`]);
    
    try {
      const result = await executePythonCode(command);
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

  const saveFile = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "File Saved",
      description: `${fileName} has been downloaded`
    });
  };

  const saveToWorkspace = () => {
    const newFile = {
      id: Date.now().toString(),
      name: fileName,
      content: code,
      lastModified: new Date()
    };
    
    setSavedFiles(prev => {
      const existingIndex = prev.findIndex(f => f.name === fileName);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newFile;
        return updated;
      }
      return [...prev, newFile];
    });
    
    localStorage.setItem('python-editor-files', JSON.stringify([...savedFiles.filter(f => f.name !== fileName), newFile]));
    
    toast({
      title: "File Saved to Workspace",
      description: `${fileName} saved to local workspace`
    });
  };

  const loadFromWorkspace = (file: {id: string, name: string, content: string, lastModified: Date}) => {
    setCode(file.content);
    setFileName(file.name);
    setShowFileManager(false);
    
    toast({
      title: "File Loaded",
      description: `${file.name} loaded from workspace`
    });
  };

  const deleteFromWorkspace = (fileId: string) => {
    setSavedFiles(prev => prev.filter(f => f.id !== fileId));
    const updatedFiles = savedFiles.filter(f => f.id !== fileId);
    localStorage.setItem('python-editor-files', JSON.stringify(updatedFiles));
    
    toast({
      title: "File Deleted",
      description: "File removed from workspace"
    });
  };

  const loadFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCode(content);
      setFileName(file.name);
      toast({
        title: "File Loaded",
        description: `${file.name} loaded successfully`
      });
    };
    reader.readAsText(file);
  };

  const clearCode = () => {
    setCode('# New Python file\n');
    setOutput('');
    setFileName('untitled.py');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      runCode();
    } else if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      saveFile();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
    
    // Load saved files from localStorage
    const saved = localStorage.getItem('python-editor-files');
    if (saved) {
      try {
        setSavedFiles(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading saved files:', error);
      }
    }
  }, []);

  return (
    <div className={`min-h-screen ${isFullscreen ? 'fixed inset-0 z-50' : ''} bg-gradient-to-br from-[hsl(var(--pictoblox-purple))] to-[hsl(var(--pictoblox-purple-dark))]`}>
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={() => navigate('/')}
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={() => navigate('/py-notebook')}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Notebook
            </Button>
            <h1 className="text-xl font-bold text-white flex items-center">
              <Code className="h-5 w-5 mr-2" />
              Python Editor
            </h1>
            <Badge variant="secondary" className="bg-white/20 text-white">
              {fileName}
            </Badge>
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

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="bg-white/95 backdrop-blur-sm p-4 border-b border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  onClick={runCode}
                  disabled={isExecuting}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isExecuting ? (
                    <>
                      <Zap className="h-4 w-4 mr-1 animate-pulse" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-1" />
                      Run Code
                    </>
                  )}
                </Button>
                <Button
                  onClick={saveFile}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                <Button
                  onClick={saveToWorkspace}
                  variant="outline"
                  size="sm"
                  className="bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save to Workspace
                </Button>
                <Button
                  onClick={() => setShowFileManager(!showFileManager)}
                  variant="outline"
                  size="sm"
                  className={showFileManager ? "bg-blue-100 border-blue-400" : ""}
                >
                  <FolderOpen className="h-4 w-4 mr-1" />
                  Files ({savedFiles.length})
                </Button>
                <label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    asChild
                  >
                    <span>
                      <Upload className="h-4 w-4 mr-1" />
                      Load
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept=".py,.txt"
                    onChange={loadFile}
                    className="hidden"
                  />
                </label>
                <Button
                  onClick={clearCode}
                  variant="outline"
                  size="sm"
                  className="text-orange-600 border-orange-300 hover:bg-orange-50"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Clear
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
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  variant="outline"
                  size="sm"
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                {executionTime > 0 && (
                  <Badge variant="outline" className="text-blue-600 border-blue-300">
                    <Clock className="h-3 w-3 mr-1" />
                    {executionTime}ms
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* File Manager Sidebar */}
          {showFileManager && (
            <div className="bg-white/95 backdrop-blur-sm border-b border-white/20 p-4">
              <Card className="max-h-48 overflow-y-auto">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Workspace Files</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {savedFiles.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4 text-center">No saved files</p>
                  ) : (
                    <div className="space-y-2">
                      {savedFiles.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(file.lastModified).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex space-x-1">
                            <Button
                              onClick={() => loadFromWorkspace(file)}
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                            >
                              <FolderOpen className="h-3 w-3" />
                            </Button>
                            <Button
                              onClick={() => deleteFromWorkspace(file.id)}
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Editor and Output Layout */}
          <div className="flex-1 overflow-hidden p-6">
            <div className={`grid gap-6 h-full ${showTerminal ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 lg:grid-cols-2'}`}>
              {/* Code Editor */}
              <Card className="flex flex-col bg-white/95 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <FileText className="h-5 w-5 mr-2 text-blue-600" />
                    Code Editor
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pt-0">
                  <Textarea
                    ref={textareaRef}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="# Write your Python code here...
# Press Ctrl+Enter to run
# Press Ctrl+S to save"
                    className="w-full h-full min-h-96 font-mono text-sm resize-none border-0 focus:ring-0 bg-gray-50"
                    style={{ 
                      fontSize: `${fontSize}px`,
                      lineHeight: '1.5'
                    }}
                  />
                </CardContent>
              </Card>

              {/* Output Panel */}
              <div className="flex flex-col gap-6">
                {/* Code Output */}
                <Card className="flex-1 bg-white/95 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-lg">
                      <Terminal className="h-5 w-5 mr-2 text-green-600" />
                      Output
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-48 overflow-y-auto">
                      {outputType === 'error' ? (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                          <div className="text-red-600 text-xs mb-1 font-semibold">Error:</div>
                          <pre className="text-red-800 text-sm whitespace-pre-wrap font-mono">
                            {output}
                          </pre>
                        </div>
                      ) : outputType === 'html' ? (
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                          <div className="text-gray-600 text-xs mb-2">HTML Output:</div>
                          <div dangerouslySetInnerHTML={{ __html: output }} />
                        </div>
                      ) : (
                        <div className="p-3 bg-gray-900 text-green-400 rounded-md border border-gray-700">
                          <div className="text-gray-400 text-xs mb-1">Output:</div>
                          <pre className="whitespace-pre-wrap font-mono text-sm">
                            {output || 'Run your code to see output here...'}
                          </pre>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Terminal Panel */}
                {showTerminal && (
                  <Card className="bg-gray-900 text-green-400 border-gray-700">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg flex items-center text-green-400">
                          <Terminal className="h-4 w-4 mr-2" />
                          Interactive Terminal
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
                      <div className="bg-black rounded-md p-3 font-mono text-sm h-32 overflow-y-auto mb-3">
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
              </div>
            </div>
          </div>

          {/* Help Section */}
          {!showTerminal && (
            <div className="p-6">
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-800">🐍 Python Editor Guide</CardTitle>
                </CardHeader>
                <CardContent className="text-blue-700">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <h4 className="font-semibold mb-2">Keyboard Shortcuts:</h4>
                      <ul className="space-y-1">
                        <li>• <kbd className="bg-blue-200 px-1 rounded">Ctrl+Enter</kbd> - Run code</li>
                        <li>• <kbd className="bg-blue-200 px-1 rounded">Ctrl+S</kbd> - Save file</li>
                        <li>• Switch to Notebook for cells</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Features:</h4>
                      <ul className="space-y-1">
                        <li>• Full Python code editor</li>
                        <li>• Real-time execution</li>
                        <li>• File save/load support</li>
                        <li>• Interactive terminal</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Try These Examples:</h4>
                      <ul className="space-y-1">
                        <li>• <code>print("Hello World!")</code></li>
                        <li>• <code>for i in range(5): print(i)</code></li>
                        <li>• <code>import math; print(math.pi)</code></li>
                        <li>• File operations and more!</li>
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

export default PythonEditor;