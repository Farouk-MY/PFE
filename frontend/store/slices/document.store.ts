import { create } from "zustand";
import { toast } from "sonner";

// Document interfaces
export interface Document {
  id: string;
  name: string;
  document_type: string;
  metadata?: {
    size?: number;
    size_bytes?: number;
    [key: string]: any;
  };
  created_at: string;
  status: 'processing' | 'completed' | 'error';
}

// Interface for the document store state
interface DocumentState {
  documents: Document[];
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
  
  // Actions
  fetchDocuments: () => Promise<void>;
  uploadDocuments: (files: File[]) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
  setError: (error: string | null) => void;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  isLoading: false,
  isUploading: false,
  error: null,

  fetchDocuments: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_CHAT_API_URL}/api/v1/admin/documents`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform the data to properly extract size from metadata
      const transformedDocuments = data.documents.map((doc: any) => {
        // Create a standardized metadata object
        let standardizedMetadata = { size: 0 };
        
        // Extract size from metadata, prioritizing size_bytes if available
        if (doc.metadata && typeof doc.metadata === 'object') {
          // If size_bytes exists, use it as the primary size value
          if (doc.metadata.size_bytes !== undefined) {
            standardizedMetadata.size = doc.metadata.size_bytes;
          } 
          // Fall back to size if size_bytes doesn't exist
          else if (doc.metadata.size !== undefined) {
            standardizedMetadata.size = doc.metadata.size;
          }
          
          // Preserve other metadata fields
          standardizedMetadata = { ...doc.metadata, ...standardizedMetadata };
        }
        
        return {
          ...doc,
          metadata: standardizedMetadata,
          // Ensure status has a default value
          status: doc.status || 'completed'
        };
      });
      
      set({ documents: transformedDocuments, isLoading: false });
      console.log('Fetched documents with transformed metadata:', transformedDocuments);
    } catch (error) {
      console.error('Error fetching documents:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load documents', 
        isLoading: false 
      });
    }
  },

  uploadDocuments: async (files: File[]) => {
    set({ isUploading: true, error: null });
    
    try {
      // Create temporary document entries with processing status
      const tempDocuments = files.map(file => ({
        id: Math.random().toString(36).substring(7),
        name: file.name,
        document_type: file.type && file.type.toLowerCase().includes('pdf') ? 'PDF' : 
                      file.type && file.type.toLowerCase().includes('csv') ? 'CSV' : 
                      file.type && file.type.toLowerCase().includes('json') ? 'JSON' : 'TEXT',
        metadata: { size: file.size },
        created_at: new Date().toISOString(),
        status: 'processing' as const
      }));
      
      // Add temporary documents to the state
      set(state => ({ 
        documents: [...state.documents, ...tempDocuments] 
      }));
      
      // Process each file
      const uploadedDocuments: Document[] = [];
      
      for (const [index, file] of files.entries()) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name);
        formData.append('description', `Uploaded ${file.name}`);
        
        // Map file types to the correct lowercase document_type values expected by the API
        let documentType = 'text';
        if (file.type && file.type.toLowerCase().includes('pdf')) {
          documentType = 'pdf';
        } else if (file.type && file.type.toLowerCase().includes('csv')) {
          documentType = 'csv';
        } else if (file.type && file.type.toLowerCase().includes('json')) {
          documentType = 'json';
        }
        
        formData.append('document_type', documentType);
        
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_CHAT_API_URL}/api/v1/admin/documents/upload`, {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
          }
          
          const data = await response.json();
          
          // Prepare metadata, prioritizing size_bytes if available
          const metadata = { 
            ...tempDocuments[index].metadata,
            ...data.metadata
          };
          
          // Ensure the size is properly set
          if (data.metadata?.size_bytes !== undefined) {
            metadata.size = data.metadata.size_bytes;
          } else if (file.size) {
            metadata.size = file.size;
          }
          
          // Update the document with the real ID from the server and updated metadata
          uploadedDocuments.push({
            ...tempDocuments[index],
            id: data.id,
            metadata: metadata,
            status: 'completed' as const
          });
          
        } catch (error) {
          console.error('Error uploading file:', error);
          uploadedDocuments.push({
            ...tempDocuments[index],
            status: 'error' as const
          });
        }
      }
      
      // Update the documents list with the actual results
      set(state => ({
        documents: state.documents.map(doc => {
          const uploaded = uploadedDocuments.find(u => u.name === doc.name);
          return uploaded || doc;
        })
      }));
      
      const successCount = uploadedDocuments.filter(doc => doc.status === 'completed').length;
      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} file(s)`);
      }
      
      // Refresh the documents list from the server
      await get().fetchDocuments();
      
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error uploading files', 
      });
      toast.error('Error uploading files. Please try again.');
    } finally {
      set({ isUploading: false });
    }
  },

  deleteDocument: async (documentId: string) => {
    try {
      // Set loading state for UI feedback
      set(state => ({
        isLoading: true,
        error: null
      }));
      
      // Call the backend API to delete the document
      const response = await fetch(`${process.env.NEXT_PUBLIC_CHAT_API_URL}/api/v1/admin/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }

      // Update the local state to remove the deleted document
      set(state => ({
        documents: state.documents.filter(doc => doc.id !== documentId),
        isLoading: false
      }));
      
      toast.success('Document deleted successfully from database and vector store');
    } catch (error) {
      console.error('Error deleting document:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error deleting document',
        isLoading: false
      });
      toast.error('Error deleting document');
    }
  },

  setError: (error: string | null) => set({ error })
}));