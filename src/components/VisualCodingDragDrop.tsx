import React, { useState, useRef, useEffect, useCallback, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Repeat,
  Search,
  Calculator,
  Image as ImageIcon,
  Plus,
  Home
} from 'lucide-react';

interface Block {
  id: string;
  type: 'motion' | 'looks' | 'sound' | 'events' | 'control' | 'sensing' | 'operators';
  name: string;
  code: string;
  color: string;
  shape: 'hat' | 'stack' | 'boolean' | 'reporter' | 'cap';
  parameters?: { name: string; type: 'number' | 'text' | 'dropdown'; value?: any; options?: string[] }[];
}

interface DroppedBlock extends Block {
  scriptId: string;
  position: { x: number; y: number };
  connectedTo?: string;
  uniqueId: string;
}

interface Sprite {
  id: string;
  name: string;
  x: number;
  y: number;
  rotation: number;
  size: number;
  costume: string;
  visible: boolean;
  scripts: DroppedBlock[][];
}

const BLOCK_CATEGORIES = {
  events: {
    name: 'Events',
    color: 'bg-amber-500',
    icon: Flag,
    blocks: [
      { 
        id: 'when_flag_clicked', 
        name: 'when 🏴 clicked', 
        code: 'whenFlagClicked()', 
        color: '#FFB000',
        shape: 'hat' as const,
        parameters: []
      },
      { 
        id: 'when_key_pressed', 
        name: 'when [SPACE] key pressed', 
        code: 'whenKeyPressed("space")', 
        color: '#FFB000',
        shape: 'hat' as const,
        parameters: [{ name: 'key', type: 'dropdown' as const, value: 'space', options: ['space', 'up arrow', 'down arrow', 'left arrow', 'right arrow'] }] 
      },
      { 
        id: 'when_clicked', 
        name: 'when this sprite clicked', 
        code: 'whenClicked()', 
        color: '#FFB000',
        shape: 'hat' as const,
        parameters: []
      }
    ]
  },
  motion: {
    name: 'Motion',
    color: 'bg-blue-500',
    icon: Move,
    blocks: [
      { 
        id: 'move_steps', 
        name: 'move [10] steps', 
        code: 'move(10)', 
        color: '#4C97FF',
        shape: 'stack' as const,
        parameters: [{ name: 'steps', type: 'number' as const, value: 10 }] 
      },
      { 
        id: 'turn_right', 
        name: 'turn ↻ [15] degrees', 
        code: 'turn(15)', 
        color: '#4C97FF',
        shape: 'stack' as const,
        parameters: [{ name: 'degrees', type: 'number' as const, value: 15 }] 
      },
      { 
        id: 'goto_xy', 
        name: 'go to x: [0] y: [0]', 
        code: 'goto(0, 0)', 
        color: '#4C97FF',
        shape: 'stack' as const,
        parameters: [{ name: 'x', type: 'number' as const, value: 0 }, { name: 'y', type: 'number' as const, value: 0 }] 
      }
    ]
  },
  looks: {
    name: 'Looks',
    color: 'bg-purple-500',
    icon: Eye,
    blocks: [
      { 
        id: 'say', 
        name: 'say [Hello!] for [2] seconds', 
        code: 'say("Hello!", 2)', 
        color: '#9966FF',
        shape: 'stack' as const,
        parameters: [{ name: 'message', type: 'text' as const, value: 'Hello!' }, { name: 'seconds', type: 'number' as const, value: 2 }] 
      },
      { 
        id: 'show', 
        name: 'show', 
        code: 'show()', 
        color: '#9966FF',
        shape: 'stack' as const,
        parameters: []
      },
      { 
        id: 'hide', 
        name: 'hide', 
        code: 'hide()', 
        color: '#9966FF',
        shape: 'stack' as const,
        parameters: []
      },
      {
        id: 'change_size',
        name: 'change size by [10]',
        code: 'changeSize(10)',
        color: '#9966FF',
        shape: 'stack' as const,
        parameters: [{ name: 'change', type: 'number' as const, value: 10 }]
      },
    ]
  },
  sound: {
    name: 'Sound',
    color: 'bg-pink-500',
    icon: Volume2,
    blocks: [
      {
        id: 'play_sound',
        name: 'play sound [Meow]',
        code: 'playSound("Meow")',
        color: '#CF63CF',
        shape: 'stack' as const,
        parameters: [{ name: 'sound', type: 'dropdown' as const, value: 'Meow', options: ['Meow', 'Pop', 'Boing'] }]
      }
    ]
  },
  control: {
    name: 'Control',
    color: 'bg-orange-500',
    icon: Repeat,
    blocks: [
      { 
        id: 'wait', 
        name: 'wait [1] seconds', 
        code: 'wait(1)', 
        color: '#FF8C1A',
        shape: 'stack' as const,
        parameters: [{ name: 'seconds', type: 'number' as const, value: 1 }] 
      },
      { 
        id: 'repeat', 
        name: 'repeat [10]', 
        code: 'repeat(10) {', 
        color: '#FF8C1A',
        shape: 'stack' as const,
        parameters: [{ name: 'times', type: 'number' as const, value: 10 }] 
      },
      { 
        id: 'forever', 
        name: 'forever', 
        code: 'forever() {', 
        color: '#FF8C1A',
        shape: 'cap' as const,
        parameters: []
      }
    ]
  }
};

