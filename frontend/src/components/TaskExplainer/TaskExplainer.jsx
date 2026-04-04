import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, List, ChevronDown, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { API_ENDPOINTS } from '@/config/api';
import Spinner from '@/components/ui/Spinner';

async function fetchExplanation(prompt) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(API_ENDPOINTS.CHAT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'AI request failed');
  }
  const data = await res.json();
  return data.content;
}

export default function TaskExplainer({ task }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState(null); // 'explain' | 'breakdown'
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const taskText = [task.title, task.description].filter(Boolean).join('. ');

  async function trigger(triggerMode) {
    if (open && mode === triggerMode) {
      setOpen(false);
      return;
    }
    setMode(triggerMode);
    setContent(null);
    setError(null);
    setOpen(true);
    setLoading(true);
    try {
      const prompt =
        triggerMode === 'explain'
          ? `Explain this task in simple terms for a beginner: ${taskText}`
          : `Break this task into 3-5 smaller sub-steps a beginner can follow: ${taskText}`;
      const result = await fetchExplanation(prompt);
      setContent(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-1">
      <div className="flex gap-1.5">
        <button
          onClick={() => trigger('explain')}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-colors"
        >
          <HelpCircle size={11} />
          Explain this
          {open && mode === 'explain' && <ChevronDown size={11} className="rotate-180" />}
        </button>
        <button
          onClick={() => trigger('breakdown')}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-colors"
        >
          <List size={11} />
          Break it down
          {open && mode === 'breakdown' && <ChevronDown size={11} className="rotate-180" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="relative mt-2 rounded-lg border border-[var(--accent-subtle)] bg-[var(--accent-subtle)] p-3">
              <button
                onClick={() => setOpen(false)}
                className="absolute right-2 top-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={12} />
              </button>
              {loading ? (
                <div className="flex items-center gap-2 py-1">
                  <Spinner size="sm" className="text-[var(--accent)]" />
                  <span className="text-xs text-[var(--text-secondary)]">Thinking…</span>
                </div>
              ) : error ? (
                <p className="text-xs text-[var(--destructive)]">{error}</p>
              ) : (
                <p className="whitespace-pre-wrap text-xs leading-relaxed text-[var(--text-primary)]">{content}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
