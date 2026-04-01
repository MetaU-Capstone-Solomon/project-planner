import { motion } from 'framer-motion';
import { spring } from '@/constants/motion';

export default function Card({ children, className = '', onClick, hoverable = true }) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={hoverable ? { y: -4, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' } : {}}
      transition={spring.smooth}
      className={`
        rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]
        shadow-sm transition-shadow
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}