type State = {
  sprites: Sprite[];
  selectedSprite: string;
  droppedBlocks: DroppedBlock[];
  isRunning: boolean;
  stageBackground: string;
};

type Action =
  | { type: 'ADD_SPRITE'; payload: Sprite }
  | { type: 'SELECT_SPRITE'; payload: string }
  | { type: 'UPDATE_SPRITE'; payload: Partial<Sprite> & { id: string } }
  | { type: 'ADD_BLOCK'; payload: DroppedBlock }
  | { type: 'REMOVE_BLOCK'; payload: string }
  | { type: 'UPDATE_BLOCK_PARAM'; payload: { uniqueId: string; paramIndex: number; value: any } }
  | { type: 'CLEAR_BLOCKS' }
  | { type: 'SET_RUNNING'; payload: boolean }
  | { type: 'SET_STAGE_BACKGROUND'; payload: string };

const initialState: State = {
  sprites: [
    {
      id: 'sprite1',
      name: 'Cat',
      x: 240,
      y: 180,
      rotation: 90,
      size: 100,
      costume: '🐱',
      visible: true,
      scripts: []
    }
  ],
  selectedSprite: 'sprite1',
  droppedBlocks: [],
  isRunning: false,
  stageBackground: 'white',
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_SPRITE':
      return { ...state, sprites: [...state.sprites, action.payload] };
    case 'SELECT_SPRITE':
      return { ...state, selectedSprite: action.payload };
    case 'UPDATE_SPRITE':
      return {
        ...state,
        sprites: state.sprites.map(s =>
          s.id === action.payload.id ? { ...s, ...action.payload } : s
        ),
      };
    case 'ADD_BLOCK':
      return { ...state, droppedBlocks: [...state.droppedBlocks, action.payload] };
    case 'REMOVE_BLOCK':
      return {
        ...state,
        droppedBlocks: state.droppedBlocks.filter(b => b.uniqueId !== action.payload),
      };
    case 'UPDATE_BLOCK_PARAM':
      return {
        ...state,
        droppedBlocks: state.droppedBlocks.map(block => {
          if (block.uniqueId === action.payload.uniqueId && block.parameters) {
            const newParameters = [...block.parameters];
            newParameters[action.payload.paramIndex] = {
              ...newParameters[action.payload.paramIndex],
              value: action.payload.value,
            };
            return { ...block, parameters: newParameters };
          }
          return block;
        }),
      };
    case 'CLEAR_BLOCKS':
      return { ...state, droppedBlocks: [] };
    case 'SET_RUNNING':
      return { ...state, isRunning: action.payload };
    case 'SET_STAGE_BACKGROUND':
      return { ...state, stageBackground: action.payload };
    default:
      return state;
  }
}

const ItemTypes = {
  BLOCK: 'block',
};

const DraggableBlock = ({ block, isDraggable, isInScript, onUpdate, onRemove }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.BLOCK,
    item: { ...block },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className={`
        relative inline-flex items-center px-3 py-2 rounded-lg text-white text-sm font-medium
        ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}
        ${isInScript ? 'mb-1' : 'mb-2 mr-2'}
        shadow-md hover:shadow-lg transition-shadow
      `}

    >
      <span className="select-none">{block.name}</span>
      {block.parameters && block.parameters.map((param, index) => (
        <span key={index} className="mx-1">
          <Input
            type={param.type}
            value={param.value}
            onChange={(e) => onUpdate(block.uniqueId, index, e.target.value)}
            className="inline w-16 h-6 text-xs text-black mx-1 px-1"
            onClick={(e) => e.stopPropagation()}
          />
        </span>
      ))}
      {isInScript && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute -top-1 -right-1 h-5 w-5 p-0 text-white hover:bg-red-500 rounded-full"
          onClick={() => onRemove(block.uniqueId)}
        >
          ×
        </Button>
      )}
    </div>
  );
};


