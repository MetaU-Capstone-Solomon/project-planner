import { Link, Outlet } from 'react-router-dom';
import { Home, PlusSquare, Calendar, User } from 'lucide-react';

export default function RootLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      <nav className="w-64 bg-white shadow-lg">
        <div className="border-b border-gray-200 p-6">
          <h1 className="text-xl font-bold text-gray-800">Project Planner</h1>
        </div>

        <ul className="space-y-2 p-4">
          <li>
            <Link
              to="/"
              className="flex items-center space-x-3 rounded-lg p-3 text-gray-700 transition-colors hover:bg-gray-100"
            >
              <Home size={20} />
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link
              to="/new-project"
              className="flex items-center space-x-3 rounded-lg p-3 text-gray-700 transition-colors hover:bg-gray-100"
            >
              <PlusSquare size={20} />
              <span>New Project</span>
            </Link>
          </li>
          <li>
            <Link
              to="/calendar"
              className="flex items-center space-x-3 rounded-lg p-3 text-gray-700 transition-colors hover:bg-gray-100"
            >
              <Calendar size={20} />
              <span>Calendar</span>
            </Link>
          </li>
          <li>
            <Link
              to="/profile"
              className="flex items-center space-x-3 rounded-lg p-3 text-gray-700 transition-colors hover:bg-gray-100"
            >
              <User size={20} />
              <span>Profile</span>
            </Link>
          </li>
        </ul>
      </nav>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
