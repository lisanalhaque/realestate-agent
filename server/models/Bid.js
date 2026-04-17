const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  pipelineStage: {
    type: String,
    enum: ['negotiation', 'advance_paid', 'deal_done', 'deal_cancelled'],
    default: 'negotiation',
  },
  advancePaymentDetails: {
    transactionId: { type: String },
    paidAmount: { type: Number },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    isDemoMode: { type: Boolean, default: false },
    paidAt: Date
  },
  dealDetails: {
    dealId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal' },
    commissionAmount: Number,
    commissionPaid: Boolean,
    payoutDate: Date
  },
  notes: { type: String },
  lastUpdated: Date
}, { timestamps: true });

module.exports = mongoose.model('Bid', bidSchema);
