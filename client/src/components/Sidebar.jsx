import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Home, LayoutDashboard, Users, Briefcase, FileText, Settings, LogOut, Menu, X } from 'lucide-react';
import styles from './Layout.module.css';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { to: '/', icon: Home, label: 'Home', roles: ['admin', 'manager', 'agent'] },
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'manager', 'agent'] },
    { to: '/properties', icon: Home, label: 'Properties', roles: ['admin', 'manager', 'agent'] },
    { to: '/clients', icon: Users, label: 'Clients', roles: ['admin', 'manager', 'agent'] },
    { to: '/deals', icon: Briefcase, label: 'Deal Pipeline', roles: ['admin', 'manager', 'agent'] },
    { to: '/commissions', icon: FileText, label: 'Commissions', roles: ['admin', 'manager', 'agent'] },
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
