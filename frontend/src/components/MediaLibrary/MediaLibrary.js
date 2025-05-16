import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import MediaItem from './MediaItem';

const MediaLibrary = ({ media, onAddToTimeline, onFileUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  
  // Handle file drop with react-dropzone
  const onDrop = useCallback((acceptedFiles) => {
    onFileUpload(acceptedFiles);
    setDragActive(false);
  }, [onFileUpload]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': [],
      'audio/*': [],
      'image/*': []
    }
  });
  
  // Effect when drag is active
  React.useEffect(() => {
    setDragActive(isDragActive);
  }, [isDragActive]);
  
  return (
    <div className="media-library">
      <h2 className="text-lg font-semibold mb-4">Media Library</h2>
      
      {/* Upload area */}
      <div 
        {...getRootProps()} 
        className={`upload-area mb-6 ${dragActive ? 'bg-editor-primary bg-opacity-10 border-editor-primary' : ''}`}
      >
        <input {...getInputProps()} />
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 mx-auto mb-2 text-editor-text-muted">
          <path fillRule="evenodd" d="M11.47 2.47a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1-1.06 1.06l-3.22-3.22V16.5a.75.75 0 0 1-1.5 0V4.81L8.03 8.03a.75.75 0 0 1-1.06-1.06l4.5-4.5ZM3 15.75a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
        </svg>
        <p className="text-sm font-medium">Drag & drop files here</p>
        <p className="text-xs text-editor-text-muted mt-1">or click to browse</p>
      </div>
      
      {/* Media items */}
      <div className="media-items space-y-3 overflow-y-auto">
        <AnimatePresence>
          {media.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <MediaItem item={item} onAddToTimeline={onAddToTimeline} />
            </motion.div>
          ))}
        </AnimatePresence>
        
        {media.length === 0 && (
          <div className="text-center py-8 text-editor-text-muted">
            <p className="text-sm">No media items found</p>
            <p className="text-xs mt-1">Upload files to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaLibrary;