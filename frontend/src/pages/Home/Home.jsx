import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Target, Users, GitBranch, Terminal, Code2, Cpu } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import Button from '@/components/ui/Button';
import ThemeToggle from '@/components/ui/ThemeToggle';
import Logo from '@/components/Logo/Logo';
import { stagger } from '@/constants/motion';

const PHASE_CARDS = [
  { phase: 'Phase 1 · Planning & Design',  progress: 100, tags: ['Figma', 'Architecture'] },
  { phase: 'Phase 2 · Backend API',        progress: 68,  tags: ['Node.js', 'PostgreSQL'] },
  { phase: 'Phase 3 · Frontend',           progress: 32,  tags: ['React', 'Tailwind'] },
  { phase: 'Phase 4 · Payments & Auth',    progress: 0,   tags: ['Stripe', 'JWT'] },
  { phase: 'Phase 5 · Deployment',         progress: 0,   tags: ['Docker', 'CI/CD'] },
];

const INTEGRATIONS = [
  { icon: Terminal, label: 'Claude Code' },
  { icon: Cpu,      label: 'MCP' },
  { icon: GitBranch,label: 'GitHub' },
  { icon: Code2,    label: 'VS Code' },
];

const FEATURES = [
  { icon: Zap,    title: 'Instant roadmap',   desc: 'Upload a doc or describe your project — get a full phase-by-phase roadmap in seconds.' },
  { icon: Target, title: 'Track everything',  desc: 'Phases, milestones, tasks, and progress rings — all in one place.' },
  { icon: Users,  title: 'Collaborate',       desc: 'Invite your team, assign work, connect Claude Code via MCP.' },
];

function HeroCardStack() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (paused) return;
    intervalRef.current = setInterval(() => {
      setActiveIndex(i => (i + 1) % PHASE_CARDS.length);
    }, 2500);
    return () => clearInterval(intervalRef.current);
  }, [paused]);

  return (
    <div className="relative hidden lg:flex flex-col items-center gap-5">
      <div
        className="relative cursor-pointer select-none"
        style={{ width: 460, height: 420 }}
        onClick={() => setActiveIndex(i => (i + 1) % PHASE_CARDS.length)}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {PHASE_CARDS.map((card, i) => {
          const offset = (i - activeIndex + PHASE_CARDS.length) % PHASE_CARDS.length;
          const isActive = offset === 0;
          return (
            <motion.div
              key={card.phase}
              animate={{
                x: offset * -20,
                y: offset * 12,
                scale: 1 - offset * 0.05,
                opacity: offset >= 4 ? 0.1 : 1 - offset * 0.18,
                zIndex: PHASE_CARDS.length - offset,
              }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className={`absolute w-96 rounded-2xl border bg-[var(--bg-surface)] p-6 shadow-lg transition-shadow ${
                isActive
                  ? 'border-[var(--accent)] shadow-[0_0_0_3px_rgba(37,99,235,0.15)]'
                  : 'border-[var(--border)]'
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-medium text-[var(--accent)]">{card.phase}</p>
                <span className="text-xs font-semibold text-[var(--text-muted)]">
                  {card.progress}%
                </span>
              </div>
              <p className="mb-3 font-semibold text-[var(--text-primary)]">E-Commerce Platform</p>
              <div className="mb-4 h-1.5 w-full rounded-full bg-[var(--bg-elevated)]">
                <motion.div
                  className="h-full rounded-full bg-[var(--accent)]"
                  initial={false}
                  animate={{ width: `${card.progress}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {card.tags.map(t => (
                  <span key={t} className="rounded-full bg-[var(--accent-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
                    {t}
                  </span>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Dot indicators */}
      <div className="flex items-center gap-1.5">
        {PHASE_CARDS.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`rounded-full transition-all duration-300 ${
              i === activeIndex
                ? 'w-5 h-1.5 bg-[var(--accent)]'
                : 'w-1.5 h-1.5 bg-[var(--border)] hover:bg-[var(--text-muted)]'
            }`}
          />
        ))}
      </div>
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
          <Logo size="sm" />
          <span className="font-semibold text-[var(--text-primary)]">ProPlan</span>
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
      <section className="relative z-10 mx-auto flex max-w-7xl flex-col items-center gap-12 px-6 py-10 lg:flex-row lg:py-20 sm:px-10">
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
            Upload a doc or describe your project. We generate a structured roadmap with phases, milestones, and tasks — ready to track and share.
          </motion.p>
          <motion.div variants={stagger.item} transition={{ duration: 0.3 }} className="flex gap-3">
            <Button size="lg" onClick={() => navigate(ROUTES.AUTH)}>
              Get Started free <ArrowRight size={16} />
            </Button>
            <button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center justify-center rounded-lg font-semibold transition-colors duration-150 h-11 px-6 text-base gap-2 border-2 border-black text-black hover:bg-[var(--bg-elevated)] dark:border-white dark:text-white"
            >
              See how it works
            </button>
          </motion.div>
        </motion.div>

        {/* Right — interactive card stack */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 25 }}
          className="flex-1 flex justify-center"
        >
          <HeroCardStack />
        </motion.div>
      </section>

      {/* Integrations strip */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-16 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-4"
        >
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--text-muted)]">Works with</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {INTEGRATIONS.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-1.5 text-sm font-medium text-[var(--text-secondary)]"
              >
                <Icon size={14} className="text-[var(--text-muted)]" />
                {label}
              </span>
            ))}
          </div>
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
          <p className="text-xs text-[var(--text-muted)]">© 2026 ProPlan</p>
          <ThemeToggle />
        </div>
      </footer>
    </div>
  );
}
