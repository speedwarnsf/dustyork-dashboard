"use client";

import Image from "next/image";
import { useState } from "react";

type OptimizedImageProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: "blur" | "empty";
  fallback?: string;
  onLoad?: () => void;
  onError?: () => void;
};

export default function OptimizedImage({
  src,
  alt,
  width = 400,
  height = 200,
  className = "",
  priority = false,
  placeholder = "empty",
  fallback,
  onLoad,
  onError
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Use fallback image if main image fails or use a default pattern
  const imageSrc = hasError 
    ? (fallback || `data:image/svg+xml;base64,${btoa(`
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="${width}" height="${height}" fill="#050505"/>
          <rect x="0" y="0" width="${width}" height="1" fill="#1a1a1a"/>
          <rect x="0" y="${height-1}" width="${width}" height="1" fill="#1a1a1a"/>
          <rect x="0" y="0" width="1" height="${height}" fill="#1a1a1a"/>
          <rect x="${width-1}" y="0" width="1" height="${height}" fill="#1a1a1a"/>
          <text x="${width/2}" y="${height/2}" text-anchor="middle" dominant-baseline="middle" fill="#1a1a1a" font-family="monospace" font-size="10">NO PREVIEW</text>
        </svg>
      `)}`)
    : src;

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Loading placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-[#050505] flex items-center justify-center">
          <div className="shimmer w-full h-full" />
        </div>
      )}
      
      <Image
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        className={`transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        } ${className}`}
        priority={priority}
        placeholder={placeholder}
        quality={hasError ? 100 : 85}
        unoptimized={imageSrc.startsWith("http") || hasError}
        onLoad={handleLoad}
        onError={handleError}
        sizes={`
          (max-width: 768px) 100vw,
          (max-width: 1024px) 50vw,
          33vw
        `}
      />
      
      {/* Gradient overlay for better text readability */}
      {isLoaded && !hasError && (
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#080808]/80 to-transparent pointer-events-none" />
      )}
    </div>
  );
}