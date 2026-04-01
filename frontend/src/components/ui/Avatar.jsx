const sizes = {
  sm: 'h-7  w-7  text-xs',
  md: 'h-9  w-9  text-sm',
  lg: 'h-12 w-12 text-base',
};

function getInitials(name = '') {
  return name.trim().split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?';
}

function colorFromName(name = '') {
  const colors = [
    'bg-violet-500', 'bg-indigo-500', 'bg-blue-500',
    'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
  ];
  const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
  return colors[idx];
}

export function Avatar({ src, name = '', size = 'md', className = '' }) {
  return src ? (
    <img
      src={src}
      alt={name}
      className={`rounded-full object-cover ${sizes[size]} ${className}`}
    />
  ) : (
    <div className={`flex items-center justify-center rounded-full font-medium text-white ${colorFromName(name)} ${sizes[size]} ${className}`}>
      {getInitials(name)}
    </div>
  );
}

export function AvatarGroup({ users = [], max = 3, size = 'sm' }) {
  const visible = users.slice(0, max);
  const overflow = users.length - max;
  return (
    <div className="flex -space-x-2">
      {visible.map((u, i) => (
        <div key={u.id || u.email || i} className="ring-2 ring-[var(--bg-base)] rounded-full">
          <Avatar src={u.avatar} name={u.name} size={size} />
        </div>
      ))}
      {overflow > 0 && (
        <div className={`flex items-center justify-center rounded-full bg-[var(--bg-elevated)] text-xs font-medium text-[var(--text-secondary)] ring-2 ring-[var(--bg-base)] ${sizes[size]}`}>
          +{overflow}
        </div>
      )}
    </div>
  );
}
