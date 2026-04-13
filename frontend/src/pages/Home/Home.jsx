import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Target, Users } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import Button from '@/components/ui/Button';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { stagger } from '@/constants/motion';

const FAKE_CARDS = [
  {
    title: 'E-Commerce Platform',
    phase: 'Phase 2 of 4 · Backend API',
    progress: 48,
    tags: ['React', 'Node.js', 'PostgreSQL'],
  },
  {
    title: 'Mobile Fitness App',
    phase: 'Phase 1 of 3 · MVP Setup',
    progress: 72,
    tags: ['React Native', 'Firebase'],
  },
  {
    title: 'AI Document Tool',
    phase: 'Phase 3 of 5 · Integration',
    progress: 31,
    tags: ['Python', 'OpenAI', 'FastAPI'],
  },
];

const FEATURES = [
  { icon: Zap,    title: 'Generate in seconds',  desc: 'AI builds your full roadmap from a description or document upload.' },
  { icon: Target, title: 'Track everything',      desc: 'Phases, milestones, tasks, and progress rings — all in one place.' },
  { icon: Users,  title: 'Collaborate',           desc: 'Invite your team, assign work, connect Claude Code via MCP.' },
];

function HeroCardStack() {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      el.style.setProperty('--rx', `${y * 10}deg`);
      el.style.setProperty('--ry', `${x * -10}deg`);
    };
    const handleMouseLeave = () => {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    };
    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative hidden lg:flex items-center justify-center"
      style={{ perspective: '1000px', width: 380, height: 420 }}
    >
      {FAKE_CARDS.map((card, i) => {
        const depths  = ['-20px', '-10px', '0px'];
        const rotateY = ['-8deg', '-4deg', '0deg'];
        const rotateX = ['4deg', '2deg', '0deg'];
        const translateX = ['-24px', '-10px', '0px'];
        const depth = [0.3, 0.6, 1][i];
        return (
          <div
            key={card.title}
            className="absolute w-72 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-lg"
            style={{
              transform: `rotateX(calc(var(--rx, 0deg) * ${depth})) rotateY(calc(var(--ry, 0deg) * ${depth})) rotateY(${rotateY[i]}) rotateX(${rotateX[i]}) translateX(${translateX[i]}) translateZ(${depths[i]})`,
              transition: 'transform 0.15s ease-out',
              transformStyle: 'preserve-3d',
              zIndex: i,
            }}
          >
            <p className="mb-1 text-xs text-[var(--text-muted)]">{card.phase}</p>
            <p className="mb-3 font-semibold text-[var(--text-primary)]">{card.title}</p>
            <div className="mb-3 h-1.5 w-full rounded-full bg-[var(--bg-elevated)]">
              <div
                className="h-full rounded-full bg-[var(--accent)]"
                style={{ width: `${card.progress}%` }}
              />
            </div>
            <div className="flex gap-1.5">
              {card.tags.map(t => (
                <span key={t} className="rounded-full bg-[var(--accent-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
                  {t}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg-base)]">
      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 sm:px-10">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent)]">
            <span className="text-xs font-bold text-white">PP</span>
          </div>
          <span className="font-semibold text-[var(--text-primary)]">ProjectPlanner</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.AUTH)}>
            Sign in
          </Button>
          <Button size="sm" onClick={() => navigate(ROUTES.AUTH)}>
            Get Started <ArrowRight size={14} />
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto flex max-w-7xl flex-col items-center gap-16 px-6 py-20 lg:flex-row lg:py-32 sm:px-10">
        {/* Left */}
        <motion.div
          variants={stagger.container}
          initial="initial"
          animate="animate"
          className="flex-1"
        >
          <motion.h1
            variants={stagger.item}
            transition={{ duration: 0.4 }}
            className="mb-5 text-5xl font-extrabold leading-tight tracking-tight text-[var(--text-primary)] sm:text-6xl"
          >
            Turn your idea into a roadmap.{' '}
            <span style={{ color: 'var(--accent)' }}>Ship it.</span>
          </motion.h1>
          <motion.p
            variants={stagger.item}
            transition={{ duration: 0.3 }}
            className="mb-8 max-w-lg text-lg text-[var(--text-secondary)]"
          >
            Describe your project, upload a doc, or start from scratch. We generate a custom step-by-step roadmap with phases, tasks, and learning resources — tailored to your level.
          </motion.p>
          <motion.div variants={stagger.item} transition={{ duration: 0.3 }} className="flex gap-3">
            <Button size="lg" onClick={() => navigate(ROUTES.AUTH)}>
              Get Started free <ArrowRight size={16} />
            </Button>
            <button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150 h-11 px-6 text-base gap-2 border border-[var(--text-primary)] text-black hover:bg-[var(--bg-elevated)]"
            >
              See how it works
            </button>
          </motion.div>
        </motion.div>

        {/* Right — 3D card stack */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 25 }}
          className="flex-1 flex justify-center"
        >
          <HeroCardStack />
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 mx-auto max-w-7xl px-6 pb-32 sm:px-10">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid gap-6 sm:grid-cols-3"
        >
          {FEATURES.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 200, damping: 25 }}
              className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-subtle)]">
                <Icon size={20} style={{ color: 'var(--accent)' }} />
              </div>
              <h3 className="mb-2 font-semibold text-[var(--text-primary)]">{title}</h3>
              <p className="text-sm text-[var(--text-secondary)]">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[var(--border)] px-6 py-6 sm:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <p className="text-xs text-[var(--text-muted)]">© 2026 ProjectPlanner</p>
          <ThemeToggle />
        </div>
      </footer>
    </div>
  );
}
