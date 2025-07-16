import { Outlet } from 'react-router-dom';
import { Navbar, Footer } from '../components/Layout';
import { COLOR_CLASSES } from '../constants/colors';

/**
 * RootLayout - Main application layout with navbar and footer
 *
 * Features:
 * - Navbar with navigation and user actions
 * - Footer with copyright and links
 * - Responsive design
 * - Consistent spacing and colors
 */
export default function RootLayout() {
  return (
    <div className={`flex min-h-screen flex-col ${COLOR_CLASSES.surface.tertiary}`}>
      {/* Header */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
