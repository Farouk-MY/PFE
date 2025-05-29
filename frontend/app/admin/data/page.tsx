"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/components/language-provider';
import '@/i18n';
import { AdminSidebar } from '@/components/admin-sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Upload, 
  Trash2, 
  File as FileIcon,
  X,
  Search,
  Filter,
  Download,
  FileJson,
  FileSpreadsheet 
} from 'lucide-react';
import { useDocumentStore, Document } from '@/store';

// Interface to convert Document from store to UI format
interface ImportedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
  status: 'processing' | 'completed' | 'error';
}

export default function DataImportPage() {
  // Initialize i18n translation
  const { t } = useTranslation(['data', 'common']);
  const { language } = useLanguage();
  
  // Get document store state and actions
  const { 
    documents, 
    isLoading, 
    isUploading, 
    error, 
    fetchDocuments, 
    uploadDocuments, 
    deleteDocument 
  } = useDocumentStore();
  
  // Load documents when the page loads
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<ImportedFile | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): boolean => {
    const validTypes = ['application/pdf', 'text/csv', 'application/json', 'text/plain'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload PDF, CSV, JSON, or TXT files only.');
      return false;
    }

    if (file.size > maxSize) {
      toast.error('File is too large. Maximum size is 10MB.');
      return false;
    }

    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFiles = async (uploadedFiles: File[]) => {
    const validFiles = uploadedFiles.filter(validateFile);

    if (validFiles.length === 0) return;
    
    // Use the document store to upload files
    await uploadDocuments(validFiles);
  };
  
  // Convert documents from store to ImportedFile format for UI
  const files: ImportedFile[] = documents.map((doc: Document) => {
    // Extract file size from metadata - check for both size and size_bytes
    let fileSize = 0;
    
    if (doc.metadata) {
      // First check for size property since that's what we now standardize on
      if (doc.metadata.size !== undefined) {
        fileSize = doc.metadata.size;
      } 
      // Fall back to size_bytes if size is not available
      else if (doc.metadata.size_bytes !== undefined) {
        fileSize = doc.metadata.size_bytes;
      }
    }
    
    return {
      id: doc.id,
      name: doc.name,
      // Ensure document_type is properly handled, defaulting to file extension if not available
      type: doc.document_type || getFileTypeFromName(doc.name),
      // Use the extracted file size
      size: fileSize,
      // Convert string date to Date object
      uploadedAt: new Date(doc.created_at),
      // Ensure status has a valid value
      status: doc.status || 'completed'
    };
  });

  // Helper function to get file type from filename
  const getFileTypeFromName = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase();
    if (!extension) return 'unknown';
    
    switch (extension) {
      case 'pdf': return 'pdf';
      case 'csv': return 'csv';
      case 'json': return 'json';
      case 'txt': return 'text';
      default: return 'unknown';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleDelete = async () => {
    if (!selectedFile) return;

    // Use the document store to delete the file
    await deleteDocument(selectedFile.id);
    setDeleteDialogOpen(false);
    setSelectedFile(null);
  };

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return (
          <div className="flex items-center justify-center h-8 w-8 rounded-md bg-red-100 dark:bg-red-900/20">
            <FileText className="h-5 w-5 text-red-500" />
          </div>
        );
      case 'csv':
        return (
          <div className="flex items-center justify-center h-8 w-8 rounded-md bg-green-100 dark:bg-green-900/20">
            <FileSpreadsheet className="h-5 w-5 text-green-500" />
          </div>
        );
      case 'json':
        return (
          <div className="flex items-center justify-center h-8 w-8 rounded-md bg-yellow-100 dark:bg-yellow-900/20">
            <FileJson className="h-5 w-5 text-yellow-500" />
          </div>
        );
      case 'text':
        return (
          <div className="flex items-center justify-center h-8 w-8 rounded-md bg-blue-100 dark:bg-blue-900/20">
            <FileText className="h-5 w-5 text-blue-500" />
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-8 w-8 rounded-md bg-gray-100 dark:bg-gray-800">
            <FileIcon className="h-5 w-5 text-gray-500" />
          </div>
        );
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return `0 ${t('fileSize.bytes')}`;
    const k = 1024;
    const sizes = [t('fileSize.bytes'), t('fileSize.kb'), t('fileSize.mb'), t('fileSize.gb')];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 hover:bg-green-600 text-white';
      case 'processing':
        return 'bg-blue-500 hover:bg-blue-600 text-white';
      case 'error':
        return 'bg-red-500 hover:bg-red-600 text-white';
      default:
        return 'bg-gray-500 hover:bg-gray-600 text-white';
    }
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50/50 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/50">
      <AdminSidebar />
      
      <div className="flex-1 p-8">
        <Card className="border-0 shadow-xl">
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2">{t('pageTitle')}</h1>
              <p className="text-muted-foreground">
                {t('pageDescription')}
              </p>
            </div>

            {/* File Upload Area */}
            <div
              className={`relative mb-6 rounded-lg border-2 border-dashed p-8 text-center transition-all ${
                dragActive 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border hover:border-primary/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                accept=".pdf,.csv,.json,.txt"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center gap-2 cursor-pointer"
              >
                <Upload className={`h-10 w-10 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="font-medium">
                  {isUploading ? t('common:loading') : t('dragDropArea.description')}
                </span>
                <span className="text-sm text-muted-foreground">
                  {t('dragDropArea.supportedFormats')}
                </span>
              </label>
            </div>

            {/* File List */}
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="h-[calc(100vh-24rem)] rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('fileTable.name')}</TableHead>
                    <TableHead>{t('fileTable.type')}</TableHead>
                    <TableHead>{t('fileTable.size')}</TableHead>
                    <TableHead>{t('fileTable.uploadDate')}</TableHead>
                    <TableHead>{t('fileTable.status')}</TableHead>
                    <TableHead className="text-right">{t('fileTable.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFiles.map((file) => (
                      <TableRow key={file.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            {getFileIcon(file.type)}
                            <span className="truncate max-w-[200px]" title={file.name}>
                              {file.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {file.type ? file.type.toUpperCase() : 'UNKNOWN'}
                        </TableCell>
                        <TableCell>
                          {formatFileSize(file.size)}
                        </TableCell>
                        <TableCell>
                          {file.uploadedAt.toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={getStatusBadgeStyles(file.status || 'unknown')}
                          >
                            {file.status ? t(`fileStatus.${file.status}`) : file.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                // Handle download
                                toast.success('Downloading file...');
                              }}
                            >
                              <Download className="h-4 w-4" aria-label={t('actions.download')} />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-red-500 hover:text-red-600"
                              onClick={() => {
                                setSelectedFile(file);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" aria-label={t('actions.delete')} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredFiles.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <FileText className="h-8 w-8" />
                            <p>{t('noFiles')}</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </div>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDialog.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('deleteDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              {t('deleteDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}