const mongoose = require('mongoose');
const { calculateCommission } = require('../utils/commissionCalculator');

const dealSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  /** When set, negotiation pipeline stays in sync with this deal */
  sourceBid: { type: mongoose.Schema.Types.ObjectId, ref: 'Bid', default: null },
  agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['lead', 'site_visit', 'negotiation', 'agreement', 'closed', 'cancelled'], 
    default: 'lead' 
  },
  dealValue: { type: Number, required: true },
  commissionRate: { type: Number, required: true },
  commissionAmount: { type: Number },
  splitWith: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  splitPercentage: { type: Number, default: 0 },
  closedAt: { type: Date },
  notes: { type: String }
}, { timestamps: true });

dealSchema.pre('save', function () {
  if (this.isModified('dealValue') || this.isModified('commissionRate')) {
    const { total } = calculateCommission(this.dealValue, this.commissionRate, this.splitPercentage || 0);
    this.commissionAmount = total;
  }
  
  if (this.isModified('status') && this.status === 'closed' && !this.closedAt) {
    this.closedAt = new Date();
  }
});

module.exports = mongoose.model('Deal', dealSchema);
