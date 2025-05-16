import React, { useEffect, useState } from 'react';
import ReactPlayer from 'react-player';
import { motion } from 'framer-motion';

const VideoPreview = ({ videoRef, isPlaying, currentTime, duration, tracks, onTimeUpdate }) => {
  const [activeVideo, setActiveVideo] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Find the video clip at the current time position
  useEffect(() => {
    const videoTrack = tracks.find(track => track.type === 'video');
    if (!videoTrack || !videoTrack.clips.length) {
      setActiveVideo(null);
      return;
    }

    // Find clips that overlap with the current time
    const activeClips = videoTrack.clips.filter(clip => {
      const start = clip.start;
      const end = clip.start + clip.duration;
      return currentTime >= start && currentTime < end;
    });

    // Use the first found clip (in a real editor, this would be more complex with compositing)
    setActiveVideo(activeClips[0] || null);
  }, [currentTime, tracks]);

  // Update time when playing
  useEffect(() => {
    if (!isPlaying || !videoRef.current || !isReady) return;
    
    const timer = setInterval(() => {
      if (videoRef.current) {
        const newTime = videoRef.current.getCurrentTime();
        onTimeUpdate(newTime);
      }
    }, 50);

    return () => clearInterval(timer);
  }, [isPlaying, isReady, onTimeUpdate, videoRef]);

  // Handle video progress for loading indicator
  const handleProgress = ({ loaded, loadedSeconds, played, playedSeconds }) => {
    setLoadingProgress(loaded);
  };

  // Handle when video is ready to play
  const handleReady = () => {
    setIsReady(true);
    setLoadingProgress(1);
  };

  // Seek to the specific time
  useEffect(() => {
    if (videoRef.current && isReady) {
      videoRef.current.seekTo(currentTime, 'seconds');
    }
  }, [currentTime, isReady, videoRef]);

  // If there's a video clip, render it in the player
  const renderPlayer = () => {
    if (activeVideo) {
      return (
        <ReactPlayer
          ref={videoRef}
          url={activeVideo.src}
          playing={isPlaying}
          controls={false}
          width="100%"
          height="100%"
          onProgress={handleProgress}
          onReady={handleReady}
          progressInterval={100}
          config={{
            file: {
              attributes: {
                className: 'video-player'
              }
            }
          }}
        />
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative">
      {/* Video player container */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Loading indicator */}
        {loadingProgress < 1 && activeVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
            <div className="loading-spinner"></div>
          </div>
        )}
        
        {/* Video player */}
        <div className="w-full h-full">
          {renderPlayer()}
        </div>
        
        {/* Empty state when no video is active */}
        {!activeVideo && (
          <div className="w-full h-full flex flex-col items-center justify-center text-editor-text-muted">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center p-6"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 mx-auto mb-4 opacity-20">
                <path fillRule="evenodd" d="M2.25 5.25a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3V15a3 3 0 0 1-3 3h-3v.257c0 .597.237 1.17.659 1.591l.621.622a.75.75 0 0 1-.53 1.28h-9a.75.75 0 0 1-.53-1.28l.621-.622a2.25 2.25 0 0 0 .659-1.59V18h-3a3 3 0 0 1-3-3V5.25Zm1.5 0v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5Z" clipRule="evenodd" />
              </svg>
              <h3 className="text-xl font-medium mb-2">No Video Selected</h3>
              <p className="text-sm opacity-70">Add media from the library panel to get started</p>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPreview;