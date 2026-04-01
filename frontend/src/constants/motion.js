// frontend/src/constants/motion.js

export const spring = {
  snappy: { type: 'spring', stiffness: 400, damping: 30 },
  smooth: { type: 'spring', stiffness: 300, damping: 28 },
  lazy:   { type: 'spring', stiffness: 200, damping: 25 },
};

export const fade = {
  in:  { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.25 } },
  out: { exit: { opacity: 0, y: -8 }, transition: { duration: 0.15 } },
};

export const stagger = {
  container: {
    animate: { transition: { staggerChildren: 0.06 } },
  },
  item: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
  },
};

export const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 25 } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 28 } },
  exit:    { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
};
