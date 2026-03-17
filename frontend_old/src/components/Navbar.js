import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { disconnectSocket } from '../utils/socket';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, 
  Plus, 
  Settings, 
  LogOut, 
  GraduationCap,
  Sparkles,
  Moon,
  Sun
} from 'lucide-react';
import { motion } from 'framer-motion';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    disconnectSocket();
    dispatch(logout());
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  if (!isAuthenticated) return null;

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="navbar"
    >
      {/* Brand */}
      <Link to="/dashboard" className="navbar-brand">
        <div className="logo-icon">
          <GraduationCap size={20} strokeWidth={2.5} />
        </div>
        <span style={{ letterSpacing: '-0.02em', fontWeight: 800 }}>ACADLY</span>
      </Link>

      {/* Nav Links */}
      <ul className="navbar-nav">
        <li>
          <Link to="/dashboard" className={isActive('/dashboard')}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>
        </li>
        {user?.role === 'teacher' && (
          <li>
            <Link to="/classes/create" className={isActive('/classes/create')}>
              <Plus size={18} />
              <span>Create Class</span>
            </Link>
          </li>
        )}
        {user?.role === 'admin' && (
          <li>
            <Link to="/admin" className={isActive('/admin')}>
              <Settings size={18} />
              <span>Admin</span>
            </Link>
          </li>
        )}
      </ul>

      {/* User Actions */}
      <div className="navbar-actions">
        <button 
          className="btn-icon theme-toggle" 
          onClick={toggleTheme} 
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={10} fill="var(--primary)" />
            {user?.role?.toUpperCase()}
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {user?.name}
          </span>
        </div>

        <button className="user-avatar-btn" onClick={handleLogout} title="Logout">
          <div className="user-avatar-circle">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <LogOut size={16} />
        </button>
      </div>
    </motion.nav>
  );
};

export default Navbar;
