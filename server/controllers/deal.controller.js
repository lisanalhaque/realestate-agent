const mongoose = require('mongoose');
const Deal = require('../models/Deal');
const Commission = require('../models/Commission');
const { calculateCommission } = require('../utils/commissionCalculator');

// @desc    Get all deals
// @route   GET /api/deals
// @access  Private
const getDeals = async (req, res) => {
  try {
    const filter = req.user.role === 'agent' ? { agent: req.user._id } : {};
    const deals = await Deal.find(filter)
      .populate('property', 'title status price')
      .populate('client', 'name phone')
      .populate('agent', 'name')
      .populate('splitWith', 'name');
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
    const { property, client, dealValue, commissionRate, splitWith, splitPercentage, notes } = req.body;
    
    const parsedDealValue = parseFloat(dealValue);
    const parsedCommissionRate = parseFloat(commissionRate);
    
    if (isNaN(parsedDealValue) || parsedDealValue <= 0) {
      return res.status(400).json({ message: 'Invalid deal value' });
    }
    
    if (isNaN(parsedCommissionRate) || parsedCommissionRate < 0) {
      return res.status(400).json({ message: 'Invalid commission rate' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(property)) {
      return res.status(400).json({ message: 'Invalid property ID' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(client)) {
      return res.status(400).json({ message: 'Invalid client ID' });
    }
    
    if (!req.user || !mongoose.Types.ObjectId.isValid(req.user._id)) {
      return res.status(400).json({ message: 'Invalid user' });
    }
    
    const deal = await Deal.create({
      property, client, status: 'lead', dealValue: parsedDealValue, commissionRate: parsedCommissionRate, splitWith, splitPercentage, notes,
      agent: req.user._id
    });
    
    // No Commission creation since status is always 'lead'
    
    res.status(201).json(deal);
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
      .populate('splitWith', 'name');
      
    if (!deal) return res.status(404).json({ message: 'Deal not found' });

    if (req.user.role === 'agent' && deal.agent._id.toString() !== req.user._id.toString() && deal.splitWith?._id.toString() !== req.user._id.toString()) {
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

    if (req.user.role === 'agent' && deal.agent.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this deal' });
    }

    const fieldsToUpdate = ['status', 'dealValue', 'commissionRate', 'splitWith', 'splitPercentage', 'notes'];
    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        deal[field] = req.body[field];
      }
    });

    await deal.save();

    if (deal.status === 'closed') {
      const { total, agentShare } = calculateCommission(deal.dealValue, deal.commissionRate, deal.splitPercentage);

      await Commission.findOneAndUpdate(
        { deal: deal._id, agent: deal.agent },
        { totalCommission: total, agentShare },
        { upsert: true }
      );
    }

    res.json(deal);
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

    if (req.user.role === 'agent' && deal.agent.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this deal' });
    }

    await deal.deleteOne();
    await Commission.deleteMany({ deal: deal._id });
    
    res.json({ message: 'Deal removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDeals, createDeal, getDealById, updateDeal, deleteDeal };
