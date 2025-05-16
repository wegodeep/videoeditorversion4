import React, { forwardRef, useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import TimeScale from './TimeScale';
import Track from './Track';

const Timeline = forwardRef(({
  tracks,
  currentTime,
  duration,
  zoom,
  selectedClipId,
  onSelectClip,
  onUpdateClip,
  onTimeUpdate
}, ref) => {
  const timelineRef = useRef(null);
  const containerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [timelineWidth, setTimelineWidth] = useState(0);
  
  // Calculate pixel per second based on zoom factor
  const pixelsPerSecond = 100 * zoom;
  
  // Calculate timeline content width
  useEffect(() => {
    const width = Math.max(duration * pixelsPerSecond, 1000);
    setTimelineWidth(width);
  }, [duration, pixelsPerSecond]);
  
  // Measure container width for time scale
  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          setContainerWidth(entry.contentRect.width);
        }
      });
      
      resizeObserver.observe(containerRef.current);
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, []);
  
  // Handle timeline click to update current time
  const handleTimelineClick = (e) => {
    if (isDraggingRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const scrollLeft = containerRef.current.scrollLeft;
    const newTime = (offsetX + scrollLeft) / pixelsPerSecond;
    
    onTimeUpdate(Math.max(0, Math.min(newTime, duration)));
  };
  
  // Auto-scroll to keep the playhead visible during playback
  useEffect(() => {
    if (!containerRef.current) return;
    
    const playheadPosition = currentTime * pixelsPerSecond;
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    // Only auto-scroll if playhead is getting close to the edges
    const threshold = containerRect.width * 0.2;
    
    if (playheadPosition < container.scrollLeft + threshold) {
      container.scrollLeft = Math.max(0, playheadPosition - threshold);
    } else if (playheadPosition > container.scrollLeft + containerRect.width - threshold) {
      container.scrollLeft = Math.min(
        container.scrollWidth - containerRect.width,
        playheadPosition - containerRect.width + threshold
      );
    }
  }, [currentTime, pixelsPerSecond]);
  
  // Render playhead at current time position
  const renderPlayhead = () => {
    const playheadPosition = currentTime * pixelsPerSecond;
    
    return (
      <div 
        className="current-time-indicator"
        style={{ left: `${playheadPosition}px` }}
      />
    );
  };
  
  return (
    <div className="timeline-component flex flex-col h-full bg-editor-timeline">
      <TimeScale 
        duration={duration} 
        pixelsPerSecond={pixelsPerSecond}
        containerWidth={containerWidth}
      />
      
      <div 
        ref={containerRef}
        className="timeline-scroll editor-scrollbar"
      >
        <div 
          ref={timelineRef}
          className="timeline-content"
          style={{ width: `${timelineWidth}px` }}
          onClick={handleTimelineClick}
        >
          {tracks.map((track) => (
            <Track
              key={track.id}
              track={track}
              pixelsPerSecond={pixelsPerSecond}
              selectedClipId={selectedClipId}
              onSelectClip={onSelectClip}
              onUpdateClip={onUpdateClip}
              isDraggingRef={isDraggingRef}
            />
          ))}
          
          {renderPlayhead()}
        </div>
      </div>
    </div>
  );
});

Timeline.displayName = 'Timeline';

export default Timeline;