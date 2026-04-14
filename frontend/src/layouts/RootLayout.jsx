import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Plus, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/constants/routes';
import ProfileDropdown from '@/components/Layout/ProfileDropdown';
import ThemeToggle from '@/components/ui/ThemeToggle';
import Button from '@/components/ui/Button';
import Logo from '@/components/Logo/Logo';
import { getDisplayName, getAvatarUrl } from '@/utils/userUtils';
import resetNewProjectState from '@/utils/resetNewProjectState';

const navLinks = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
];

function Navbar() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const profileButtonRef = useRef(null);

  const userProfile = {
    name: getDisplayName(user),
    image: getAvatarUrl(user),
  };

  const handleNewProject = () => {
    resetNewProjectState();
    navigate(ROUTES.NEW_PROJECT_CHAT);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg-base)]/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link to={ROUTES.DASHBOARD} className="flex items-center gap-2">
          <Logo size="sm" />
          <span className="hidden font-semibold text-[var(--text-primary)] sm:block">ProPlan</span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {navLinks.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 rounded-lg bg-[var(--bg-elevated)]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon size={15} className="relative z-10" />
                <span className="relative z-10 hidden sm:block">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleNewProject}>
            <Plus size={15} />
            <span className="hidden sm:block">New Project</span>
          </Button>
          <ThemeToggle />
          <div className="relative">
            <button
              ref={profileButtonRef}
              onClick={() => setIsDropdownOpen((open) => !open)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-surface)] ring-2 ring-transparent transition hover:ring-[var(--accent)]"
              aria-label="Open profile menu"
              aria-expanded={isDropdownOpen}
            >
              {userProfile.image ? (
                <img
                  src={userProfile.image}
                  alt={userProfile.name}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <User className="h-5 w-5 text-[var(--text-primary)]" />
              )}
            </button>
            <ProfileDropdown
              isOpen={isDropdownOpen}
              onClose={() => setIsDropdownOpen(false)}
              triggerRef={profileButtonRef}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

export default function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-base)]">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
