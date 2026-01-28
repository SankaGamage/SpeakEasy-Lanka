import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  isActive: boolean;
  volume: number; // 0 to 1
  mode: 'listening' | 'speaking' | 'idle';
}

export const Visualizer: React.FC<VisualizerProps> = ({ isActive, volume, mode }) => {
  // We'll create a simple CSS-based animation that reacts to volume
  
  // Create 5 bars
  const bars = [0, 1, 2, 3, 4];

  return (
    <div className="flex items-center justify-center gap-2 h-24 w-full">
      {bars.map((i) => {
        // Calculate dynamic height based on volume and random variation
        // If idle, show small height.
        // If mode is 'speaking' (AI), we might just animate generally since we don't have perfect output vol.
        // If mode is 'listening' (User), we use the volume prop.
        
        let heightClass = "h-2";
        let animationClass = "";
        let colorClass = "bg-teal-200";

        if (isActive) {
           colorClass = mode === 'listening' ? "bg-teal-500" : "bg-teal-400";
           
           if (mode === 'listening') {
             // Scale height by volume
             // To make it look "alive", we add some noise based on index
             const volHeight = Math.max(10, Math.min(100, volume * 100 + (Math.random() * 20)));
             // Since we can't easily do dynamic pixels in tailwind classes without inline styles:
             return (
               <div
                 key={i}
                 className={`w-3 rounded-full transition-all duration-75 ${colorClass}`}
                 style={{ height: `${volHeight}%` }}
               />
             );
           } else {
             // AI Speaking - pulse animation
             animationClass = "animate-pulse";
             // Randomize heights for talking effect
             const randomHeight = 40 + Math.random() * 60;
              return (
               <div
                 key={i}
                 className={`w-3 rounded-full transition-all duration-200 ${colorClass}`}
                 style={{ height: `${randomHeight}%` }}
               />
             );
           }
        }

        return (
          <div
            key={i}
            className={`w-3 h-2 rounded-full transition-all duration-300 ${colorClass}`}
          />
        );
      })}
    </div>
  );
};
