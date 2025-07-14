import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Flag, 
  Move, 
  RotateCw, 
  Eye, 
  Volume2, 
  Repeat, 
  Calculator,
  Search,
  Mouse,
  Zap,
  Clock,
  MessageCircle,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Plus,
  Minus,
  X,
  Divide
} from 'lucide-react';

export interface ScratchBlock {
  id: string;
  category: 'motion' | 'looks' | 'sound' | 'events' | 'control' | 'sensing' | 'operators' | 'variables';
  name: string;
  code: string;
  color: string;
  shape: 'hat' | 'stack' | 'boolean' | 'reporter' | 'cap';
  parameters?: {
    name: string;
    type: 'number' | 'text' | 'dropdown' | 'boolean';
    value?: any;
    options?: string[];
  }[];
  description?: string;
}

export const SCRATCH_BLOCKS: Record<string, { name: string; color: string; icon: React.ComponentType<any>; blocks: ScratchBlock[] }> = {
  events: {
    name: 'Events',
    color: 'bg-amber-500',
    icon: Flag,
    blocks: [
      {
        id: 'when_flag_clicked',
        category: 'events',
        name: 'when 🏴 clicked',
        code: 'whenFlagClicked()',
        color: '#FFB000',
        shape: 'hat',
        description: 'Starts the script when the green flag is clicked'
      },
      {
        id: 'when_key_pressed',
        category: 'events',
        name: 'when [SPACE] key pressed',
        code: 'whenKeyPressed("space")',
        color: '#FFB000',
        shape: 'hat',
        parameters: [
          {
            name: 'key',
            type: 'dropdown',
            value: 'space',
            options: ['space', 'up arrow', 'down arrow', 'left arrow', 'right arrow', 'a', 'b', 'c']
          }
        ],
        description: 'Starts the script when a specific key is pressed'
      },
      {
        id: 'when_sprite_clicked',
        category: 'events',
        name: 'when this sprite clicked',
        code: 'whenClicked()',
        color: '#FFB000',
        shape: 'hat',
        description: 'Starts the script when this sprite is clicked'
      },
      {
        id: 'when_backdrop_switches',
        category: 'events',
        name: 'when backdrop switches to [backdrop1]',
        code: 'whenBackdropSwitches("backdrop1")',
        color: '#FFB000',
        shape: 'hat',
        parameters: [
          {
            name: 'backdrop',
            type: 'dropdown',
            value: 'backdrop1',
            options: ['backdrop1', 'backdrop2', 'backdrop3']
          }
        ],
        description: 'Starts the script when backdrop changes'
      }
    ]
  },
  motion: {
    name: 'Motion',
    color: 'bg-blue-600',
    icon: Move,
    blocks: [
      {
        id: 'move_steps',
        category: 'motion',
        name: 'move [10] steps',
        code: 'move(10)',
        color: '#4C97FF',
        shape: 'stack',
        parameters: [{ name: 'steps', type: 'number', value: 10 }],
        description: 'Move sprite forward by specified steps'
      },
      {
        id: 'turn_right',
        category: 'motion',
        name: 'turn ↻ [15] degrees',
        code: 'turnRight(15)',
        color: '#4C97FF',
        shape: 'stack',
        parameters: [{ name: 'degrees', type: 'number', value: 15 }],
        description: 'Turn sprite clockwise'
      },
      {
        id: 'turn_left',
        category: 'motion',
        name: 'turn ↺ [15] degrees',
        code: 'turnLeft(15)',
        color: '#4C97FF',
        shape: 'stack',
        parameters: [{ name: 'degrees', type: 'number', value: 15 }],
        description: 'Turn sprite counter-clockwise'
      },
      {
        id: 'goto_xy',
        category: 'motion',
        name: 'go to x: [0] y: [0]',
        code: 'goTo(0, 0)',
        color: '#4C97FF',
        shape: 'stack',
        parameters: [
          { name: 'x', type: 'number', value: 0 },
          { name: 'y', type: 'number', value: 0 }
        ],
        description: 'Move sprite to specific coordinates'
      },
      {
        id: 'glide_to_xy',
        category: 'motion',
        name: 'glide [1] secs to x: [0] y: [0]',
        code: 'glideTo(1, 0, 0)',
        color: '#4C97FF',
        shape: 'stack',
        parameters: [
          { name: 'secs', type: 'number', value: 1 },
          { name: 'x', type: 'number', value: 0 },
          { name: 'y', type: 'number', value: 0 }
        ],
        description: 'Smoothly move sprite to coordinates'
      },
      {
        id: 'point_direction',
        category: 'motion',
        name: 'point in direction [90]',
        code: 'pointInDirection(90)',
        color: '#4C97FF',
        shape: 'stack',
        parameters: [{ name: 'direction', type: 'number', value: 90 }],
        description: 'Point sprite in specific direction'
      },
      {
        id: 'change_x',
        category: 'motion',
        name: 'change x by [10]',
        code: 'changeX(10)',
        color: '#4C97FF',
        shape: 'stack',
        parameters: [{ name: 'dx', type: 'number', value: 10 }],
        description: 'Change horizontal position'
      },
      {
        id: 'change_y',
        category: 'motion',
        name: 'change y by [10]',
        code: 'changeY(10)',
        color: '#4C97FF',
        shape: 'stack',
        parameters: [{ name: 'dy', type: 'number', value: 10 }],
        description: 'Change vertical position'
      },
      {
        id: 'x_position',
        category: 'motion',
        name: 'x position',
        code: 'xPosition()',
        color: '#4C97FF',
        shape: 'reporter',
        description: 'Get current x coordinate'
      },
      {
        id: 'y_position',
        category: 'motion',
        name: 'y position',
        code: 'yPosition()',
        color: '#4C97FF',
        shape: 'reporter',
        description: 'Get current y coordinate'
      }
    ]
  },
  looks: {
    name: 'Looks',
    color: 'bg-purple-600',
    icon: Eye,
    blocks: [
      {
        id: 'say_hello',
        category: 'looks',
        name: 'say [Hello!] for [2] seconds',
        code: 'say("Hello!", 2)',
        color: '#9966FF',
        shape: 'stack',
        parameters: [
          { name: 'message', type: 'text', value: 'Hello!' },
          { name: 'seconds', type: 'number', value: 2 }
        ],
        description: 'Display speech bubble'
      },
      {
        id: 'say',
        category: 'looks',
        name: 'say [Hello!]',
        code: 'say("Hello!")',
        color: '#9966FF',
        shape: 'stack',
        parameters: [{ name: 'message', type: 'text', value: 'Hello!' }],
        description: 'Display speech bubble indefinitely'
      },
      {
        id: 'think_hello',
        category: 'looks',
        name: 'think [Hmm...] for [2] seconds',
        code: 'think("Hmm...", 2)',
        color: '#9966FF',
        shape: 'stack',
        parameters: [
          { name: 'message', type: 'text', value: 'Hmm...' },
          { name: 'seconds', type: 'number', value: 2 }
        ],
        description: 'Display thought bubble'
      },
      {
        id: 'show',
        category: 'looks',
        name: 'show',
        code: 'show()',
        color: '#9966FF',
        shape: 'stack',
        description: 'Make sprite visible'
      },
      {
        id: 'hide',
        category: 'looks',
        name: 'hide',
        code: 'hide()',
        color: '#9966FF',
        shape: 'stack',
        description: 'Make sprite invisible'
      },
      {
        id: 'change_size',
        category: 'looks',
        name: 'change size by [10]',
        code: 'changeSize(10)',
        color: '#9966FF',
        shape: 'stack',
        parameters: [{ name: 'change', type: 'number', value: 10 }],
        description: 'Change sprite size'
      },
      {
        id: 'set_size',
        category: 'looks',
        name: 'set size to [100] %',
        code: 'setSize(100)',
        color: '#9966FF',
        shape: 'stack',
        parameters: [{ name: 'size', type: 'number', value: 100 }],
        description: 'Set sprite size percentage'
      },
      {
        id: 'change_effect',
        category: 'looks',
        name: 'change [color] effect by [25]',
        code: 'changeEffect("color", 25)',
        color: '#9966FF',
        shape: 'stack',
        parameters: [
          {
            name: 'effect',
            type: 'dropdown',
            value: 'color',
            options: ['color', 'fisheye', 'whirl', 'pixelate', 'mosaic', 'brightness', 'ghost']
          },
          { name: 'change', type: 'number', value: 25 }
        ],
        description: 'Change visual effect'
      },
      {
        id: 'next_costume',
        category: 'looks',
        name: 'next costume',
        code: 'nextCostume()',
        color: '#9966FF',
        shape: 'stack',
        description: 'Switch to next costume'
      },
      {
        id: 'costume_number',
        category: 'looks',
        name: 'costume #',
        code: 'costumeNumber()',
        color: '#9966FF',
        shape: 'reporter',
        description: 'Get current costume number'
      }
    ]
  },
  sound: {
    name: 'Sound',
    color: 'bg-pink-600',
    icon: Volume2,
    blocks: [
      {
        id: 'play_sound',
        category: 'sound',
        name: 'play sound [meow]',
        code: 'playSound("meow")',
        color: '#CF63CF',
        shape: 'stack',
        parameters: [
          {
            name: 'sound',
            type: 'dropdown',
            value: 'meow',
            options: ['meow', 'pop', 'ringing', 'bark', 'chirp']
          }
        ],
        description: 'Play a sound'
      },
      {
        id: 'play_sound_until_done',
        category: 'sound',
        name: 'play sound [meow] until done',
        code: 'playSoundUntilDone("meow")',
        color: '#CF63CF',
        shape: 'stack',
        parameters: [
          {
            name: 'sound',
            type: 'dropdown',
            value: 'meow',
            options: ['meow', 'pop', 'ringing', 'bark', 'chirp']
          }
        ],
        description: 'Play sound and wait until finished'
      },
      {
        id: 'stop_sounds',
        category: 'sound',
        name: 'stop all sounds',
        code: 'stopAllSounds()',
        color: '#CF63CF',
        shape: 'stack',
        description: 'Stop all playing sounds'
      },
      {
        id: 'change_volume',
        category: 'sound',
        name: 'change volume by [-10]',
        code: 'changeVolume(-10)',
        color: '#CF63CF',
        shape: 'stack',
        parameters: [{ name: 'volume', type: 'number', value: -10 }],
        description: 'Change sound volume'
      },
      {
        id: 'set_volume',
        category: 'sound',
        name: 'set volume to [100] %',
        code: 'setVolume(100)',
        color: '#CF63CF',
        shape: 'stack',
        parameters: [{ name: 'volume', type: 'number', value: 100 }],
        description: 'Set sound volume percentage'
      },
      {
        id: 'volume',
        category: 'sound',
        name: 'volume',
        code: 'volume()',
        color: '#CF63CF',
        shape: 'reporter',
        description: 'Get current volume'
      }
    ]
  },
  control: {
    name: 'Control',
    color: 'bg-orange-600',
    icon: Repeat,
    blocks: [
      {
        id: 'wait',
        category: 'control',
        name: 'wait [1] seconds',
        code: 'wait(1)',
        color: '#FFAB19',
        shape: 'stack',
        parameters: [{ name: 'seconds', type: 'number', value: 1 }],
        description: 'Pause execution for specified time'
      },
      {
        id: 'repeat',
        category: 'control',
        name: 'repeat [10]',
        code: 'repeat(10) {',
        color: '#FFAB19',
        shape: 'stack',
        parameters: [{ name: 'times', type: 'number', value: 10 }],
        description: 'Repeat enclosed blocks specified number of times'
      },
      {
        id: 'forever',
        category: 'control',
        name: 'forever',
        code: 'forever() {',
        color: '#FFAB19',
        shape: 'stack',
        description: 'Repeat enclosed blocks forever'
      },
      {
        id: 'if',
        category: 'control',
        name: 'if <> then',
        code: 'if () {',
        color: '#FFAB19',
        shape: 'stack',
        parameters: [{ name: 'condition', type: 'boolean', value: true }],
        description: 'Execute blocks if condition is true'
      },
      {
        id: 'if_else',
        category: 'control',
        name: 'if <> then else',
        code: 'if () { } else {',
        color: '#FFAB19',
        shape: 'stack',
        parameters: [{ name: 'condition', type: 'boolean', value: true }],
        description: 'Execute different blocks based on condition'
      },
      {
        id: 'wait_until',
        category: 'control',
        name: 'wait until <>',
        code: 'waitUntil()',
        color: '#FFAB19',
        shape: 'stack',
        parameters: [{ name: 'condition', type: 'boolean', value: true }],
        description: 'Wait until condition becomes true'
      },
      {
        id: 'repeat_until',
        category: 'control',
        name: 'repeat until <>',
        code: 'repeatUntil() {',
        color: '#FFAB19',
        shape: 'stack',
        parameters: [{ name: 'condition', type: 'boolean', value: true }],
        description: 'Repeat blocks until condition becomes true'
      },
      {
        id: 'stop_all',
        category: 'control',
        name: 'stop [all]',
        code: 'stop("all")',
        color: '#FFAB19',
        shape: 'cap',
        parameters: [
          {
            name: 'option',
            type: 'dropdown',
            value: 'all',
            options: ['all', 'this script', 'other scripts in sprite']
          }
        ],
        description: 'Stop scripts'
      }
    ]
  },
  sensing: {
    name: 'Sensing',
    color: 'bg-cyan-600',
    icon: Search,
    blocks: [
      {
        id: 'touching',
        category: 'sensing',
        name: 'touching [mouse-pointer] ?',
        code: 'touching("mouse-pointer")',
        color: '#5CB1D6',
        shape: 'boolean',
        parameters: [
          {
            name: 'object',
            type: 'dropdown',
            value: 'mouse-pointer',
            options: ['mouse-pointer', 'edge', 'Sprite1', 'Sprite2']
          }
        ],
        description: 'Check if touching object'
      },
      {
        id: 'touching_color',
        category: 'sensing',
        name: 'touching color [#ff0000] ?',
        code: 'touchingColor("#ff0000")',
        color: '#5CB1D6',
        shape: 'boolean',
        parameters: [{ name: 'color', type: 'text', value: '#ff0000' }],
        description: 'Check if touching specific color'
      },
      {
        id: 'key_pressed',
        category: 'sensing',
        name: 'key [space] pressed?',
        code: 'keyPressed("space")',
        color: '#5CB1D6',
        shape: 'boolean',
        parameters: [
          {
            name: 'key',
            type: 'dropdown',
            value: 'space',
            options: ['space', 'up arrow', 'down arrow', 'left arrow', 'right arrow', 'any']
          }
        ],
        description: 'Check if key is pressed'
      },
      {
        id: 'mouse_down',
        category: 'sensing',
        name: 'mouse down?',
        code: 'mouseDown()',
        color: '#5CB1D6',
        shape: 'boolean',
        description: 'Check if mouse button is pressed'
      },
      {
        id: 'mouse_x',
        category: 'sensing',
        name: 'mouse x',
        code: 'mouseX()',
        color: '#5CB1D6',
        shape: 'reporter',
        description: 'Get mouse x position'
      },
      {
        id: 'mouse_y',
        category: 'sensing',
        name: 'mouse y',
        code: 'mouseY()',
        color: '#5CB1D6',
        shape: 'reporter',
        description: 'Get mouse y position'
      },
      {
        id: 'timer',
        category: 'sensing',
        name: 'timer',
        code: 'timer()',
        color: '#5CB1D6',
        shape: 'reporter',
        description: 'Get timer value'
      },
      {
        id: 'reset_timer',
        category: 'sensing',
        name: 'reset timer',
        code: 'resetTimer()',
        color: '#5CB1D6',
        shape: 'stack',
        description: 'Reset timer to 0'
      }
    ]
  },
  operators: {
    name: 'Operators',
    color: 'bg-green-600',
    icon: Calculator,
    blocks: [
      {
        id: 'add',
        category: 'operators',
        name: '[1] + [1]',
        code: '(1 + 1)',
        color: '#59C059',
        shape: 'reporter',
        parameters: [
          { name: 'num1', type: 'number', value: 1 },
          { name: 'num2', type: 'number', value: 1 }
        ],
        description: 'Add two numbers'
      },
      {
        id: 'subtract',
        category: 'operators',
        name: '[1] - [1]',
        code: '(1 - 1)',
        color: '#59C059',
        shape: 'reporter',
        parameters: [
          { name: 'num1', type: 'number', value: 1 },
          { name: 'num2', type: 'number', value: 1 }
        ],
        description: 'Subtract two numbers'
      },
      {
        id: 'multiply',
        category: 'operators',
        name: '[1] * [1]',
        code: '(1 * 1)',
        color: '#59C059',
        shape: 'reporter',
        parameters: [
          { name: 'num1', type: 'number', value: 1 },
          { name: 'num2', type: 'number', value: 1 }
        ],
        description: 'Multiply two numbers'
      },
      {
        id: 'divide',
        category: 'operators',
        name: '[1] / [1]',
        code: '(1 / 1)',
        color: '#59C059',
        shape: 'reporter',
        parameters: [
          { name: 'num1', type: 'number', value: 1 },
          { name: 'num2', type: 'number', value: 1 }
        ],
        description: 'Divide two numbers'
      },
      {
        id: 'random',
        category: 'operators',
        name: 'pick random [1] to [10]',
        code: 'random(1, 10)',
        color: '#59C059',
        shape: 'reporter',
        parameters: [
          { name: 'from', type: 'number', value: 1 },
          { name: 'to', type: 'number', value: 10 }
        ],
        description: 'Pick random number in range'
      },
      {
        id: 'equals',
        category: 'operators',
        name: '[1] = [1]',
        code: '(1 == 1)',
        color: '#59C059',
        shape: 'boolean',
        parameters: [
          { name: 'operand1', type: 'text', value: '1' },
          { name: 'operand2', type: 'text', value: '1' }
        ],
        description: 'Check if values are equal'
      },
      {
        id: 'greater_than',
        category: 'operators',
        name: '[1] > [1]',
        code: '(1 > 1)',
        color: '#59C059',
        shape: 'boolean',
        parameters: [
          { name: 'operand1', type: 'number', value: 1 },
          { name: 'operand2', type: 'number', value: 1 }
        ],
        description: 'Check if first value is greater'
      },
      {
        id: 'less_than',
        category: 'operators',
        name: '[1] < [1]',
        code: '(1 < 1)',
        color: '#59C059',
        shape: 'boolean',
        parameters: [
          { name: 'operand1', type: 'number', value: 1 },
          { name: 'operand2', type: 'number', value: 1 }
        ],
        description: 'Check if first value is smaller'
      },
      {
        id: 'and',
        category: 'operators',
        name: '<> and <>',
        code: '() && ()',
        color: '#59C059',
        shape: 'boolean',
        parameters: [
          { name: 'operand1', type: 'boolean', value: true },
          { name: 'operand2', type: 'boolean', value: true }
        ],
        description: 'Logical AND operation'
      },
      {
        id: 'or',
        category: 'operators',
        name: '<> or <>',
        code: '() || ()',
        color: '#59C059',
        shape: 'boolean',
        parameters: [
          { name: 'operand1', type: 'boolean', value: true },
          { name: 'operand2', type: 'boolean', value: true }
        ],
        description: 'Logical OR operation'
      },
      {
        id: 'not',
        category: 'operators',
        name: 'not <>',
        code: '!()',
        color: '#59C059',
        shape: 'boolean',
        parameters: [{ name: 'operand', type: 'boolean', value: true }],
        description: 'Logical NOT operation'
      },
      {
        id: 'join',
        category: 'operators',
        name: 'join [hello] [world]',
        code: 'join("hello", "world")',
        color: '#59C059',
        shape: 'reporter',
        parameters: [
          { name: 'string1', type: 'text', value: 'hello' },
          { name: 'string2', type: 'text', value: 'world' }
        ],
        description: 'Join two strings'
      },
      {
        id: 'length',
        category: 'operators',
        name: 'length of [world]',
        code: 'length("world")',
        color: '#59C059',
        shape: 'reporter',
        parameters: [{ name: 'string', type: 'text', value: 'world' }],
        description: 'Get length of string'
      }
    ]
  },
  variables: {
    name: 'Variables',
    color: 'bg-red-600',
    icon: Clock,
    blocks: [
      {
        id: 'set_variable',
        category: 'variables',
        name: 'set [my variable] to [0]',
        code: 'setVariable("my variable", 0)',
        color: '#FF8C1A',
        shape: 'stack',
        parameters: [
          {
            name: 'variable',
            type: 'dropdown',
            value: 'my variable',
            options: ['my variable', 'score', 'lives', 'timer']
          },
          { name: 'value', type: 'text', value: '0' }
        ],
        description: 'Set variable to value'
      },
      {
        id: 'change_variable',
        category: 'variables',
        name: 'change [my variable] by [1]',
        code: 'changeVariable("my variable", 1)',
        color: '#FF8C1A',
        shape: 'stack',
        parameters: [
          {
            name: 'variable',
            type: 'dropdown',
            value: 'my variable',
            options: ['my variable', 'score', 'lives', 'timer']
          },
          { name: 'change', type: 'number', value: 1 }
        ],
        description: 'Change variable by amount'
      },
      {
        id: 'show_variable',
        category: 'variables',
        name: 'show variable [my variable]',
        code: 'showVariable("my variable")',
        color: '#FF8C1A',
        shape: 'stack',
        parameters: [
          {
            name: 'variable',
            type: 'dropdown',
            value: 'my variable',
            options: ['my variable', 'score', 'lives', 'timer']
          }
        ],
        description: 'Show variable on stage'
      },
      {
        id: 'hide_variable',
        category: 'variables',
        name: 'hide variable [my variable]',
        code: 'hideVariable("my variable")',
        color: '#FF8C1A',
        shape: 'stack',
        parameters: [
          {
            name: 'variable',
            type: 'dropdown',
            value: 'my variable',
            options: ['my variable', 'score', 'lives', 'timer']
          }
        ],
        description: 'Hide variable from stage'
      },
      {
        id: 'variable_value',
        category: 'variables',
        name: '[my variable]',
        code: 'getVariable("my variable")',
        color: '#FF8C1A',
        shape: 'reporter',
        parameters: [
          {
            name: 'variable',
            type: 'dropdown',
            value: 'my variable',
            options: ['my variable', 'score', 'lives', 'timer']
          }
        ],
        description: 'Get variable value'
      }
    ]
  }
};

