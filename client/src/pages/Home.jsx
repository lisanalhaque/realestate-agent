import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, TrendingUp, Users, ArrowRight, Home as HomeIcon, LogOut, CheckCircle, Shield, Zap, Search } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import styles from './Home.module.css';

const Home = () => {
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={styles.homeContainer}>
      {/* Header */}
      <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ''}`}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <HomeIcon size={24} color="#ffffff" />
            </div>
            <span className={styles.logoText}>BoomAgent</span>
          </div>

          <nav className={styles.nav}>
            <Link to="/dashboard" className={styles.navLink}>Dashboard</Link>
            <Link to="/properties" className={styles.navLink}>Properties</Link>
            <Link to="/deals" className={styles.navLink}>Pipeline</Link>
            <Link to="/clients" className={styles.navLink}>Clients</Link>
          </nav>

          <div className={styles.userSection}>
            <div className={styles.userInfo}>
              <span className={styles.welcomeText}>Welcome, {user?.name?.split(' ')[0]}</span>
              <div className={styles.avatar}>{user?.name?.charAt(0).toUpperCase()}</div>
            </div>
            <button onClick={logout} className={styles.logoutBtn} title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBackground}>
          <div className={styles.blob1}></div>
          <div className={styles.blob2}></div>
          <div className={styles.blob3}></div>
        </div>

        <div className={styles.heroContent}>
          <div className={styles.heroTextContainer}>
            <div className={styles.badge}>Next-Gen Real Estate CRM</div>
            <h1 className={styles.title}>
              Close Deals <span className={styles.highlight}>Faster</span> Than Ever
            </h1>
            <p className={styles.subtitle}>
              The premium management suite for top-performing real estate agents. Track your properties, clients, and commissions in one beautiful dashboard.
            </p>
            <div className={styles.ctaGroup}>
              <Link to="/dashboard" className={styles.primaryBtn}>
                Go to Dashboard <ArrowRight size={18} />
              </Link>
              <Link to="/properties" className={styles.secondaryBtn}>
                View Properties
              </Link>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={`${styles.glassCard} ${styles.animateFloat}`} style={{ animationDelay: '0s' }}>
              <div className={styles.cardIconWrapper} style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
                <Building2 size={24} />
              </div>
              <div className={styles.cardContent}>
                <span className={styles.cardValue}>1,200+</span>
                <span className={styles.cardLabel}>Active Listings</span>
              </div>
            </div>

            <div className={`${styles.glassCard} ${styles.animateFloat}`} style={{ animationDelay: '1.5s', marginLeft: 'auto', marginTop: '-1rem' }}>
              <div className={styles.cardIconWrapper} style={{ background: 'rgba(167, 139, 250, 0.2)', color: '#a78bfa' }}>
                <TrendingUp size={24} />
              </div>
              <div className={styles.cardContent}>
                <span className={styles.cardValue}>$45M+</span>
                <span className={styles.cardLabel}>Volume Closed</span>
              </div>
            </div>

            <div className={`${styles.glassCard} ${styles.animateFloat}`} style={{ animationDelay: '0.7s', marginLeft: '2rem', marginTop: '-1rem' }}>
              <div className={styles.cardIconWrapper} style={{ background: 'rgba(52, 211, 153, 0.2)', color: '#34d399' }}>
                <Users size={24} />
              </div>
              <div className={styles.cardContent}>
                <span className={styles.cardValue}>98%</span>
                <span className={styles.cardLabel}>Client Satisfaction</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.featuresSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Everything You Need to Succeed</h2>
          <p className={styles.sectionSubtitle}>
            BoomAgent provides all the tools required for modern real estate professionals to dominate their market.
          </p>
        </div>

        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <TrendingUp size={28} />
            </div>
            <h3 className={styles.featureTitle}>Pipeline Tracking</h3>
            <p className={styles.featureDesc}>
              Visually track every deal from initial lead to closed agreement. Never let a prospect slip through the cracks.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <Building2 size={28} />
            </div>
            <h3 className={styles.featureTitle}>Property Management</h3>
            <p className={styles.featureDesc}>
              Maintain an elegant digital inventory of all your listings, open houses, and property details in one place.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Users size={28} />
            </div>
            <h3 className={styles.featureTitle}>Client CRM</h3>
            <p className={styles.featureDesc}>
              Keep perfect records of buyer preferences, seller demands, and communication history to provide unparalleled service.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon} style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
              <Zap size={28} />
            </div>
            <h3 className={styles.featureTitle}>Instant Insights</h3>
            <p className={styles.featureDesc}>
              Get real-time statistics on your commission splits, projected earnings, and team performance metrics.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles.statsSection}>
        <div className={styles.statsContainer}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>10k+</span>
            <span className={styles.statLabel}>Agents Worldwide</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>$2B+</span>
            <span className={styles.statLabel}>Property Volume</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>99.9%</span>
            <span className={styles.statLabel}>Uptime Reliability</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>24/7</span>
            <span className={styles.statLabel}>Dedicated Support</span>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className={styles.benefitsSection}>
        <div className={styles.benefitsContent}>
          <div className={styles.benefitsText}>
            <h2 className={styles.sectionTitle}>Built for Top Producers</h2>
            <p className={styles.sectionSubtitle} style={{ textAlign: 'left', margin: '0 0 2rem 0' }}>
              Stop using fragmented spreadsheets and outdated software. BoomAgent unifies your workflow with a modern, lightning-fast interface designed specifically for real estate.
            </p>
            <ul className={styles.benefitsList}>
              <li><CheckCircle className={styles.checkIcon} /> Seamless integration with major property networks</li>
              <li><CheckCircle className={styles.checkIcon} /> Automated commission split calculations</li>
              <li><CheckCircle className={styles.checkIcon} /> Secure, encrypted data protection</li>
              <li><CheckCircle className={styles.checkIcon} /> Cloud-synced across all your devices</li>
            </ul>
          </div>
          <div className={styles.benefitsVisual}>
            <div className={styles.visualMockup}>
              <div className={styles.mockupHeader}>
                <div className={styles.mockupDot} style={{ background: '#ef4444' }}></div>
                <div className={styles.mockupDot} style={{ background: '#f59e0b' }}></div>
                <div className={styles.mockupDot} style={{ background: '#10b981' }}></div>
              </div>
              <div className={styles.mockupBody}>
                <div className={styles.mockupBar} style={{ width: '40%' }}></div>
                <div className={styles.mockupBar} style={{ width: '70%', background: 'rgba(59, 130, 246, 0.5)' }}></div>
                <div className={styles.mockupBar} style={{ width: '50%' }}></div>
                <div className={styles.mockupGrid}>
                  <div className={styles.mockupCard}></div>
                  <div className={styles.mockupCard}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaCard}>
          <h2 className={styles.ctaTitle}>Ready to Transform Your Business?</h2>
          <p className={styles.ctaSubtitle}>Join thousands of agents using BoomAgent to close deals faster and manage their portfolios efficiently.</p>
          <Link to="/dashboard" className={styles.primaryBtn} style={{ background: '#fff', color: '#1e293b' }}>
            Enter Dashboard <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerInnerGrid}>
            <div className={styles.footerBrandCol}>
              <div className={styles.footerBrand}>
                <div className={styles.logoIconFooter}>
                  <HomeIcon size={20} color="#ffffff" />
                </div>
                <span className={styles.footerLogoText}>BoomAgent</span>
              </div>
              <p className={styles.footerDesc}>
                The ultimate platform for real estate professionals. Designed with elegance, engineered for performance.
              </p>
            </div>
            
            <div className={styles.footerLinksCol}>
              <h4 className={styles.footerHeading}>Platform</h4>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/properties">Properties</Link>
              <Link to="/clients">Clients</Link>
              <Link to="/deals">Pipeline</Link>
            </div>

            <div className={styles.footerLinksCol}>
              <h4 className={styles.footerHeading}>Features</h4>
              <a href="#">Commission Config</a>
              <a href="#">Lead Tracking</a>
              <a href="#">Analytics</a>
              <a href="#">Team Management</a>
            </div>
          </div>
          
          <div className={styles.footerBottom}>
            <p className={styles.copyright}>© {new Date().getFullYear()} BoomAgent Real Estate Suite. Premium Management.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
