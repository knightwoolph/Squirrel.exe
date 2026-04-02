import { useEffect, useState } from 'react';
import ReactConfetti from 'react-confetti';

interface ConfettiProps {
  run: boolean;
  onComplete?: () => void;
  duration?: number;
  numberOfPieces?: number;
}

export function Confetti({
  run,
  onComplete,
  duration = 3000,
  numberOfPieces = 200,
}: ConfettiProps) {
  const [isActive, setIsActive] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Track window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Run confetti when triggered
  useEffect(() => {
    if (run && !isActive) {
      setIsActive(true);

      // Stop after duration
      const timer = setTimeout(() => {
        setIsActive(false);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [run, duration, onComplete, isActive]);

  if (!isActive) return null;

  return (
    <ReactConfetti
      width={windowSize.width}
      height={windowSize.height}
      numberOfPieces={numberOfPieces}
      recycle={false}
      gravity={0.3}
      colors={[
        '#d4a574', // Acorn brown
        '#8B4513', // Saddle brown
        '#228B22', // Forest green
        '#FFD700', // Gold
        '#FF6B6B', // Coral red
        '#4ECDC4', // Teal
      ]}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    />
  );
}

// Custom hook for easy confetti triggering
import { create } from 'zustand';

interface ConfettiState {
  isRunning: boolean;
  trigger: () => void;
  stop: () => void;
}

export const useConfetti = create<ConfettiState>((set) => ({
  isRunning: false,
  trigger: () => set({ isRunning: true }),
  stop: () => set({ isRunning: false }),
}));

// Global confetti component to be used once at app level
export function GlobalConfetti() {
  const { isRunning, stop } = useConfetti();

  return <Confetti run={isRunning} onComplete={stop} />;
}
