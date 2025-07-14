import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import ScratchBlocks, { ScratchBlock } from './ScratchBlocks';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  Square, 
  RotateCcw, 
  Save, 
  Upload,
  Download,
  Palette,
  Mouse,
  Volume2,
  Zap,
  Flag,
  Trash2,
  Copy,
  Box,
  Circle,
  Move,
  Eye,
  Search,
  Plus,
  Image as ImageIcon,
  Code,
  FileText,
  Star,
  Sparkles
} from 'lucide-react';

interface DroppedBlock extends ScratchBlock {
  scriptId: string;
  position: { x: number; y: number };
  connectedTo?: string;
  uniqueId: string;
  parameterValues?: Record<string, any>;
}

interface Sprite {
  id: string;
  name: string;
  x: number;
  y: number;
  rotation: number;
  size: number;
  visible: boolean;
  costume: string;
}

interface Costume {
  id: string;
  name: string;
  dataUrl: string;
}

interface Backdrop {
  id: string;
  name: string;
  dataUrl: string;
}

const EnhancedVisualCoding = () => {
  const { toast } = useToast();
  const [scripts, setScripts] = useState<DroppedBlock[]>([]);
  const [sprites, setSprites] = useState<Sprite[]>([
    {
      id: 'sprite1',
      name: 'Cat',
      x: 0,
      y: 0,
      rotation: 90,
      size: 100,
      visible: true,
      costume: 'cat1'
    }
  ]);
  const [currentSprite, setCurrentSprite] = useState<Sprite | null>(sprites[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const [costumes, setCostumes] = useState<Costume[]>([
    { id: 'cat1', name: 'Cat 1', dataUrl: 'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=100&h=100&fit=crop' },
    { id: 'cat2', name: 'Cat 2', dataUrl: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=100&h=100&fit=crop' }
  ]);
  const [backdrops, setBackdrops] = useState<Backdrop[]>([
    { id: 'default', name: 'Default', dataUrl: '#87CEEB' },
    { id: 'space', name: 'Space', dataUrl: '#000015' }
  ]);
  const [currentBackdrop, setCurrentBackdrop] = useState('default');
  const [showCostumeDialog, setShowCostumeDialog] = useState(false);
  const [showBackdropDialog, setShowBackdropDialog] = useState(false);
  const [showSpriteDialog, setShowSpriteDialog] = useState(false);
  const [draggedBlock, setDraggedBlock] = useState<ScratchBlock | null>(null);
  const scriptAreaRef = useRef<HTMLDivElement>(null);

  // Create drag and drop functionality
  const handleBlockDragStart = (e: React.DragEvent, block: ScratchBlock) => {
    setDraggedBlock(block);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleScriptAreaDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleScriptAreaDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedBlock || !currentSprite) return;

    const rect = scriptAreaRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const droppedBlock: DroppedBlock = {
      ...draggedBlock,
      scriptId: currentSprite.id,
      position: { x, y },
      uniqueId: `${draggedBlock.id}-${Date.now()}`,
      parameterValues: {}
    };

    setScripts(prev => [...prev, droppedBlock]);
    setDraggedBlock(null);
    
    toast({
      title: "Block added!",
      description: `${draggedBlock.name} has been added to the script.`,
    });
  };

  // Execute script functionality
  const executeScript = async (blocks: DroppedBlock[]) => {
    if (!currentSprite) return;
    
    setIsRunning(true);
    setExecutionLog([]);
    
    const log = (message: string) => {
      setExecutionLog(prev => [...prev, `> ${message}`]);
    };

    // Find starting blocks (hat blocks)
    const startBlocks = blocks.filter(block => block.shape === 'hat');
    
    if (startBlocks.length === 0) {
      log('No starting block found. Add a "when flag clicked" block.');
      setIsRunning(false);
      return;
    }

    for (const startBlock of startBlocks) {
      log(`Starting from: ${startBlock.name}`);
      
      // Execute connected blocks
      const connectedBlocks = blocks.filter(block => 
        block.scriptId === startBlock.scriptId && block !== startBlock
      ).sort((a, b) => a.position.y - b.position.y);

      for (const block of connectedBlocks) {
        await executeBlock(block);
        await new Promise(resolve => setTimeout(resolve, 500)); // Delay for visualization
      }
    }
    
    setIsRunning(false);
    log('Script execution completed!');
  };

  const executeBlock = async (block: DroppedBlock) => {
    if (!currentSprite) return;

    const log = (message: string) => {
      setExecutionLog(prev => [...prev, `> ${message}`]);
    };

    log(`Executing: ${block.name}`);

    switch (block.id) {
      case 'move_steps':
        const steps = block.parameterValues?.steps || 10;
        updateSpritePosition(currentSprite.id, currentSprite.x + steps, currentSprite.y);
        log(`Moved ${steps} steps`);
        break;
      
      case 'turn_right':
        const rightDegrees = block.parameterValues?.degrees || 15;
        updateSpriteRotation(currentSprite.id, currentSprite.rotation + rightDegrees);
        log(`Turned right ${rightDegrees} degrees`);
        break;
      
      case 'turn_left':
        const leftDegrees = block.parameterValues?.degrees || 15;
        updateSpriteRotation(currentSprite.id, currentSprite.rotation - leftDegrees);
        log(`Turned left ${leftDegrees} degrees`);
        break;
      
      case 'say_hello':
        const message = block.parameterValues?.message || 'Hello!';
        showSpeechBubble(currentSprite.id, message);
        log(`Said: "${message}"`);
        break;
      
      case 'show':
        updateSpriteVisibility(currentSprite.id, true);
        log('Sprite shown');
        break;
      
      case 'hide':
        updateSpriteVisibility(currentSprite.id, false);
        log('Sprite hidden');
        break;
      
      case 'change_size':
        const sizeChange = block.parameterValues?.change || 10;
        updateSpriteSize(currentSprite.id, currentSprite.size + sizeChange);
        log(`Changed size by ${sizeChange}`);
        break;
      
      case 'wait':
        const waitTime = block.parameterValues?.seconds || 1;
        log(`Waiting ${waitTime} seconds...`);
        await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        break;
      
      default:
        log(`Block "${block.name}" executed (simulation)`);
    }
  };

  const updateSpritePosition = (spriteId: string, x: number, y: number) => {
    setSprites(prev => prev.map(s => 
      s.id === spriteId ? { ...s, x: Math.max(-240, Math.min(240, x)), y: Math.max(-180, Math.min(180, y)) } : s
    ));
  };

  const updateSpriteRotation = (spriteId: string, rotation: number) => {
    setSprites(prev => prev.map(s => 
      s.id === spriteId ? { ...s, rotation: rotation % 360 } : s
    ));
  };

  const updateSpriteVisibility = (spriteId: string, visible: boolean) => {
    setSprites(prev => prev.map(s => 
      s.id === spriteId ? { ...s, visible } : s
    ));
  };

  const updateSpriteSize = (spriteId: string, size: number) => {
    setSprites(prev => prev.map(s => 
      s.id === spriteId ? { ...s, size: Math.max(10, Math.min(200, size)) } : s
    ));
  };

  const updateSpriteCostume = (spriteId: string, costume: string) => {
    setSprites(prev => prev.map(s => 
      s.id === spriteId ? { ...s, costume } : s
    ));
  };

  const showSpeechBubble = (spriteId: string, message: string) => {
    toast({
      title: `${sprites.find(s => s.id === spriteId)?.name} says:`,
      description: message,
      duration: 2000,
    });
  };

  const handleBlockSelect = (block: ScratchBlock) => {
    // This is now handled by drag and drop
    toast({
      title: "Drag and Drop!",
      description: "Drag this block to the script area to add it.",
    });
  };

  const handleRunScript = () => {
    const currentSpriteBlocks = scripts.filter(block => block.scriptId === currentSprite?.id);
    executeScript(currentSpriteBlocks);
  };

  const handleUploadCostume = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newCostume: Costume = {
          id: `costume-${Date.now()}`,
          name: file.name.split('.')[0],
          dataUrl: e.target?.result as string
        };
        setCostumes(prev => [...prev, newCostume]);
        setShowCostumeDialog(false);
        toast({
          title: "Costume uploaded!",
          description: `${newCostume.name} has been added to your costumes.`,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadBackdrop = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newBackdrop: Backdrop = {
          id: `backdrop-${Date.now()}`,
          name: file.name.split('.')[0],
          dataUrl: e.target?.result as string
        };
        setBackdrops(prev => [...prev, newBackdrop]);
        setCurrentBackdrop(newBackdrop.id);
        setShowBackdropDialog(false);
        toast({
          title: "Backdrop uploaded!",
          description: `${newBackdrop.name} has been added as the new backdrop.`,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const addNewSprite = () => {
    const newSprite: Sprite = {
      id: `sprite-${Date.now()}`,
      name: `Sprite ${sprites.length + 1}`,
      x: 0,
      y: 0,
      rotation: 90,
      size: 100,
      visible: true,
      costume: costumes[0]?.id || 'cat1'
    };
    setSprites(prev => [...prev, newSprite]);
    setCurrentSprite(newSprite);
    setShowSpriteDialog(false);
    toast({
      title: "New sprite added!",
      description: `${newSprite.name} has been added to the project.`,
    });
  };

  const clearScript = () => {
    if (!currentSprite) return;
    setScripts(prev => prev.filter(block => block.scriptId !== currentSprite.id));
    setExecutionLog([]);
    toast({
      title: "Script cleared!",
      description: "All blocks have been removed from the current sprite.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Enhanced Visual Coding Studio
          </h1>
          <p className="text-gray-600">Create amazing projects with drag-and-drop programming blocks!</p>
        </div>

        {/* Toolbar */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 mb-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                onClick={handleRunScript} 
                disabled={isRunning}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                {isRunning ? (
                  <Square className="h-4 w-4 mr-2" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {isRunning ? 'Running...' : 'Run'}
              </Button>
              
              <Button 
                onClick={clearScript}
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>

              <Button variant="outline">
                <Save className="h-4 w-4 mr-2" />
                Save Project
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                Sprite: {currentSprite?.name}
              </Badge>
              <Badge variant="outline">
                Blocks: {scripts.filter(s => s.scriptId === currentSprite?.id).length}
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          {/* Block Palette */}
          <div className="col-span-3 bg-white/95 backdrop-blur-sm rounded-lg p-4 overflow-y-auto">
            <div className="mb-4 relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search blocks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10"
              />
            </div>
            <div onDragStart={(e) => e.preventDefault()}>
              <ScratchBlocks onBlockSelect={handleBlockSelect} searchTerm={searchTerm} onBlockDragStart={handleBlockDragStart} />
            </div>
          </div>

          {/* Script Area */}
          <div className="col-span-6 bg-white/95 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Code className="h-5 w-5 mr-2" />
                Script for {currentSprite?.name}
              </h3>
              <Badge variant="outline">
                {scripts.filter(s => s.scriptId === currentSprite?.id).length} blocks
              </Badge>
            </div>
            
            <div 
              ref={scriptAreaRef}
              className="h-96 border-2 border-dashed border-gray-300 rounded-lg p-4 overflow-y-auto bg-gray-50 relative"
              onDragOver={handleScriptAreaDragOver}
              onDrop={handleScriptAreaDrop}
            >
              {scripts.filter(s => s.scriptId === currentSprite?.id).length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Box className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Drag blocks here to create your script</p>
                    <p className="text-sm">Start with a "when flag clicked" block</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {scripts
                    .filter(s => s.scriptId === currentSprite?.id)
                    .sort((a, b) => a.position.y - b.position.y)
                    .map((block, index) => (
                    <div
                      key={block.uniqueId}
                      className="p-3 rounded border-2 text-white text-sm font-mono relative group cursor-move"
                      style={{ 
                        backgroundColor: block.color, 
                        borderColor: block.color,
                        left: `${Math.min(block.position.x, 200)}px`
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span>{block.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-auto p-1 text-white hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setScripts(prev => prev.filter(b => b.uniqueId !== block.uniqueId))}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      {block.parameters && (
                        <div className="mt-2 space-y-1">
                          {block.parameters.map((param, paramIndex) => (
                            <div key={paramIndex} className="flex items-center space-x-2">
                              <span className="text-xs opacity-80">{param.name}:</span>
                              <input
                                type={param.type === 'number' ? 'number' : 'text'}
                                defaultValue={param.value}
                                className="bg-white/20 text-white placeholder-white/50 text-xs rounded px-1 py-0.5 w-16"
                                onChange={(e) => {
                                  const value = param.type === 'number' ? Number(e.target.value) : e.target.value;
                                  setScripts(prev => prev.map(b => 
                                    b.uniqueId === block.uniqueId 
                                      ? { ...b, parameterValues: { ...b.parameterValues, [param.name]: value } }
                                      : b
                                  ));
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Execution Log */}
            {executionLog.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Execution Log:</h4>
                <div className="bg-gray-900 text-green-400 p-3 rounded text-sm font-mono max-h-32 overflow-y-auto">
                  {executionLog.map((log, index) => (
                    <div key={index}>{log}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Stage and Sprites Panel */}
          <div className="col-span-3 space-y-4">
            {/* Stage */}
            <Card className="bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Stage</span>
                  <Dialog open={showBackdropDialog} onOpenChange={setShowBackdropDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <ImageIcon className="h-3 w-3 mr-1" />
                        Backdrop
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Choose Backdrop</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                          {backdrops.map((backdrop) => (
                            <Button
                              key={backdrop.id}
                              variant={currentBackdrop === backdrop.id ? "default" : "outline"}
                              onClick={() => {
                                setCurrentBackdrop(backdrop.id);
                                setShowBackdropDialog(false);
                              }}
                              className="h-auto p-2"
                            >
                              <div className="text-center">
                                <div 
                                  className="w-full h-16 rounded mb-1"
                                  style={{ 
                                    background: backdrop.dataUrl.startsWith('#') 
                                      ? backdrop.dataUrl 
                                      : `url(${backdrop.dataUrl})`,
                                    backgroundSize: 'cover'
                                  }}
                                />
                                <span className="text-xs">{backdrop.name}</span>
                              </div>
                            </Button>
                          ))}
                        </div>
                        <div className="border-t pt-4">
                          <label htmlFor="backdrop-upload" className="cursor-pointer">
                            <Button variant="outline" className="w-full" asChild>
                              <span>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Backdrop
                              </span>
                            </Button>
                            <input
                              id="backdrop-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleUploadBackdrop}
                            />
                          </label>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div 
                    className="w-full h-48 rounded border-2 border-gray-200 overflow-hidden relative"
                    style={{ 
                      background: currentBackdrop === 'default' 
                        ? backdrops.find(b => b.id === currentBackdrop)?.dataUrl || '#87CEEB'
                        : `url(${backdrops.find(b => b.id === currentBackdrop)?.dataUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    {/* Coordinate grid */}
                    <div className="absolute inset-0 opacity-20">
                      <svg className="w-full h-full">
                        <defs>
                          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="gray" strokeWidth="0.5"/>
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                      </svg>
                    </div>
                    
                    {/* Center cross */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-4 h-0.5 bg-red-500"></div>
                      <div className="w-0.5 h-4 bg-red-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                    </div>
                    
                    {/* Sprites */}
                    {sprites.filter(sprite => sprite.visible).map((sprite) => {
                      const costume = costumes.find(c => c.id === sprite.costume);
                      return (
                        <div
                          key={sprite.id}
                          className="absolute transition-all duration-300 cursor-pointer"
                          style={{
                            left: `${50 + (sprite.x / 240) * 50}%`,
                            top: `${50 - (sprite.y / 180) * 50}%`,
                            transform: `translate(-50%, -50%) rotate(${sprite.rotation - 90}deg) scale(${sprite.size / 100})`,
                          }}
                          onClick={() => setCurrentSprite(sprite)}
                        >
                          {costume ? (
                            <img 
                              src={costume.dataUrl} 
                              alt={sprite.name}
                              className="w-8 h-8 rounded"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-orange-400 rounded flex items-center justify-center text-xs text-white">
                              {sprite.name.charAt(0)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sprites */}
            <Card className="bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Sprites</span>
                  <Dialog open={showSpriteDialog} onOpenChange={setShowSpriteDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Sprite</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Button onClick={addNewSprite} className="w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          Create New Sprite
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {sprites.map((sprite) => {
                    const costume = costumes.find(c => c.id === sprite.costume);
                    return (
                      <div
                        key={sprite.id}
                        className={`p-2 rounded border cursor-pointer transition-colors ${
                          currentSprite?.id === sprite.id 
                            ? 'bg-blue-100 border-blue-300' 
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                        onClick={() => setCurrentSprite(sprite)}
                      >
                        <div className="flex items-center space-x-2">
                          {costume ? (
                            <img 
                              src={costume.dataUrl} 
                              alt={sprite.name}
                              className="w-6 h-6 rounded"
                            />
                          ) : (
                            <div className="w-6 h-6 bg-orange-400 rounded flex items-center justify-center text-xs text-white">
                              {sprite.name.charAt(0)}
                            </div>
                          )}
                          <span className="text-sm font-medium">{sprite.name}</span>
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          x: {sprite.x}, y: {sprite.y}, size: {sprite.size}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Costumes */}
            <Card className="bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Costumes</span>
                  <Dialog open={showCostumeDialog} onOpenChange={setShowCostumeDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Upload className="h-3 w-3 mr-1" />
                        Upload
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Upload Costume</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <label htmlFor="costume-upload" className="cursor-pointer">
                          <Button variant="outline" className="w-full" asChild>
                            <span>
                              <Upload className="h-4 w-4 mr-2" />
                              Choose Image File
                            </span>
                          </Button>
                          <input
                            id="costume-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleUploadCostume}
                          />
                        </label>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {costumes.map((costume) => (
                    <Button
                      key={costume.id}
                      variant={currentSprite?.costume === costume.id ? "default" : "outline"}
                      onClick={() => currentSprite && updateSpriteCostume(currentSprite.id, costume.id)}
                      className="h-auto p-2"
                    >
                      <div className="text-center">
                        <img 
                          src={costume.dataUrl} 
                          alt={costume.name}
                          className="w-8 h-8 mx-auto rounded mb-1"
                        />
                        <span className="text-xs">{costume.name}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedVisualCoding;