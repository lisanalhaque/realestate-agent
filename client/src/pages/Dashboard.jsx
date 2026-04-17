import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Briefcase, CheckCircle, DollarSign, Clock, TrendingUp, Zap } from 'lucide-react';
import styles from './Dashboard.module.css';

const Dashboard = ({ brokerId }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalDeals: 0,
    closedDeals: 0,
    commissionBookedTotal: 0,
    commissionPaidOut: 0,
    pendingPayout: 0,
    // Broker bid statistics
    totalBids: 0,
    pendingBids: 0,
    acceptedBids: 0,
    advancePaidCount: 0,
    advancePendingCount: 0,
    totalAdvanceCollected: 0,
  });
  const [pipelineData, setPipelineData] = useState([]);
  const [bidPipelineData, setBidPipelineData] = useState([]);
  const [commissionData, setCommissionData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, [user, brokerId]);

  const fetchDashboardData = async () => {
    try {
      const q = brokerId ? `?agentId=${brokerId}` : '';
      const requests = [
        api.get(`/deals${q}`),
        api.get(`/commissions/summary${q}`),
      ];

      // Enable broker specific stats for true brokers or admin performing drill-downs
      if (user?.role === 'broker' || (user?.role === 'admin' && brokerId)) {
        requests.push(api.get(`/bids/broker/stats${q}`));
      }

      const [dealsRes, commRes, brokerStatsRes] = await Promise.all(requests);

      const deals = dealsRes.data;
      const commSummary = commRes.data;
      const brokerStats = brokerStatsRes?.data || {};

      const totalDeals = deals.length;
      const closedDeals = deals.filter(d => d.status === 'closed').length;

      setStats(prev => ({
        ...prev,
        totalDeals,
        closedDeals,
        commissionBookedTotal: commSummary.total || 0,
        commissionPaidOut: commSummary.paid || 0,
        pendingPayout: commSummary.pending || 0,
        totalBids: brokerStats.totalBids || 0,
        pendingBids: brokerStats.pendingBids || 0,
        acceptedBids: brokerStats.acceptedBids || 0,
        advancePaidCount: brokerStats.advancePaidCount || 0,
        advancePendingCount: brokerStats.advancePendingCount || 0,
        totalAdvanceCollected: brokerStats.totalAdvanceCollected || 0,
      }));

      const stages = ['lead', 'site_visit', 'negotiation', 'agreement', 'closed', 'cancelled'];
      const pipelineCounts = stages.map(stage => {
        return {
          name: stage.replace('_', ' ').toUpperCase(),
          count: deals.filter(d => d.status === stage).length
        };
      });
      setPipelineData(pipelineCounts);

      // Bid pipeline data for brokers
      if (brokerStats.pipelineBreakdown) {
        const b = brokerStats.pipelineBreakdown;
        const bidPipeline = [
          { name: 'Negotiation', count: b.negotiation ?? 0 },
          { name: 'Advance paid', count: b.advance_paid ?? 0 },
          { name: 'Deal done', count: b.deal_done ?? 0 },
          { name: 'Cancelled', count: b.deal_cancelled ?? 0 },
        ];
        setBidPipelineData(bidPipeline);
      }

      setCommissionData([
        { name: 'Paid', value: commSummary.paid || 0 },
        { name: 'Pending', value: commSummary.pending || 0 }
      ]);

    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const COLORS = ['#14b8a6', '#f59e0b'];

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back. Here's your current performance.</p>
        </div>
      </div>

      {user?.role === 'broker' && (
        <>
          <h2 style={{ marginBottom: '16px', color: '#0f172a', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Negotiation management
          </h2>
          <div className={`${styles.statsGrid} grid-cols-1 md:grid-cols-2 lg:grid-cols-4`}>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.blue}`}>
                <TrendingUp size={24} />
              </div>
              <div className={styles.statInfo}>
                <p className={styles.statLabel}>Total negotiations</p>
                <p className={styles.statValue}>{stats.totalBids}</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.orange}`}>
                <Clock size={24} />
              </div>
              <div className={styles.statInfo}>
                <p className={styles.statLabel}>Pending negotiations</p>
                <p className={styles.statValue}>{stats.pendingBids}</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.green}`}>
                <CheckCircle size={24} />
              </div>
              <div className={styles.statInfo}>
                <p className={styles.statLabel}>Accepted negotiations</p>
                <p className={styles.statValue}>{stats.acceptedBids}</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.teal}`}>
                <DollarSign size={24} />
              </div>
              <div className={styles.statInfo}>
                <p className={styles.statLabel}>Advance Collected</p>
                <p className={styles.statValue} style={{fontSize: '1.2rem'}}>{formatCurrency(stats.totalAdvanceCollected)}</p>
              </div>
            </div>
          </div>

          <div className={styles.chartsGrid} style={{ marginTop: '32px' }}>
            <div className={styles.chartCard}>
              <h2 className={styles.chartHeader}>
                <span className={`${styles.chartIndicator} ${styles.blue}`}></span> Negotiation pipeline
              </h2>
              <div className={styles.chartContainer}>
                {bidPipelineData.length === 0 ? (
                  <div className={styles.noData}>No negotiation pipeline data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bidPipelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                      <Tooltip 
                        cursor={{ fill: '#f1f5f9' }}
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className={styles.chartCard}>
              <h2 className={styles.chartHeader}>
                <span className={`${styles.chartIndicator} ${styles.teal}`}></span> Advance Payments
              </h2>
              <div className={styles.chartContainer}>
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Received</div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981', marginBottom: '16px' }}>
                    {formatCurrency(stats.totalAdvanceCollected)}
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Awaiting Payment</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
                    {stats.advancePendingCount}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <h2 style={{ margin: user?.role === 'broker' ? '32px 0 16px 0' : '0 0 16px 0', color: '#0f172a', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Deal Management
      </h2>
      {user?.role === 'broker' && (
        <p style={{ margin: '-8px 0 16px', fontSize: '13px', color: '#64748b' }}>
          Commissions book at 2.5% of the negotiated amount when a negotiation reaches Deal done (pipeline) or a CRM deal is closed. Booked{' '}
          {formatCurrency(stats.commissionBookedTotal)} · Paid {formatCurrency(stats.commissionPaidOut)} · Pending{' '}
          {formatCurrency(stats.pendingPayout)}.
        </p>
      )}

      <div className={`${styles.statsGrid} grid-cols-1 md:grid-cols-2 lg:grid-cols-4`}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.blue}`}>
            <Briefcase size={24} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Total Deals</p>
            <p className={styles.statValue}>{stats.totalDeals}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.green}`}>
            <CheckCircle size={24} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Closed Deals</p>
            <p className={styles.statValue}>{stats.closedDeals}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.teal}`}>
            <DollarSign size={24} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Commission booked</p>
            <p className={styles.statValue} style={{fontSize: '1.5rem'}}>{formatCurrency(stats.commissionBookedTotal)}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.orange}`}>
            <Clock size={24} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Pending Payout</p>
            <p className={styles.statValue} style={{fontSize: '1.5rem'}}>{formatCurrency(stats.pendingPayout)}</p>
          </div>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h2 className={styles.chartHeader}>
            <span className={`${styles.chartIndicator} ${styles.blue}`}></span> Pipeline Overview
          </h2>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.chartCard}>
          <h2 className={styles.chartHeader}>
            <span className={`${styles.chartIndicator} ${styles.teal}`}></span> Commission Split
          </h2>
          <div className={styles.chartContainer}>
            {(stats.commissionBookedTotal || 0) === 0 ? (
              <div className={styles.noData}>
                <div className={styles.noDataIcon}>
                  <DollarSign size={32} />
                </div>
                <p>No commission data yet. Move a negotiation to Deal done or close a CRM deal.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={commissionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {commissionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontWeight: 600, fontSize: '14px', color: '#475569' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
