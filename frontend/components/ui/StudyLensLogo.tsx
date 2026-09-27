"use client";

import React from "react";
import Image from "next/image";

interface StudyLensLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  className?: string;
}

export function StudyLensLogo({
  size = "md",
  showText = true,
  showBadge = false,
  badgeText = "AI",
  className = "",
}: StudyLensLogoProps) {
  const heights = {
    sm: 28,
    md: 36,
    lg: 48,
    xl: 64,
  };

  const imgHeight = heights[size] || 36;

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {showText ? (
        <div className="flex items-center gap-2">
          <Image
            src="/studylens-brand-logo.png"
            alt="StudyLens"
            width={imgHeight * 4.5}
            height={imgHeight}
            className="w-auto"
            style={{ height: imgHeight }}
            priority
          />
          {showBadge && (
            <span
              className={`rounded-md border border-[#00D9C0]/30 bg-[#00D9C0]/15 px-1.5 py-0.5 font-mono font-bold tracking-wider text-[#00D9C0] uppercase text-[10px]`}
            >
              {badgeText}
            </span>
          )}
        </div>
      ) : (
        /* Collapsed sidebar: show the actual S mark icon */
        <Image
          src="/studylens-icon.png"
          alt="StudyLens"
          width={imgHeight}
          height={imgHeight}
          className="rounded-lg"
          style={{ width: imgHeight, height: imgHeight }}
        />
      )}
    </div>
  );
}
