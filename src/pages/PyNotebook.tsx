import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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
  Minimize2
} from 'lucide-react';

interface NotebookCell {
  id: string;
  type: 'code' | 'markdown';
  content: string;
  output?: string;
  executionTime?: number;
  isExecuting?: boolean;
}

const PyNotebook = () => {
  const { user, signOut } = useAuth();
  const [showTerminal, setShowTerminal] = useState(false);
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
      content: '# Welcome to Python Notebook!\nprint("Hello, Python!")\n\n# Try some basic calculations\nresult = 2 + 2\nprint(f"2 + 2 = {result}")',
      output: ''
    }
  ]);
  const [activeCell, setActiveCell] = useState<string | null>('1');
  const textareaRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});

  // Online Python execution using Supabase Edge Function
  const executePythonCode = async (code: string): Promise<{ output: string, executionTime: number }> => {
    try {
      const { data, error } = await supabase.functions.invoke('python-compiler', {
        body: { code }
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        output: data.output || data.error || 'No output',
        executionTime: data.execution_time || 0
      };
    } catch (error) {
      return {
        output: `Error: ${error.message}`,
        executionTime: 0
      };
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

  const addCell = (type: 'code' | 'markdown' = 'code') => {
    const newCell: NotebookCell = {
      id: Date.now().toString(),
      type,
      content: type === 'code' ? '# New cell\n' : '# Markdown Cell\nWrite your markdown here...',
      output: ''
    };
    setCells([...cells, newCell]);
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

    setCells(cells.map(c => 
      c.id === cellId ? { ...c, isExecuting: true } : c
    ));

    try {
      const result = await executePythonCode(cell.content);
      setCells(cells.map(c => 
        c.id === cellId ? { 
          ...c, 
          output: result.output, 
          executionTime: result.executionTime,
          isExecuting: false 
        } : c
      ));
    } catch (error) {
      setCells(cells.map(c => 
        c.id === cellId ? { 
          ...c, 
          output: `Error: ${error}`, 
          executionTime: 0,
          isExecuting: false 
        } : c
      ));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, cellId: string) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      executeCell(cellId);
    }
  };

  useEffect(() => {
    if (activeCell && textareaRefs.current[activeCell]) {
      textareaRefs.current[activeCell]?.focus();
    }
  }, [activeCell]);

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

      {/* Notebook Content */}
      <div className="max-w-4xl mx-auto p-6">
        {/* Toolbar */}
        <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 mb-6 border border-white/20">
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
              onClick={() => setShowTerminal(!showTerminal)}
              variant={showTerminal ? "default" : "outline"}
              size="sm"
              className={showTerminal ? "bg-[hsl(var(--pictoblox-purple))]" : ""}
            >
              <Terminal className="h-4 w-4 mr-1" />
              Terminal
            </Button>
            <div className="flex-1" />
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              {cells.length} cells
            </Badge>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className={`grid gap-6 ${showTerminal ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Notebook Cells */}
          <div className="space-y-4">
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
                      {cell.type === 'code' ? 'Code' : 'Markdown'} [{index + 1}]
                    </Badge>
                    {cell.isExecuting && (
                      <Badge variant="outline" className="text-orange-600 border-orange-300">
                        Running...
                      </Badge>
                    )}
                    {cell.executionTime && cell.executionTime > 0 && (
                      <Badge variant="outline" className="text-blue-600 border-blue-300">
                        <Clock className="h-3 w-3 mr-1" />
                        {cell.executionTime.toFixed(0)}ms
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
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
                        Run
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
                      ? "# Write your Python code here...\n# Press Ctrl+Enter to run"
                      : "Write your markdown here..."
                  }
                  className="min-h-24 font-mono text-sm resize-none border-0 focus:ring-0 bg-gray-50"
                  style={{ 
                    height: Math.max(96, cell.content.split('\n').length * 24 + 48) + 'px'
                  }}
                />
                
                {/* Output for code cells */}
                {cell.type === 'code' && cell.output !== undefined && (
                  <div className="mt-3 p-3 bg-gray-900 text-green-400 rounded-md font-mono text-sm">
                    <div className="text-gray-500 text-xs mb-1">Output:</div>
                    <pre className="whitespace-pre-wrap">
                      {cell.output || '(no output)'}
                    </pre>
                  </div>
                )}
              </CardContent>
              </Card>
            ))}
          </div>

          {/* Terminal Panel */}
          {showTerminal && (
            <div className="lg:sticky lg:top-6 h-fit">
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
            </div>
          )}
        </div>

        {/* Help Section */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">🐍 Python Notebook Guide</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Keyboard Shortcuts:</h4>
                <ul className="space-y-1">
                  <li>• <kbd className="bg-blue-200 px-1 rounded">Ctrl+Enter</kbd> - Run cell</li>
                  <li>• Click cell to select/edit</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Try These Examples:</h4>
                <ul className="space-y-1">
                  <li>• <code>print("Hello World!")</code></li>
                  <li>• <code>for i in range(5): print(i)</code></li>
                  <li>• <code>import math</code></li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PyNotebook;