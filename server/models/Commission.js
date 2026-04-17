const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  deal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal', required: true },
  agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  totalCommission: { type: Number, required: true },
  agentShare: { type: Number, required: true },
  adminShare: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'approved', 'paid'], default: 'pending' },
  paidAt: { type: Date },
  remarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Commission', commissionSchema);
