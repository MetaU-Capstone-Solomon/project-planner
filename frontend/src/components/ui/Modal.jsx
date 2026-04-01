import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { scaleIn } from '@/constants/motion';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            {...scaleIn}
            className={`relative w-full ${maxWidth} rounded-2xl border border-[var(--border)] bg-[var(--bg-base)] shadow-lg`}
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
              {title ? (
                <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
              ) : (
                <div />
              )}
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