interface ScratchBlocksProps {
  onBlockSelect: (block: ScratchBlock) => void;
  searchTerm: string;
  onBlockDragStart?: (e: React.DragEvent, block: ScratchBlock) => void;
}

const ScratchBlocks: React.FC<ScratchBlocksProps> = ({ onBlockSelect, searchTerm, onBlockDragStart }) => {
  const filteredCategories = Object.entries(SCRATCH_BLOCKS).map(([key, category]) => ({
    key,
    ...category,
    blocks: category.blocks.filter(block =>
      block.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      block.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.blocks.length > 0);

  const getBlockShape = (shape: string) => {
    switch (shape) {
      case 'hat':
        return 'rounded-t-lg border-t-2 border-l-2 border-r-2';
      case 'stack':
        return 'border-2';
      case 'boolean':
        return 'rounded-full border-2';
      case 'reporter':
        return 'rounded-full border-2';
      case 'cap':
        return 'rounded-b-lg border-b-2 border-l-2 border-r-2';
      default:
        return 'border-2';
    }
  };

  return (
    <div className="space-y-4">
      {filteredCategories.map(({ key, name, color, icon: Icon, blocks }) => (
        <Card key={key} className="border-2">
          <CardHeader className={`${color} text-white py-2`}>
            <CardTitle className="text-sm flex items-center">
              <Icon className="h-4 w-4 mr-2" />
              {name}
              <Badge variant="secondary" className="ml-auto bg-white/20 text-white">
                {blocks.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 space-y-2">
            {blocks.map((block) => (
              <Button
                key={block.id}
                variant="outline"
                className={`w-full justify-start text-left p-2 h-auto ${getBlockShape(block.shape)} hover:shadow-md transition-all cursor-grab active:cursor-grabbing`}
                style={{ 
                  backgroundColor: block.color,
                  borderColor: block.color,
                  color: 'white'
                }}
                draggable
                onDragStart={(e) => onBlockDragStart?.(e, block)}
                onClick={() => onBlockSelect(block)}
              >
                <div className="w-full">
                  <div className="font-mono text-xs mb-1">{block.name}</div>
                  {block.description && (
                    <div className="text-xs opacity-80">{block.description}</div>
                  )}
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ScratchBlocks;