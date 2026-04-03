import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Briefcase, CheckCircle, DollarSign, Clock } from 'lucide-react';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalDeals: 0,
    closedDeals: 0,
    totalEarned: 0,
    pendingPayout: 0,
  });
  const [pipelineData, setPipelineData] = useState([]);
  const [commissionData, setCommissionData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dealsRes, commRes] = await Promise.all([
          api.get('/deals'),
          api.get('/commissions/summary')
        ]);

        const deals = dealsRes.data;
        const commSummary = commRes.data;

        const totalDeals = deals.length;
        const closedDeals = deals.filter(d => d.status === 'closed').length;
        
        setStats({
          totalDeals,
          closedDeals,
          totalEarned: commSummary.paid || 0,
          pendingPayout: commSummary.pending || 0,
        });

        const stages = ['lead', 'site_visit', 'negotiation', 'agreement', 'closed', 'cancelled'];
        const pipelineCounts = stages.map(stage => {
          return {
            name: stage.replace('_', ' ').toUpperCase(),
            count: deals.filter(d => d.status === stage).length
          };
        });
        setPipelineData(pipelineCounts);

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

    fetchDashboardData();
  }, []);

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
            <p className={styles.statLabel}>Total Earned</p>
            <p className={styles.statValue} style={{fontSize: '1.5rem'}}>{formatCurrency(stats.totalEarned)}</p>
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
            {stats.totalEarned === 0 && stats.pendingPayout === 0 ? (
              <div className={styles.noData}>
                <div className={styles.noDataIcon}>
                  <DollarSign size={32} />
                </div>
                <p>No commission data available yet.</p>
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
