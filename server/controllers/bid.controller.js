const Bid = require('../models/Bid');
const Property = require('../models/Property');
const {
  migrateLegacyPipelineStages,
  isAllowedPipelineStage,
  PIPELINE_STAGES,
} = require('../utils/bidPipeline');
const { ensureClosedDealAndCommissionForBid } = require('./deal.controller');

exports.createBid = async (req, res) => {
  try {
    const { propertyId, amount } = req.body;
    const property = await Property.findById(propertyId);
    if (!property) return res.status(404).json({ message: 'Property not found' });

    const newBid = await Bid.create({
      propertyId,
      userId: req.user._id,
      amount,
      status: 'pending',
      pipelineStage: 'negotiation',
    });

    res.status(201).json({ message: 'Your negotiation proposal was submitted', bid: newBid });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBidsForBroker = async (req, res) => {
  try {
    // Find all properties listed by this broker
    const properties = await Property.find({ listedBy: req.user._id }).select('_id');
    const propertyIds = properties.map(p => p._id);

    const bids = await Bid.find({ propertyId: { $in: propertyIds } })
      .populate('userId', 'name email phone')
      .populate('propertyId', 'title price');

    res.json(bids);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserBids = async (req, res) => {
  try {
    const bids = await Bid.find({ userId: req.user._id })
      .populate({
        path: 'propertyId',
        select: 'title price images status listedBy contactNumber',
        populate: { path: 'listedBy', select: 'name phone email' }
      });

    const sanitizedBids = bids.map(bid => {
      const bidObj = bid.toObject();
      if (bidObj.status !== 'accepted') {
        if (bidObj.propertyId) {
          delete bidObj.propertyId.contactNumber; // Hide property specific phone
          if (bidObj.propertyId.listedBy) {
            delete bidObj.propertyId.listedBy.phone; // Hide profile phone
          }
        }
      }
      return bidObj;
    });

    res.json(sanitizedBids);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateBidStatus = async (req, res) => {
  try {
    const { bidId } = req.params;
    const { status } = req.body; // 'accepted' or 'rejected'

    const bid = await Bid.findById(bidId).populate('propertyId');
    if (!bid) return res.status(404).json({ message: 'Negotiation not found' });

    // Ensure the broker modifying it owns the property
    if (bid.propertyId.listedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to modify this negotiation' });
    }

    bid.status = status;
    if (status === 'rejected') {
      bid.pipelineStage = 'deal_cancelled';
    } else if (status === 'accepted') {
      if (bid.pipelineStage !== 'advance_paid' && bid.pipelineStage !== 'deal_done') {
        bid.pipelineStage = 'negotiation';
      }
    }
    await bid.save();

    res.json({ message: `Negotiation ${status}`, bid });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get bidders for broker's properties (Clients view)
exports.getBiddersForBroker = async (req, res) => {
  try {
    // Find all properties listed by this broker
    const properties = await Property.find({ listedBy: req.user._id }).select('_id title price');
    const propertyIds = properties.map(p => p._id);

    // Get all bids with full user details
    const bids = await Bid.find({ propertyId: { $in: propertyIds } })
      .populate('userId', 'name email phone')
      .populate('propertyId', 'title price images listedBy')
      .sort({ createdAt: -1 });

    // Group by user to show unique bidders
    const biddersMap = new Map();
    bids.forEach(bid => {
      const userId = bid.userId._id.toString();
      if (!biddersMap.has(userId)) {
        biddersMap.set(userId, {
          userId: bid.userId._id,
          name: bid.userId.name,
          email: bid.userId.email,
          phone: bid.userId.phone,
          bids: []
        });
      }
      biddersMap.get(userId).bids.push(bid);
    });

    const biddersWithStats = Array.from(biddersMap.values()).map(bidder => {
      const acceptedBids = bidder.bids.filter(b => b.status === 'accepted');
      const totalBids = bidder.bids.length;
      const totalBidAmount = bidder.bids.reduce((sum, b) => sum + b.amount, 0);

      return {
        ...bidder,
        totalBids,
        acceptedBids: acceptedBids.length,
        totalBidAmount,
        highestBid: Math.max(...bidder.bids.map(b => b.amount)),
        lowestBid: Math.min(...bidder.bids.map(b => b.amount))
      };
    });

    res.json(biddersWithStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get detailed bid information for pipeline
exports.getBidsPipeline = async (req, res) => {
  try {
    await migrateLegacyPipelineStages();

    let targetAgent = req.user._id;
    if (req.user.role === 'admin' && req.query.agentId) {
      targetAgent = req.query.agentId;
    }

    const properties = await Property.find({ listedBy: targetAgent }).select('_id');
    const propertyIds = properties.map(p => p._id);

    const bids = await Bid.find({ propertyId: { $in: propertyIds } })
      .populate('userId', 'name email phone')
      .populate('propertyId', 'title price status')
      .sort({ createdAt: -1 });

    const stages = {
      negotiation: [],
      advance_paid: [],
      deal_done: [],
      deal_cancelled: [],
    };

    bids.forEach(bid => {
      let stage = bid.pipelineStage || 'negotiation';
      if (!PIPELINE_STAGES.includes(stage)) stage = 'negotiation';
      stages[stage].push({
        _id: bid._id,
        bidderName: bid.userId.name,
        bidderEmail: bid.userId.email,
        bidderPhone: bid.userId.phone,
        propertyTitle: bid.propertyId.title,
        bidAmount: bid.amount,
        status: bid.status,
        paymentStatus: bid.advancePaymentDetails?.status || 'pending',
        paymentAmount: bid.advancePaymentDetails?.paidAmount || 0,
        pipelineStage: bid.pipelineStage,
        createdAt: bid.createdAt,
        notes: bid.notes
      });
    });

    res.json(stages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update bid pipeline stage
exports.updateBidPipeline = async (req, res) => {
  try {
    const { bidId } = req.params;
    const { pipelineStage, notes } = req.body;

    if (!isAllowedPipelineStage(pipelineStage)) {
      return res.status(400).json({ message: 'Invalid pipeline stage' });
    }

    const bid = await Bid.findById(bidId).populate('propertyId', 'listedBy');
    if (!bid) return res.status(404).json({ message: 'Negotiation not found' });

    if (!bid.propertyId) {
      return res.status(400).json({ message: 'Property for this negotiation is missing' });
    }

    const ownerId =
      bid.propertyId.listedBy?.toString?.() ?? String(bid.propertyId.listedBy);
    const userId = req.user._id?.toString?.() ?? String(req.user._id);
    if (req.user.role !== 'admin' && ownerId !== userId) {
      return res.status(403).json({ message: 'Not authorized to modify this negotiation' });
    }

    const setDoc = {
      pipelineStage,
      lastUpdated: new Date(),
    };
    if (notes !== undefined) {
      setDoc.notes = notes;
    }

    // Partial update avoids full-document validation/save errors from legacy nested fields
    const updated = await Bid.findByIdAndUpdate(
      bidId,
      { $set: setDoc },
      { new: true, runValidators: true }
    )
      .populate('userId', 'name email phone')
      .populate('propertyId', 'title price status listedBy');

    if (!updated) {
      return res.status(404).json({ message: 'Negotiation not found' });
    }

    if (pipelineStage === 'deal_done') {
      try {
        await ensureClosedDealAndCommissionForBid(updated._id);
      } catch (syncErr) {
        console.error('ensureClosedDealAndCommissionForBid:', syncErr);
      }
    }

    res.json({ message: 'Pipeline stage updated', bid: updated });
  } catch (error) {
    console.error('updateBidPipeline:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// Get broker dashboard statistics
exports.getBrokerStats = async (req, res) => {
  try {
    await migrateLegacyPipelineStages();

    let targetAgent = req.user._id;
    if (req.user.role === 'admin' && req.query.agentId) {
      targetAgent = req.query.agentId;
    }

    const properties = await Property.find({ listedBy: targetAgent }).select('_id');
    const propertyIds = properties.map(p => p._id);

    const bids = await Bid.find({ propertyId: { $in: propertyIds } });
    
    const stats = {
      totalBids: bids.length,
      pendingBids: bids.filter(b => b.status === 'pending').length,
      acceptedBids: bids.filter(b => b.status === 'accepted').length,
      rejectedBids: bids.filter(b => b.status === 'rejected').length,
      advancePaidCount: bids.filter(b => b.advancePaymentDetails?.status === 'completed').length,
      advancePendingCount: bids.filter(b => b.advancePaymentDetails?.status === 'pending' && b.status === 'accepted').length,
      totalBidValue: bids.reduce((sum, b) => sum + b.amount, 0),
      totalAdvanceCollected: bids
        .filter(b => b.advancePaymentDetails?.status === 'completed')
        .reduce((sum, b) => sum + (b.advancePaymentDetails?.paidAmount || 0), 0),
      pipelineBreakdown: {
        negotiation: bids.filter(b => (b.pipelineStage ?? 'negotiation') === 'negotiation').length,
        advance_paid: bids.filter(b => b.pipelineStage === 'advance_paid').length,
        deal_done: bids.filter(b => b.pipelineStage === 'deal_done').length,
        deal_cancelled: bids.filter(b => b.pipelineStage === 'deal_cancelled').length,
      },
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
