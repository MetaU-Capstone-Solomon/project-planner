import { Routes, Route } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import Home from './pages/Home/Home';
import Auth from './pages/Auth/Auth';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Auth />} />
      <Route element={<RootLayout />}>
        <Route path="/app" element={<div>Dashboard</div>} />
        <Route path="/app/new-project" element={<div>New Project</div>} />
        <Route path="/app/calendar" element={<div>Calendar</div>} />
        <Route path="/app/profile" element={<div>Profile</div>} />
      </Route>
    </Routes>
  );
}
