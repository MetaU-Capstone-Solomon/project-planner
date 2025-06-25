import { Link, Outlet } from 'react-router-dom'
import { Home, PlusSquare, Calendar, User } from 'lucide-react'

export default function RootLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      <nav className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">Project Planner</h1>
        </div>
        
        <ul className="p-4 space-y-2">
          <li>
            <Link to="/" className="flex items-center space-x-3 p-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Home size={20} />
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link to="/new-project" className="flex items-center space-x-3 p-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <PlusSquare size={20} />
              <span>New Project</span>
            </Link>
          </li>
          <li>
            <Link to="/calendar" className="flex items-center space-x-3 p-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Calendar size={20} />
              <span>Calendar</span>
            </Link>
          </li>
          <li>
            <Link to="/profile" className="flex items-center space-x-3 p-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
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
  )
} 