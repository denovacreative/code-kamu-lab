import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  FolderOpen, 
  FileText, 
  Plus, 
  Upload,
  Download,
  Trash2,
  Search,
  File
} from 'lucide-react';

interface FileItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  size?: string;
  modified?: string;
}

interface NotebookSidebarProps {
  onFileSelect: (file: FileItem) => void;
}

const NotebookSidebar = ({ onFileSelect }: NotebookSidebarProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [files] = useState<FileItem[]>([
    { id: '1', name: 'Python Basics', type: 'folder' },
    { id: '2', name: 'main.ipynb', type: 'file', size: '2.3 KB', modified: '2 min ago' },
    { id: '3', name: 'data_analysis.py', type: 'file', size: '5.1 KB', modified: '1 hour ago' },
    { id: '4', name: 'visualization.ipynb', type: 'file', size: '8.7 KB', modified: '3 hours ago' },
    { id: '5', name: 'samples', type: 'folder' },
    { id: '6', name: 'requirements.txt', type: 'file', size: '0.5 KB', modified: '1 day ago' }
  ]);

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-800 mb-3">Project Files</h2>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1">
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
            <Plus className="h-3 w-3 mr-1" />
            New
          </Button>
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
            <Upload className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
            <Download className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredFiles.map((file) => (
          <div
            key={file.id}
            onClick={() => onFileSelect(file)}
            className="flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer group"
          >
            <div className="flex items-center flex-1 min-w-0">
              {file.type === 'folder' ? (
                <FolderOpen className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
              ) : (
                <FileText className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
              )}
              
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">
                  {file.name}
                </div>
                {file.size && (
                  <div className="text-xs text-gray-500 flex gap-2">
                    <span>{file.size}</span>
                    <span>•</span>
                    <span>{file.modified}</span>
                  </div>
                )}
              </div>
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="h-3 w-3 text-red-500" />
            </Button>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-between text-xs text-gray-600">
          <span>{filteredFiles.length} files</span>
          <Badge variant="secondary" className="text-xs">
            Python 3.9
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default NotebookSidebar;