import { useState, useEffect } from 'react';
import Tooltip from '@/components/ui/Tooltip';
import { API_ENDPOINTS } from '@/config/api';
import { supabase } from '@/lib/supabase';

export default function McpStatusBadge() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch(API_ENDPOINTS.MCP_TOKEN_STATUS, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) return;
        const { exists } = await res.json();
        setConnected(exists);
      } catch {
        // silently fail — badge stays disconnected
      }
    }
    checkStatus();
  }, []);

  return (
    <Tooltip
      content={connected ? 'Claude Code is connected' : 'Connect Claude Code in Settings'}
      position="top"
    >
      <div className="flex cursor-default items-center gap-1.5">
        <span
          className={`h-2 w-2 rounded-full ${
            connected ? 'bg-green-500' : 'bg-[var(--text-muted)]'
          }`}
        />
        <span className="text-xs text-[var(--text-muted)]">
          {connected ? 'MCP connected' : 'MCP disconnected'}
        </span>
      </div>
    </Tooltip>
  );
}
