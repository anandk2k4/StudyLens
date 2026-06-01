"use client";

import { useRef, useImperativeHandle, forwardRef } from "react";

export interface VideoPlayerHandle {
  seekTo: (seconds: number) => void;
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, { src: string }>(
  function VideoPlayer({ src }, ref) {
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
        />
      </div>
    );
  },
);
