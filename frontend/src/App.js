import { useState, useRef, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import { motion, AnimatePresence } from "framer-motion";
import Header from "./components/Layout/Header";
import Sidebar from "./components/Layout/Sidebar";
import VideoPreview from "./components/Editor/VideoPreview";
import Timeline from "./components/Timeline/Timeline";
import ControlPanel from "./components/Controls/ControlPanel";
import MediaLibrary from "./components/MediaLibrary/MediaLibrary";
import EffectsPanel from "./components/Effects/EffectsPanel";
import ExportPanel from "./components/Export/ExportPanel";
import "./App.css";

// Initialize ffmpeg
const ffmpeg = createFFmpeg({ 
  log: true,
  corePath: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.js'
});

// Initial project state
const initialProject = {
  name: "Untitled Project",
  currentTime: 0,
  duration: 0,
  tracks: [
    { id: "video-track-1", type: "video", clips: [] },
    { id: "audio-track-1", type: "audio", clips: [] },
    { id: "text-track-1", type: "text", clips: [] }
  ],
  selectedClipId: null,
  zoom: 1,
};

// Sample media clips for the library
const sampleMedia = [
  { 
    id: "sample-1", 
    type: "video", 
    name: "Beach Sunset", 
    duration: 15,
    src: "https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4",
    thumbnail: "https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4"
  },
  { 
    id: "sample-2", 
    type: "video", 
    name: "City Traffic", 
    duration: 12,
    src: "https://assets.mixkit.co/videos/preview/mixkit-highway-in-the-middle-of-a-mountain-range-4633-large.mp4",
    thumbnail: "https://assets.mixkit.co/videos/preview/mixkit-highway-in-the-middle-of-a-mountain-range-4633-large.mp4"
  },
  { 
    id: "sample-3", 
    type: "video", 
    name: "Nature Walk", 
    duration: 18,
    src: "https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4",
    thumbnail: "https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4"
  },
  { 
    id: "sample-4", 
    type: "audio", 
    name: "Upbeat Music", 
    duration: 30,
    src: "https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3"
  },
  { 
    id: "sample-5", 
    type: "audio", 
    name: "Ambient Sounds", 
    duration: 25,
    src: "https://assets.mixkit.co/music/preview/mixkit-sleepy-cat-135.mp3"
  }
];

const VideoEditor = () => {
  const [project, setProject] = useState(initialProject);
  const [activeTab, setActiveTab] = useState("media"); // media, effects, export
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [mediaLibrary, setMediaLibrary] = useState(sampleMedia);
  const videoRef = useRef(null);
  const timelineRef = useRef(null);

  // Load FFmpeg on component mount
  useEffect(() => {
    const load = async () => {
      try {
        if (!ffmpeg.isLoaded()) {
          await ffmpeg.load();
        }
        setIsLoaded(true);
      } catch (error) {
        console.error("Failed to load FFmpeg:", error);
      }
    };
    
    load();
  }, []);

  // Add clip to timeline
  const addClipToTimeline = (mediaItem) => {
    setProject(prev => {
      // Find the appropriate track for this media type
      const trackIndex = prev.tracks.findIndex(track => track.type === mediaItem.type);
      if (trackIndex === -1) return prev;
      
      // Get the last clip in the track to position the new clip
      const trackClips = prev.tracks[trackIndex].clips;
      const lastClipEnd = trackClips.length > 0 
        ? Math.max(...trackClips.map(clip => clip.start + clip.duration))
        : 0;
      
      // Create a new clip
      const newClip = {
        id: `clip-${Date.now()}`,
        mediaId: mediaItem.id,
        type: mediaItem.type,
        name: mediaItem.name,
        start: lastClipEnd,
        duration: mediaItem.duration,
        src: mediaItem.src
      };
      
      // Update the tracks with the new clip
      const updatedTracks = [...prev.tracks];
      updatedTracks[trackIndex] = {
        ...updatedTracks[trackIndex],
        clips: [...updatedTracks[trackIndex].clips, newClip]
      };
      
      return {
        ...prev,
        tracks: updatedTracks,
        selectedClipId: newClip.id,
        duration: Math.max(prev.duration, lastClipEnd + mediaItem.duration)
      };
    });
  };

  // Handle clip selection
  const selectClip = (clipId) => {
    setProject(prev => ({
      ...prev,
      selectedClipId: clipId
    }));
  };

  // Update clip position
  const updateClipPosition = (clipId, newStart) => {
    setProject(prev => {
      const updatedTracks = prev.tracks.map(track => {
        const clipIndex = track.clips.findIndex(clip => clip.id === clipId);
        if (clipIndex === -1) return track;
        
        const updatedClips = [...track.clips];
        updatedClips[clipIndex] = {
          ...updatedClips[clipIndex],
          start: Math.max(0, newStart)
        };
        
        return { ...track, clips: updatedClips };
      });
      
      // Recalculate project duration
      const newDuration = Math.max(
        ...updatedTracks.flatMap(track => 
          track.clips.map(clip => clip.start + clip.duration)
        ),
        0
      );
      
      return {
        ...prev,
        tracks: updatedTracks,
        duration: newDuration
      };
    });
  };

  // Split clip at the current time
  const splitClip = () => {
    const { currentTime, selectedClipId } = project;
    if (!selectedClipId) return;

    setProject(prev => {
      let clipFound = false;
      const updatedTracks = prev.tracks.map(track => {
        const clipIndex = track.clips.findIndex(clip => clip.id === selectedClipId);
        if (clipIndex === -1) return track;
        
        const clip = track.clips[clipIndex];
        const clipStart = clip.start;
        const clipEnd = clipStart + clip.duration;
        
        // Only split if current time is within the clip
        if (currentTime <= clipStart || currentTime >= clipEnd) return track;
        
        clipFound = true;
        
        // Create two clips from the original
        const clipFirstHalf = {
          ...clip,
          duration: currentTime - clipStart
        };
        
        const clipSecondHalf = {
          ...clip,
          id: `clip-${Date.now()}`,
          start: currentTime,
          duration: clipEnd - currentTime
        };
        
        const updatedClips = [...track.clips];
        updatedClips[clipIndex] = clipFirstHalf;
        updatedClips.push(clipSecondHalf);
        
        return { ...track, clips: updatedClips };
      });
      
      if (!clipFound) return prev;
      
      return {
        ...prev,
        tracks: updatedTracks
      };
    });
  };

  // Delete selected clip
  const deleteSelectedClip = () => {
    const { selectedClipId } = project;
    if (!selectedClipId) return;

    setProject(prev => {
      const updatedTracks = prev.tracks.map(track => {
        const filteredClips = track.clips.filter(clip => clip.id !== selectedClipId);
        return { ...track, clips: filteredClips };
      });
      
      // Recalculate project duration
      const newDuration = Math.max(
        ...updatedTracks.flatMap(track => 
          track.clips.map(clip => clip.start + clip.duration)
        ),
        0
      );
      
      return {
        ...prev,
        tracks: updatedTracks,
        selectedClipId: null,
        duration: newDuration
      };
    });
  };

  // Handle time update
  const handleTimeUpdate = (time) => {
    setProject(prev => ({
      ...prev,
      currentTime: time
    }));
  };

  // Toggle play/pause
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  // Export video
  const exportVideo = async (format, quality) => {
    if (!isLoaded) return;
    
    try {
      setIsExporting(true);
      
      // In a real implementation, this would process the timeline
      // and generate the final video file using FFmpeg
      // For this demo, we'll simulate a delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Sample download code (not actually functional in this demo)
      const url = URL.createObjectURL(new Blob(["video data"], { type: "video/mp4" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.name}.${format}`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
      
      setIsExporting(false);
    } catch (error) {
      console.error("Export failed:", error);
      setIsExporting(false);
    }
  };

  // Handle file upload
  const handleFileUpload = (files) => {
    const newMedia = Array.from(files).map((file, index) => {
      const id = `upload-${Date.now()}-${index}`;
      const type = file.type.startsWith('video') ? 'video' : 
                   file.type.startsWith('audio') ? 'audio' : 'image';
      
      return {
        id,
        type,
        name: file.name,
        duration: 30, // This would normally be extracted from the file
        src: URL.createObjectURL(file),
        thumbnail: type === 'video' ? URL.createObjectURL(file) : null
      };
    });
    
    setMediaLibrary(prev => [...prev, ...newMedia]);
  };

  return (
    <div className="editor-container h-screen flex flex-col bg-editor-bg text-editor-text">
      <Header projectName={project.name} />
      
      <div className="editor-main flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        {/* Main Editor */}
        <div className="editor-workspace flex-1 flex flex-col overflow-hidden">
          {/* Video Preview */}
          <div className="video-preview-container p-4 flex-grow">
            <VideoPreview 
              videoRef={videoRef}
              isPlaying={isPlaying}
              currentTime={project.currentTime}
              duration={project.duration}
              tracks={project.tracks}
              onTimeUpdate={handleTimeUpdate}
            />
          </div>
          
          {/* Timeline */}
          <div className="timeline-container border-t border-editor-border">
            <ControlPanel 
              isPlaying={isPlaying} 
              togglePlay={togglePlay}
              currentTime={project.currentTime}
              duration={project.duration}
              onSplit={splitClip}
              onDelete={deleteSelectedClip}
            />
            <Timeline 
              ref={timelineRef}
              tracks={project.tracks}
              currentTime={project.currentTime}
              duration={project.duration}
              zoom={project.zoom}
              selectedClipId={project.selectedClipId}
              onSelectClip={selectClip}
              onUpdateClip={updateClipPosition}
              onTimeUpdate={handleTimeUpdate}
            />
          </div>
        </div>
        
        {/* Right Panel - Media Library / Effects / Export based on activeTab */}
        <div className="editor-panel w-72 border-l border-editor-border overflow-y-auto editor-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === "media" && (
              <motion.div
                key="media"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <MediaLibrary 
                  media={mediaLibrary} 
                  onAddToTimeline={addClipToTimeline}
                  onFileUpload={handleFileUpload}
                />
              </motion.div>
            )}
            
            {activeTab === "effects" && (
              <motion.div
                key="effects"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <EffectsPanel 
                  selectedClipId={project.selectedClipId}
                  tracks={project.tracks}
                />
              </motion.div>
            )}
            
            {activeTab === "export" && (
              <motion.div
                key="export"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <ExportPanel 
                  projectName={project.name}
                  isExporting={isExporting}
                  onExport={exportVideo}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<VideoEditor />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
