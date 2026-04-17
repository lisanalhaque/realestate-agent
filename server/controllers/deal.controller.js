const mongoose = require('mongoose');
const Deal = require('../models/Deal');
const Bid = require('../models/Bid');
const Client = require('../models/Client');
const Commission = require('../models/Commission');
const Property = require('../models/Property');
const { calculateCommission } = require('../utils/commissionCalculator');

/** Closed deals use a fixed 2.5% commission on the negotiated (deal) value */
const STANDARD_COMMISSION_PCT = 2.5;

/** Linked negotiation follows the deal; "lead" still means active price talks */
const DEAL_STATUS_TO_BID_PIPELINE = {
  lead: 'negotiation',
  site_visit: 'negotiation',
  negotiation: 'negotiation',
  agreement: 'negotiation',
  closed: 'deal_done',
  cancelled: 'deal_cancelled',
};

async function syncLinkedNegotiationBid(deal) {
  if (!deal.sourceBid) return;
  const bid = await Bid.findById(deal.sourceBid);
  if (!bid) return;

  const stage = DEAL_STATUS_TO_BID_PIPELINE[deal.status];
  const updates = { lastUpdated: new Date() };
  if (stage) updates.pipelineStage = stage;

  if (deal.status === 'closed') {
    updates.dealDetails = {
      dealId: deal._id,
      commissionAmount: deal.commissionAmount ?? (deal.dealValue * STANDARD_COMMISSION_PCT) / 100,
      commissionPaid: bid.dealDetails?.commissionPaid || false,
      payoutDate: bid.dealDetails?.payoutDate,
    };
  }

  await Bid.findByIdAndUpdate(deal.sourceBid, { $set: updates });
}

/**
 * When a negotiation is moved to "deal done" in the broker pipeline, ensure a closed Deal
 * and Commission row exist (2.5% of negotiated amount). Brokers often skip the CRM deal flow.
 */
async function ensureClosedDealAndCommissionForBid(bidId) {
  const bid = await Bid.findById(bidId)
    .populate('userId', 'name phone email')
    .populate('propertyId', 'listedBy');
  if (!bid || bid.pipelineStage !== 'deal_done') return;

  const brokerId = bid.propertyId?.listedBy;
  if (!brokerId) return;

  let deal = await Deal.findOne({ sourceBid: bid._id });

  if (deal) {
    if (deal.status !== 'closed') {
      deal.status = 'closed';
      deal.commissionRate = STANDARD_COMMISSION_PCT;
    }
    if (bid.amount != null && bid.amount > 0) {
      deal.dealValue = bid.amount;
      deal.commissionRate = STANDARD_COMMISSION_PCT;
    }
    await deal.save();
    await upsertCommissionForClosedDeal(deal);
    await syncLinkedNegotiationBid(deal);
    return;
  }

  const user = bid.userId;
  if (!user || !bid.propertyId?._id) return;

  let client = null;
  if (user.phone) {
    client = await Client.findOne({
      assignedAgent: brokerId,
      phone: String(user.phone).trim(),
    });
  }
  if (!client) {
    client = await Client.create({
      name: user.name || 'Buyer',
      phone: user.phone?.trim() || `pipeline-${String(bid._id).slice(-8)}`,
      email: user.email || undefined,
      type: 'buyer',
      assignedAgent: brokerId,
    });
  }

  deal = await Deal.create({
    property: bid.propertyId._id,
    client: client._id,
    agent: brokerId,
    sourceBid: bid._id,
    status: 'closed',
    dealValue: bid.amount,
    commissionRate: STANDARD_COMMISSION_PCT,
  });

  await upsertCommissionForClosedDeal(deal);
  await syncLinkedNegotiationBid(deal);
}

async function upsertCommissionForClosedDeal(deal) {
  if (deal.status !== 'closed') return;

  // Auto-flag the linked property as sold
  if (deal.property) {
    await Property.findByIdAndUpdate(deal.property, { status: 'sold', soldAt: new Date() });
  }

  const { total, agentShare, adminShare } = calculateCommission(
    deal.dealValue,
    deal.commissionRate,
    deal.splitPercentage || 0
  );

  await Commission.findOneAndUpdate(
    { deal: deal._id, agent: deal.agent },
    {
      totalCommission: total,
      agentShare,
      adminShare,
      status: 'pending',
    },
    { upsert: true, new: true }
  );
}

