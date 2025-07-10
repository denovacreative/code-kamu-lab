import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Folder, 
  File, 
  Upload, 
  Download, 
  Trash2, 
  Eye, 
  Plus,
  FolderPlus,
  Search,
  MoreVertical
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  created_at: string;
  path: string;
  mime_type?: string;
}

interface ClassFileManagerProps {
  classId: string;
  className: string;
  userRole: 'teacher' | 'student';
}

const ClassFileManager = ({ classId, className, userRole }: ClassFileManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);

  useEffect(() => {
    loadFiles();
  }, [classId, currentPath]);

  const loadFiles = async () => {
    try {
      setIsLoading(true);
      const folderPath = currentPath ? `${classId}/${currentPath}` : classId;
      
      const { data, error } = await supabase.storage
        .from('assignment-files')
        .list(folderPath, {
          limit: 100,
          offset: 0
        });

      if (error) throw error;

      const formattedFiles: FileItem[] = (data || []).map(file => ({
        id: file.id || file.name,
        name: file.name,
        type: file.id ? 'file' : 'folder',
        size: file.metadata?.size,
        created_at: file.created_at || file.updated_at || new Date().toISOString(),
        path: currentPath ? `${currentPath}/${file.name}` : file.name,
        mime_type: file.metadata?.mimetype
      }));

      setFiles(formattedFiles);
    } catch (error) {
      console.error('Error loading files:', error);
      toast({
        title: "Error",
        description: "Failed to load files",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFiles || uploadFiles.length === 0) return;

    try {
      setIsLoading(true);
      const uploadPromises = Array.from(uploadFiles).map(async (file) => {
        const fileName = `${Date.now()}_${file.name}`;
        const filePath = currentPath 
          ? `${classId}/${currentPath}/${fileName}`
          : `${classId}/${fileName}`;

        const { error } = await supabase.storage
          .from('assignment-files')
          .upload(filePath, file);

        if (error) throw error;
        return fileName;
      });

      await Promise.all(uploadPromises);
      
      toast({
        title: "Success",
        description: `${uploadFiles.length} file(s) uploaded successfully`
      });

      setShowUploadDialog(false);
      setUploadFiles(null);
      loadFiles();
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const folderPath = currentPath 
        ? `${classId}/${currentPath}/${newFolderName}/.keep`
        : `${classId}/${newFolderName}/.keep`;

      const { error } = await supabase.storage
        .from('assignment-files')
        .upload(folderPath, new Blob([''], { type: 'text/plain' }));

      if (error) throw error;

      toast({
        title: "Success",
        description: "Folder created successfully"
      });

      setNewFolderName('');
      setShowCreateFolderDialog(false);
      loadFiles();
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive"
      });
    }
  };

  const downloadFile = async (file: FileItem) => {
    try {
      const filePath = currentPath 
        ? `${classId}/${currentPath}/${file.name}`
        : `${classId}/${file.name}`;

      const { data, error } = await supabase.storage
        .from('assignment-files')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive"
      });
    }
  };

  const deleteFile = async (file: FileItem) => {
    if (!window.confirm(`Are you sure you want to delete ${file.name}?`)) return;

    try {
      const filePath = currentPath 
        ? `${classId}/${currentPath}/${file.name}`
        : `${classId}/${file.name}`;

      const { error } = await supabase.storage
        .from('assignment-files')
        .remove([filePath]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "File deleted successfully"
      });

      loadFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive"
      });
    }
  };

  const navigateToFolder = (folderName: string) => {
    setCurrentPath(currentPath ? `${currentPath}/${folderName}` : folderName);
  };

  const navigateUp = () => {
    const pathParts = currentPath.split('/');
    pathParts.pop();
    setCurrentPath(pathParts.join('/'));
  };

  const getFileIcon = (file: FileItem) => {
    if (file.type === 'folder') return Folder;
    return File;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg">
            <Folder className="h-5 w-5 mr-2 text-blue-600" />
            Class Files
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            {userRole === 'teacher' && (
              <>
                <Dialog open={showCreateFolderDialog} onOpenChange={setShowCreateFolderDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <FolderPlus className="h-4 w-4 mr-1" />
                      New Folder
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Folder</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Folder name"
                        onKeyPress={(e) => e.key === 'Enter' && createFolder()}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowCreateFolderDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={createFolder} disabled={!newFolderName.trim()}>
                          Create
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Upload className="h-4 w-4 mr-1" />
                      Upload
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upload Files</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <input
                        type="file"
                        multiple
                        onChange={(e) => setUploadFiles(e.target.files)}
                        className="w-full p-2 border rounded"
                      />
                      {uploadFiles && (
                        <div className="text-sm text-gray-600">
                          {uploadFiles.length} file(s) selected
                        </div>
                      )}
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleFileUpload} disabled={!uploadFiles}>
                          Upload
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>

        {/* Search and Navigation */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search files..."
              className="pl-10"
            />
          </div>
          
          {currentPath && (
            <Button variant="outline" size="sm" onClick={navigateUp}>
              ← Back
            </Button>
          )}
        </div>

        {/* Breadcrumb */}
        {currentPath && (
          <div className="text-sm text-gray-600">
            Path: /{currentPath.split('/').join(' / ')}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse text-muted-foreground">Loading files...</div>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No files found</p>
            {userRole === 'teacher' && (
              <p className="text-xs mt-1">Upload files to get started</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredFiles.map((file) => {
              const Icon = getFileIcon(file);
              return (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                  onClick={() => file.type === 'folder' && navigateToFolder(file.name)}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-5 w-5 ${file.type === 'folder' ? 'text-blue-600' : 'text-gray-600'}`} />
                    <div>
                      <div className="font-medium">{file.name}</div>
                      <div className="text-sm text-gray-500">
                        {file.type === 'file' && file.size && formatFileSize(file.size)}
                        {file.type === 'file' && file.mime_type && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {file.mime_type.split('/')[1]?.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {file.type === 'file' && (
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadFile(file);
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      
                      {userRole === 'teacher' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFile(file);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClassFileManager;