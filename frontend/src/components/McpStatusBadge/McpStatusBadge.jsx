import Tooltip from '@/components/ui/Tooltip';

export default function McpStatusBadge() {
  return (
    <Tooltip content="MCP connection coming in Phase 3" position="top">
      <div className="flex cursor-default items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-[var(--text-muted)]" />
        <span className="text-xs text-[var(--text-muted)]">MCP disconnected</span>
      </div>
    </Tooltip>
  );
}
