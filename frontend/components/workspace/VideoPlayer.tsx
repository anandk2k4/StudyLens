"use client";
// components/workspace/VideoPlayer.tsx
// Added onTimeUpdate prop so ChaptersTab can track active chapter

import { useRef, useImperativeHandle, forwardRef } from "react";

export interface VideoPlayerHandle {
  seekTo: (seconds: number) => void;
}

interface VideoPlayerProps {
  src:           string;
  onTimeUpdate?: (currentTime: number) => void;   // ← NEW
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  function VideoPlayer({ src, onTimeUpdate }, ref) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useImperativeHandle(ref, () => ({
      seekTo(seconds: number) {
        if (videoRef.current) {
          videoRef.current.currentTime = seconds;
          videoRef.current.play();
        }
      },
    }));

    return (
      <div className="video-player-wrap">
        <video
          ref={videoRef}
          controls
          src={src}
          className="video-el"
          preload="metadata"
          onTimeUpdate={() => {
            if (onTimeUpdate && videoRef.current) {
              onTimeUpdate(videoRef.current.currentTime);
            }
          }}
        />
      </div>
    );
  }
);