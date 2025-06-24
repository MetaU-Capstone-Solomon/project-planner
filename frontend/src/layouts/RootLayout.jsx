import { Link, Outlet } from 'react-router-dom'
import { Home, PlusSquare, Calendar, User } from 'lucide-react'
import styles from './RootLayout.module.css'

export default function RootLayout() {
  return (
    <div className={styles.container}>
      <nav className={styles.sidebar}>
        <div className={styles.logo}>
          <h1>Project Planner</h1>
        </div>
        
        <ul className={styles.nav}>
          <li>
            <Link to="/" className={styles.navLink}>
              <Home size={20} />
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link to="/new-project" className={styles.navLink}>
              <PlusSquare size={20} />
              <span>New Project</span>
            </Link>
          </li>
          <li>
            <Link to="/calendar" className={styles.navLink}>
              <Calendar size={20} />
              <span>Calendar</span>
            </Link>
          </li>
          <li>
            <Link to="/profile" className={styles.navLink}>
              <User size={20} />
              <span>Profile</span>
            </Link>
          </li>
        </ul>
      </nav>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
} 