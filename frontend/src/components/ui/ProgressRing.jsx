import { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

export default function ProgressRing({
  progress = 0,
  size = 64,
  strokeWidth = 5,
  className = '',
  label = true,
}) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  const motionProgress = useMotionValue(0);
  const dashOffset = useTransform(motionProgress, v => circumference * (1 - v / 100));

  useEffect(() => {
    const controls = animate(motionProgress, progress, {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1],
    });
    return controls.stop;
  }, [progress]);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <filter id="ring-glow">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#6366f1" floodOpacity="0.4" />
          </filter>
        </defs>
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke="var(--bg-elevated)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: dashOffset }}
          filter="url(#ring-glow)"
        />
      </svg>
      {label && (
        <span className="absolute text-xs font-semibold text-[var(--text-primary)]" style={{ transform: 'rotate(0deg)' }}>
          {Math.round(progress)}%
        </span>
      )}
    </div>
  );
}