const VisualCodingDragDrop = () => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(reducer, initialState);
  const { sprites, selectedSprite, droppedBlocks, isRunning, stageBackground } = state;
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof BLOCK_CATEGORIES>('events');
  const [uploadedSprites, setUploadedSprites] = useState<string[]>([]);

  const scriptsAreaRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);

  const [, drop] = useDrop(() => ({
    accept: ItemTypes.BLOCK,
    drop: (item: Block, monitor) => {
      const offset = monitor.getClientOffset();
      if (offset && scriptsAreaRef.current) {
        const rect = scriptsAreaRef.current.getBoundingClientRect();
        const x = offset.x - rect.left;
        const y = offset.y - rect.top;

        const newBlock: DroppedBlock = {
          ...(item as Block),
          scriptId: `script_${Date.now()}`,
          position: { x: Math.max(0, x), y: Math.max(0, y) },
          uniqueId: `${item.id}_${Date.now()}`
        };

        dispatch({ type: 'ADD_BLOCK', payload: newBlock });
      }
    },
  }));

  drop(scriptsAreaRef);

  // Remove block from scripts area
  const removeBlock = (uniqueId: string) => {
    dispatch({ type: 'REMOVE_BLOCK', payload: uniqueId });
  };

  // Update block parameter
  const updateBlockParameter = (uniqueId: string, paramIndex: number, value: any) => {
    dispatch({ type: 'UPDATE_BLOCK_PARAM', payload: { uniqueId, paramIndex, value } });
  };

  // Handle sprite upload
  const handleSpriteUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setUploadedSprites(prev => [...prev, imageUrl]);
        
        // Create new sprite with uploaded image
        const newSprite: Sprite = {
          id: `sprite_${Date.now()}`,
          name: file.name.split('.')[0],
          x: Math.random() * 400 + 50,
          y: Math.random() * 300 + 50,
          rotation: 90,
          size: 100,
          costume: imageUrl,
          visible: true,
          scripts: []
        };
        
        dispatch({ type: 'ADD_SPRITE', payload: newSprite });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        dispatch({ type: 'SET_STAGE_BACKGROUND', payload: imageUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  // Execute blocks (simple simulation)
  const executeBlocks = () => {
    dispatch({ type: 'SET_RUNNING', payload: true });
    
    // Group blocks by sprite and script
    const scriptsBySprite = groupBlocksByScript();
    
    // Execute each script
    Object.entries(scriptsBySprite).forEach(([spriteId, scripts]) => {
      scripts.forEach(script => {
        executeScript(spriteId, script);
      });
    });
    
    setTimeout(() => dispatch({ type: 'SET_RUNNING', payload: false }), 3000);
  };

  const groupBlocksByScript = () => {
    const scripts: Record<string, DroppedBlock[][]> = {};
    
    // For now, treat all blocks as one script per sprite
    const spriteBlocks: Record<string, DroppedBlock[]> = {};
    
    droppedBlocks.forEach(block => {
      if (!spriteBlocks[selectedSprite]) {
        spriteBlocks[selectedSprite] = [];
      }
      spriteBlocks[selectedSprite].push(block);
    });
    
    scripts[selectedSprite] = spriteBlocks[selectedSprite] ? [spriteBlocks[selectedSprite]] : [];
    
    return scripts;
  };

  const executeScript = async (spriteId: string, script: DroppedBlock[]) => {
    // Sort blocks by Y position to execute in order
    const sortedBlocks = script.sort((a, b) => a.position.y - b.position.y);
    
    for (const block of sortedBlocks) {
      await executeBlock(spriteId, block);
      await new Promise(resolve => setTimeout(resolve, 500)); // Delay between blocks
    }
  };

  const executeBlock = async (spriteId: string, block: DroppedBlock) => {
    const sprite = sprites.find(s => s.id === spriteId);
    if (!sprite) return;

    let newSpriteState: Partial<Sprite> & { id: string } = { id: spriteId };

    switch (block.id) {
      case 'move_steps':
        const steps = block.parameters?.[0]?.value || 10;
        newSpriteState.x = Math.min(Math.max(sprite.x + steps, 0), 480);
        break;
      case 'turn_right':
        const degrees = block.parameters?.[0]?.value || 15;
        newSpriteState.rotation = (sprite.rotation + degrees) % 360;
        break;
      case 'goto_xy':
        const x = block.parameters?.[0]?.value || 0;
        const y = block.parameters?.[1]?.value || 0;
        newSpriteState.x = Math.min(Math.max(x + 240, 0), 480);
        newSpriteState.y = Math.min(Math.max(180 - y, 0), 360);
        break;
      case 'show':
        newSpriteState.visible = true;
        break;
      case 'hide':
        newSpriteState.visible = false;
        break;
      case 'change_size':
        const change = block.parameters?.[0]?.value || 10;
        newSpriteState.size = Math.max(10, sprite.size + change);
        break;
      case 'play_sound':
        const sound = block.parameters?.[0]?.value || 'Meow';
        const audio = new Audio(`/sounds/${sound.toLowerCase()}.mp3`);
        audio.play();
        break;
    }

    if (Object.keys(newSpriteState).length > 1) {
      dispatch({ type: 'UPDATE_SPRITE', payload: newSpriteState });
    }
  };

  // Clear all blocks
  const clearBlocks = () => {
    dispatch({ type: 'CLEAR_BLOCKS' });
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">Visual Coding Studio</h1>
              <Button variant="outline" size="sm" onClick={() => navigate('/')}>
                <Home className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={executeBlocks}
                disabled={isRunning || droppedBlocks.length === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                {isRunning ? (
                  <>
                    <Square className="h-4 w-4 mr-2" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={clearBlocks}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Block Palette */}
          <div className="w-64 bg-white border-r flex flex-col">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-900 mb-3">Block Palette</h2>
              <div className="space-y-1">
                {Object.entries(BLOCK_CATEGORIES).map(([key, category]) => {
                  const IconComponent = category.icon;
                  return (
                    <Button
                      key={key}
                      variant={selectedCategory === key ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setSelectedCategory(key as keyof typeof BLOCK_CATEGORIES)}
                      className="w-full justify-start"
                    >
                      <IconComponent className="h-4 w-4 mr-2" />
                      {category.name}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-2">
                {BLOCK_CATEGORIES[selectedCategory].blocks.map((block) => (
                  <DraggableBlock
                    key={block.id}
                    block={block}
                    isDraggable={true}
                    isInScript={false}
                    onUpdate={updateBlockParameter}
                    onRemove={removeBlock}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Main Workspace */}
          <div className="flex-1 flex flex-col">
            {/* Stage */}
            <div className="h-80 bg-white border-b p-4">
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Stage</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => backgroundInputRef.current?.click()}>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Set Background
                  </Button>
                  <input
                    ref={backgroundInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundUpload}
                    className="hidden"
                  />
                </CardHeader>
                <CardContent className="h-full p-2">
                  <div
                    ref={stageRef}
                    className="relative w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 rounded overflow-hidden"
                    style={{
                      background: stageBackground.startsWith('data:') ? `url(${stageBackground})` : stageBackground,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    {sprites.map((sprite) => (
                      <div
                        key={sprite.id}
                        className={`absolute transition-all duration-500 ${sprite.visible ? 'opacity-100' : 'opacity-0'}`}
                        style={{
                          left: sprite.x,
                          top: sprite.y,
                          transform: `rotate(${sprite.rotation - 90}deg) scale(${sprite.size / 100})`,
                          transformOrigin: 'center'
                        }}
                      >
                        {sprite.costume.startsWith('data:') ? (
                          <img src={sprite.costume} alt={sprite.name} className="w-8 h-8" />
                        ) : (
                          <span className="text-2xl">{sprite.costume}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Scripts Area */}
            <div className="flex-1 p-4">
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Scripts</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {droppedBlocks.length} blocks
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="h-full p-2">
                  <div
                    ref={scriptsAreaRef}
                    className="relative w-full h-full bg-gray-50 border-2 border-dashed border-gray-300 rounded p-4 overflow-auto"
                  >
                    {droppedBlocks.length === 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <Box className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Drag blocks here to create your program</p>
                        </div>
                      </div>
                    ) : (
                      droppedBlocks.map((block) => (
                        <div
                          key={block.uniqueId}
                          className="absolute"
                          style={{
                            left: block.position.x,
                            top: block.position.y,
                          }}
                        >
                          <DraggableBlock
                            block={block}
                            isDraggable={false}
                            isInScript={true}
                            onUpdate={updateBlockParameter}
                            onRemove={removeBlock}
                          />
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sprite Panel */}
          <div className="w-64 bg-white border-l flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900">Sprites</h2>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleSpriteUpload}
                className="hidden"
              />
            </div>
            
            <div className="flex-1 p-4 space-y-2 overflow-y-auto">
              {sprites.map((sprite) => (
                <Card
                  key={sprite.id}
                  className={`cursor-pointer transition-colors ${
                    selectedSprite === sprite.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => dispatch({ type: 'SELECT_SPRITE', payload: sprite.id })}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                        {sprite.costume.startsWith('data:') ? (
                          <img src={sprite.costume} alt={sprite.name} className="w-8 h-8 object-cover" />
                        ) : (
                          <span className="text-lg">{sprite.costume}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {sprite.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          x: {Math.round(sprite.x)}, y: {Math.round(sprite.y)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default VisualCodingDragDrop;