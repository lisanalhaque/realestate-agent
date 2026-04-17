import React, { useState, useContext } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ThemeContext } from '../context/ThemeContext';
import { Home, LayoutDashboard, Users, Briefcase, FileText, Settings, LogOut, Menu, X, Moon, Sun, GitBranch } from 'lucide-react';
import styles from './Layout.module.css';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    // Global & Shared
    { to: '/', icon: Home, label: 'Home', roles: ['admin', 'manager', 'agent', 'broker', 'user'] },
    
    // Broker Specific
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['manager', 'agent', 'broker'] },
    { to: '/properties', icon: Home, label: 'Manage Properties', roles: ['manager', 'agent', 'broker'] },
    { to: '/clients', icon: Users, label: 'Clients', roles: ['manager', 'agent', 'broker'] },
    { to: '/deals', icon: Briefcase, label: 'Deal Pipeline', roles: ['manager', 'agent', 'broker'] },
    { to: '/commissions', icon: FileText, label: 'Commissions', roles: ['manager', 'agent', 'broker'] },
    { to: '/broker/incoming-negotiations', icon: FileText, label: 'Incoming Negotiations', roles: ['broker'] },
    { to: '/broker/negotiation-clients', icon: Users, label: 'Negotiation Clients', roles: ['broker'] },
    { to: '/broker/negotiation-pipeline', icon: GitBranch, label: 'Negotiation Pipeline', roles: ['broker'] },

    // Admin Specific
    { to: '/dashboard', icon: LayoutDashboard, label: 'Admin Dashboard', roles: ['admin'] },
    { to: '/admin/users', icon: Users, label: 'Users', roles: ['admin'] },
    { to: '/admin/brokers', icon: Briefcase, label: 'Brokers', roles: ['admin'] },
    { to: '/properties', icon: Home, label: 'Manage Properties', roles: ['admin'] },
    { to: '/deals', icon: Briefcase, label: 'Deal Pipeline', roles: ['admin'] },
    { to: '/commissions', icon: FileText, label: 'Admin Commissions', roles: ['admin'] },
    { to: '/admin/feedbacks', icon: FileText, label: 'Feedbacks', roles: ['admin'] },

    // User Specific
    { to: '/user/properties', icon: Home, label: 'Explore Properties', roles: ['user'] },
    { to: '/user/negotiations', icon: FileText, label: 'My Negotiations', roles: ['user'] },
    { to: '/user/feedback', icon: FileText, label: 'Send Feedback', roles: ['user'] },
  ];

  const filteredLinks = navLinks.filter(link => link.roles.includes(user?.role));

  const toggleSidebar = () => setIsOpen(!isOpen);

  const SidebarContent = () => (
    <>
      <div className={styles['sidebar-header']}>
        <div className={styles['sidebar-logo']}>
          <div className={styles['logo-icon']}>
            <Home size={20} />
          </div>
          BoomAgent
        </div>
        <button className={styles['menu-toggle']} onClick={toggleSidebar} style={{ display: 'none' /* handled via css media query */ }}>
          <X size={20} />
        </button>
      </div>

      <nav className={styles['nav-links']}>
        {filteredLinks.map((link) => (
          <NavLink 
            key={link.to} 
            to={link.to} 
            className={({ isActive }) => `${styles['nav-item']} ${isActive ? styles.active : ''}`}
            onClick={() => setIsOpen(false)}
          >
            <link.icon className={styles['nav-icon']} />
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className={styles['sidebar-footer']}>
        <div className={styles['user-profile']}>
          <div className={styles['user-avatar']}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className={styles['user-info']}>
            <div className={styles['user-name']}>{user?.name}</div>
            <div className={styles['user-role']}>{user?.role}</div>
          </div>
        </div>
        <button onClick={toggleTheme} className={styles['logout-btn']} style={{ marginBottom: '10px' }}>
          {theme === 'dark' ? <><Sun size={18} /> Light Mode</> : <><Moon size={18} /> Dark Mode</>}
        </button>
        <button onClick={logout} className={styles['logout-btn']}>
          <LogOut size={18} /> Logout
        </button>
      </div>
    </>
  );

  return (
    <div className={styles['app-layout']}>
      {/* Mobile Sidebar Overlay */}
      {isOpen && <div className={styles['sidebar-overlay']} onClick={toggleSidebar}></div>}

      {/* Sidebar Component */}
      <aside className={`${styles.sidebar} ${isOpen ? styles['sidebar-mobile'] + ' ' + styles.open : styles['sidebar-desktop']}`}>
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <main className={`${styles['app-main']} ${styles['sidebar-open']}`}>
        <header className={styles['top-bar']}>
          <button className={styles['menu-toggle']} onClick={toggleSidebar}>
            <Menu size={24} />
          </button>
        </header>
        <div className={styles['main-content']}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Sidebar;
