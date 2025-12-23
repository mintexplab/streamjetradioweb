import { useEffect, useRef, useState } from 'react';
import { useRadioPlayer } from '@/hooks/useRadioPlayer';

interface AudioVisualizerProps {
  barCount?: number;
  className?: string;
}

export function AudioVisualizer({ barCount = 5, className = '' }: AudioVisualizerProps) {
  const { isPlaying } = useRadioPlayer();
  const [heights, setHeights] = useState<number[]>(Array(barCount).fill(20));
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!isPlaying) {
      setHeights(Array(barCount).fill(20));
      return;
    }

    const animate = () => {
      setHeights(prev => 
        prev.map(() => {
          // Generate random heights between 20% and 100%
          return Math.random() * 80 + 20;
        })
      );
      animationRef.current = requestAnimationFrame(() => {
        setTimeout(animate, 150); // Update every 150ms for smooth animation
      });
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, barCount]);

  if (!isPlaying) return null;

  return (
    <div className={`flex items-end gap-0.5 h-6 ${className}`}>
      {heights.map((height, index) => (
        <div
          key={index}
          className="w-1 bg-primary rounded-full transition-all duration-150 ease-out"
          style={{ 
            height: `${height}%`,
            animationDelay: `${index * 50}ms`
          }}
        />
      ))}
    </div>
  );
}