// @desc    Get all deals
// @route   GET /api/deals
// @access  Private
const getDeals = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'broker') {
      filter.agent = req.user._id;
    } else if (req.user.role === 'admin' && req.query.agentId) {
      filter.agent = req.query.agentId;
    }
    const deals = await Deal.find(filter)
      .populate('property', 'title status price')
      .populate('client', 'name phone')
      .populate('agent', 'name')
      .populate('splitWith', 'name')
      .populate('sourceBid', 'amount status pipelineStage');
    res.json(deals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new deal
// @route   POST /api/deals
// @access  Private
const createDeal = async (req, res) => {
  try {
    const { property, client, dealValue, commissionRate, splitWith, splitPercentage, notes, sourceBid } =
      req.body;

    const parsedDealValue = parseFloat(dealValue);
    if (isNaN(parsedDealValue) || parsedDealValue <= 0) {
      return res.status(400).json({ message: 'Invalid negotiated amount' });
    }

    const rawRate = commissionRate === '' || commissionRate === undefined ? NaN : parseFloat(commissionRate);
    const parsedCommissionRate =
      !isNaN(rawRate) && rawRate >= 0 ? rawRate : STANDARD_COMMISSION_PCT;

    if (!mongoose.Types.ObjectId.isValid(property)) {
      return res.status(400).json({ message: 'Invalid property ID' });
    }

    if (!mongoose.Types.ObjectId.isValid(client)) {
      return res.status(400).json({ message: 'Invalid client ID' });
    }

    if (!req.user || !mongoose.Types.ObjectId.isValid(req.user._id)) {
      return res.status(400).json({ message: 'Invalid user' });
    }

    let linkedBidId = null;
    if (sourceBid) {
      if (!mongoose.Types.ObjectId.isValid(sourceBid)) {
        return res.status(400).json({ message: 'Invalid linked negotiation id' });
      }
      const bid = await Bid.findById(sourceBid).populate('propertyId');
      if (!bid || !bid.propertyId) {
        return res.status(400).json({ message: 'Linked negotiation not found' });
      }
      if (bid.propertyId.listedBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to link this negotiation' });
      }
      if (bid.propertyId._id.toString() !== property) {
        return res.status(400).json({ message: 'Negotiation does not match the selected property' });
      }
      linkedBidId = bid._id;
    }

    const deal = await Deal.create({
      property,
      client,
      status: 'lead',
      dealValue: parsedDealValue,
      commissionRate: parsedCommissionRate,
      splitWith,
      splitPercentage,
      notes,
      agent: req.user._id,
      sourceBid: linkedBidId,
    });

    await syncLinkedNegotiationBid(deal);

    const populated = await Deal.findById(deal._id)
      .populate('property', 'title status price')
      .populate('client', 'name phone')
      .populate('sourceBid', 'amount status pipelineStage');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Error creating deal:', error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
};

// @desc    Get single deal
// @route   GET /api/deals/:id
// @access  Private
const getDealById = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id)
      .populate('property')
      .populate('client')
      .populate('agent', 'name email role')
      .populate('splitWith', 'name')
      .populate('sourceBid', 'amount status pipelineStage userId');

    if (!deal) return res.status(404).json({ message: 'Deal not found' });

    if (
      req.user.role === 'broker' &&
      deal.agent._id.toString() !== req.user._id.toString() &&
      deal.splitWith?._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to view this deal' });
    }

    res.json(deal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update deal or change pipeline status
// @route   PUT /api/deals/:id
// @access  Private
const updateDeal = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ message: 'Deal not found' });

    if (req.user.role === 'broker' && deal.agent.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this deal' });
    }

    const fieldsToUpdate = ['status', 'dealValue', 'splitWith', 'splitPercentage', 'notes'];
    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        deal[field] = req.body[field];
      }
    });

    if (req.body.commissionRate !== undefined && deal.status !== 'closed') {
      deal.commissionRate = req.body.commissionRate;
    }

    if (deal.status === 'closed') {
      deal.commissionRate = STANDARD_COMMISSION_PCT;
    }

    await deal.save();

    if (deal.status === 'closed') {
      await upsertCommissionForClosedDeal(deal);
    }

    await syncLinkedNegotiationBid(deal);

    const populated = await Deal.findById(deal._id)
      .populate('property', 'title status price')
      .populate('client', 'name phone')
      .populate('sourceBid', 'amount status pipelineStage');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete deal
// @route   DELETE /api/deals/:id
// @access  Private
const deleteDeal = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ message: 'Deal not found' });

    if (req.user.role === 'broker' && deal.agent.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this deal' });
    }

    await deal.deleteOne();
    await Commission.deleteMany({ deal: deal._id });

    res.json({ message: 'Deal removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDeals,
  createDeal,
  getDealById,
  updateDeal,
  deleteDeal,
  ensureClosedDealAndCommissionForBid,
};
