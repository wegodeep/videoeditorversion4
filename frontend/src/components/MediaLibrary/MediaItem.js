import React from 'react';
import { motion } from 'framer-motion';

const MediaItem = ({ item, onAddToTimeline }) => {
  // Format duration as MM:SS
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Render appropriate thumbnail based on media type
  const renderThumbnail = () => {
    if (item.type === 'video' && item.thumbnail) {
      return (
        <div className="relative">
          <img 
            src={item.thumbnail} 
            alt={item.name} 
            className="media-thumbnail object-cover w-full h-16"
          />
          <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
            {formatDuration(item.duration)}
          </div>
        </div>
      );
    } else if (item.type === 'audio') {
      return (
        <div className="bg-editor-clip-audio h-16 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white opacity-70">
            <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06ZM18.584 5.106a.75.75 0 0 1 1.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 0 1-1.06-1.06 8.25 8.25 0 0 0 0-11.668.75.75 0 0 1 0-1.06Z" />
            <path d="M15.932 7.757a.75.75 0 0 1 1.061 0 6 6 0 0 1 0 8.486.75.75 0 0 1-1.06-1.061 4.5 4.5 0 0 0 0-6.364.75.75 0 0 1 0-1.06Z" />
          </svg>
          <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
            {formatDuration(item.duration)}
          </div>
        </div>
      );
    } else {
      return (
        <div className="bg-editor-clip-text h-16 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white opacity-70">
            <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z" clipRule="evenodd" />
            <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
          </svg>
        </div>
      );
    }
  };
  
  // Handle adding to timeline
  const handleAddToTimeline = () => {
    onAddToTimeline(item);
  };
  
  return (
    <motion.div 
      className="media-item overflow-hidden"
      whileHover={{ y: -2 }}
    >
      {/* Thumbnail */}
      {renderThumbnail()}
      
      {/* Media info */}
      <div className="p-2">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-sm font-medium truncate">{item.name}</h4>
            <p className="text-xs text-editor-text-muted mt-0.5 capitalize">{item.type}</p>
          </div>
          
          <motion.button
            className="ml-2 mt-0.5 text-editor-primary"
            onClick={handleAddToTimeline}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Add to Timeline"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default MediaItem;