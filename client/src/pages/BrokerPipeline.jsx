import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { DollarSign, User, Calendar } from 'lucide-react';
import styles from './BrokerBids.module.css';

const STAGES = [
  { key: 'negotiation', label: 'Negotiation', color: '#8b5cf6' },
  { key: 'advance_paid', label: 'Advance paid', color: '#3b82f6' },
  { key: 'deal_done', label: 'Deal done', color: '#10b981' },
  { key: 'deal_cancelled', label: 'Deal cancelled', color: '#6b7280' },
];

const BrokerPipeline = ({ brokerId }) => {
  const [pipeline, setPipeline] = useState({});
  const [loading, setLoading] = useState(true);
  const [pendingMove, setPendingMove] = useState(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchPipeline();
    const interval = setInterval(fetchPipeline, 30000);
    return () => clearInterval(interval);
  }, [brokerId]);

  const fetchPipeline = async () => {
    try {
      const q = brokerId ? `?agentId=${brokerId}` : '';
      const response = await api.get(`/bids/broker/pipeline${q}`);
      setPipeline(response.data);
    } catch (error) {
      console.error('Failed to fetch pipeline', error);
      toast.error('Failed to load pipeline');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveStage = async (bidId, newStage) => {
    try {
      await api.put(`/bids/${bidId}/pipeline`, { pipelineStage: newStage, notes });
      const label = STAGES.find(s => s.key === newStage)?.label || newStage;
      toast.success(`Moved to ${label}`);
      setPendingMove(null);
      setNotes('');
      fetchPipeline();
    } catch (error) {
      console.error('Failed to update pipeline', error);
      toast.error(error.response?.data?.message || 'Failed to update pipeline stage');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const BidCard = ({ bid, stage }) => (
    <div className={styles.pipelineCard} key={bid._id}>
      <div className={styles.cardHeader}>
        <div>
          <h4>{bid.propertyTitle}</h4>
          <p className={styles.bidder}>{bid.bidderName}</p>
        </div>
        <span className={`${styles.status} ${styles[bid.status]}`}>
          {bid.status.toUpperCase()}
        </span>
      </div>

      <div className={styles.cardDetails}>
        <div className={styles.detail}>
          <DollarSign size={14} />
          <span>{formatCurrency(bid.bidAmount)}</span>
        </div>
        <div className={styles.detail}>
          <User size={14} />
          <span>{bid.bidderEmail}</span>
        </div>
        <div className={styles.detail}>
          <Calendar size={14} />
          <span>{new Date(bid.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {bid.paymentStatus === 'completed' && (
        <div className={styles.paymentTag}>
          ✓ Advance paid: {formatCurrency(bid.paymentAmount)}
        </div>
      )}

      {stage !== 'deal_done' && stage !== 'deal_cancelled' && (
        <div className={styles.cardActions}>
          <select
            className={styles.stageSelect}
            value=""
            onChange={(e) => {
              const v = e.target.value;
              if (!v) return;
              setPendingMove({ bid, targetStage: v });
              setNotes('');
              e.target.blur();
            }}
          >
            <option value="">Move to stage…</option>
            {STAGES.filter((s) => s.key !== stage).map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );

  if (loading) return <div className={styles.loading}>Loading pipeline...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Negotiation pipeline</h1>
        <p className={styles.subtitle}>
          Four stages: negotiation → advance paid → deal done (or cancelled)
        </p>
      </div>

      <div className={styles.pipelineContainer}>
        {STAGES.map((stage) => (
          <div key={stage.key} className={styles.pipelineColumn}>
            <div className={styles.columnHeader} style={{ borderTopColor: stage.color }}>
              <h3>{stage.label}</h3>
              <span className={styles.count}>{(pipeline[stage.key] || []).length}</span>
            </div>

            <div className={styles.columnBids}>
              {pipeline[stage.key]?.length === 0 ? (
                <p className={styles.emptyColumn}>No negotiations</p>
              ) : (
                pipeline[stage.key]?.map((bid) => (
                  <BidCard key={bid._id} bid={bid} stage={stage.key} />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {pendingMove && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Confirm stage change</h2>
            <p className={styles.modalHint}>
              Move <strong>{pendingMove.bid.propertyTitle}</strong> —{' '}
              {pendingMove.bid.bidderName} to{' '}
              <strong>{STAGES.find((s) => s.key === pendingMove.targetStage)?.label}</strong>
            </p>
            <textarea
              className={styles.notesInput}
              placeholder="Optional notes about this negotiation…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnCancel}
                onClick={() => {
                  setPendingMove(null);
                  setNotes('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => handleMoveStage(pendingMove.bid._id, pendingMove.targetStage)}
              >
                Move
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrokerPipeline;
