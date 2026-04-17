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

  const getHeroContent = () => {
    if (user?.role === 'admin') {
      return {
        badge: 'Platform Administration',
        title: <>Manage the Network <span className={styles.highlight}>Seamlessly</span></>,
        subtitle: 'The central command for BoomAgent platform. Monitor active brokers, track deals, manage users, and review global commissions in real-time.',
      };
    } else if (user?.role === 'user') {
      return {
        badge: 'Your Dream Home Awaits',
        title: <>Find the Perfect Property <span className={styles.highlight}>Today</span></>,
        subtitle: 'Browse premium listings, negotiate directly with top agents, and secure your future home with our transparent and seamless real estate platform.',
      };
    } else {
      return {
        badge: 'Next-Gen Real Estate CRM',
        title: <>Close Deals <span className={styles.highlight}>Faster</span> Than Ever</>,
        subtitle: 'The premium management suite for top-performing real estate agents. Track your properties, clients, and commissions in one beautiful dashboard.',
      };
    }
  };

  const getFeaturesContent = () => {
    if (user?.role === 'admin') {
      return {
        sectionTitle: "Platform Command Center",
        sectionSubtitle: "BoomAgent gives you the oversight tools needed to manage a growing network of real estate professionals.",
        f1: { title: "Global Broker Oversight", desc: "Instantly view performance metrics, verify new agent accounts, and manage your broker directory securely." },
        f2: { title: "Platform Properties", desc: "Oversee the global inventory of listings and monitor market health across all active brokers." },
        f3: { title: "User Moderation", desc: "Manage the buyer and client ecosystem, ensuring smooth communication and secure verification." },
        f4: { title: "Revenue Analytics", desc: "Track your 1% platform commission across all successfully closed deals and monitor gross market volume." }
      };
    } else if (user?.role === 'user') {
      return {
        sectionTitle: "Your Journey Starts Here",
        sectionSubtitle: "Discover why thousands of buyers and renters choose BoomAgent to find their perfect property.",
        f1: { title: "Direct Negotiations", desc: "Skip the middlemen and send your personalized offers directly to the listing agent through our secure portal." },
        f2: { title: "Premium Listings", desc: "Browse a highly curated selection of verified properties, luxurious apartments, and commercial spaces." },
        f3: { title: "Transparent Updates", desc: "Receive real-time updates as your offers advance through the negotiation pipeline, and lock in your deal securely." },
        f4: { title: "Global Support", desc: "Have peace of mind knowing the BoomAgent platform guarantees a secure, moderated real estate experience." }
      };
    } else {
      return {
        sectionTitle: "Everything You Need to Succeed",
        sectionSubtitle: "BoomAgent provides all the tools required for modern real estate professionals to dominate their market.",
        f1: { title: "Pipeline Tracking", desc: "Visually track every deal from initial lead to closed agreement. Never let a prospect slip through the cracks." },
        f2: { title: "Property Management", desc: "Maintain an elegant digital inventory of all your listings, open houses, and property details in one place." },
        f3: { title: "Client CRM", desc: "Keep perfect records of buyer preferences, seller demands, and communication history to provide unparalleled service." },
        f4: { title: "Instant Insights", desc: "Get real-time statistics on your commission splits, projected earnings, and team performance metrics." }
      };
    }
  };

  const hero = getHeroContent();
  const features = getFeaturesContent();

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
            {user?.role === 'admin' ? (
              <>
                <Link to="/admin" className={styles.navLink}>Dashboard</Link>
                <Link to="/admin/brokers" className={styles.navLink}>Brokers</Link>
                <Link to="/admin/feedbacks" className={styles.navLink}>Feedbacks</Link>
              </>
            ) : user?.role === 'user' ? (
              <>
                <Link to="/user/properties" className={styles.navLink}>Properties</Link>
                <Link to="/user/negotiations" className={styles.navLink}>My Negotiations</Link>
                <Link to="/user/feedback" className={styles.navLink}>Feedback</Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className={styles.navLink}>Dashboard</Link>
                <Link to="/properties" className={styles.navLink}>Properties</Link>
                <Link to="/deals" className={styles.navLink}>Pipeline</Link>
                <Link to="/clients" className={styles.navLink}>Clients</Link>
              </>
            )}
          </nav>

          <div className={styles.userSection}>
            <div className={styles.userInfo}>
              <span className={styles.welcomeText}>Welcome, {user?.name?.split(' ')[0] || 'Guest'}</span>
              <div className={styles.avatar}>{user?.name?.charAt(0).toUpperCase() || 'U'}</div>
            </div>
            {user && (
              <button onClick={logout} className={styles.logoutBtn} title="Logout">
                <LogOut size={18} />
              </button>
            )}
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
            <div className={styles.badge}>{hero.badge}</div>
            <h1 className={styles.title}>{hero.title}</h1>
            <p className={styles.subtitle}>{hero.subtitle}</p>
            <div className={styles.ctaGroup}>
              <Link to={user?.role === 'user' ? '/user/properties' : user?.role === 'admin' ? '/admin' : '/dashboard'} className={styles.primaryBtn}>
                {user?.role === 'user' ? 'Explore Properties' : 'Go to Dashboard'} <ArrowRight size={18} />
              </Link>
              {user?.role !== 'user' && (
                <Link to="/properties" className={styles.secondaryBtn}>
                  View Properties
                </Link>
              )}
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
          <h2 className={styles.sectionTitle}>{features.sectionTitle}</h2>
          <p className={styles.sectionSubtitle}>
            {features.sectionSubtitle}
          </p>
        </div>

        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <TrendingUp size={28} />
            </div>
            <h3 className={styles.featureTitle}>{features.f1.title}</h3>
            <p className={styles.featureDesc}>
              {features.f1.desc}
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <Building2 size={28} />
            </div>
            <h3 className={styles.featureTitle}>{features.f2.title}</h3>
            <p className={styles.featureDesc}>
              {features.f2.desc}
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Users size={28} />
            </div>
            <h3 className={styles.featureTitle}>{features.f3.title}</h3>
            <p className={styles.featureDesc}>
              {features.f3.desc}
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon} style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
              <Zap size={28} />
            </div>
            <h3 className={styles.featureTitle}>{features.f4.title}</h3>
            <p className={styles.featureDesc}>
              {features.f4.desc}
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
          <Link to={user?.role === 'user' ? '/user/properties' : user?.role === 'admin' ? '/admin' : '/dashboard'} className={styles.primaryBtn} style={{ background: '#fff', color: '#1e293b' }}>
            {user?.role === 'user' ? 'Explore Properties' : 'Enter Dashboard'} <ArrowRight size={18} />
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
