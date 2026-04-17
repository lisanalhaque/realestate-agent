const Commission = require('../models/Commission');

// @desc    Get all commissions
// @route   GET /api/commissions
// @access  Private
const getCommissions = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'broker' || req.user.role === 'agent') {
      filter.agent = req.user._id;
    }
    const commissions = await Commission.find(filter)
      .populate('deal', 'dealValue commissionRate status closedAt')
      .populate('agent', 'name email');
    res.json(commissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get commission summary (totals)
// @route   GET /api/commissions/summary
// @access  Private
const getCommissionSummary = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'broker' || req.user.role === 'agent') {
      filter.agent = req.user._id;
    }
    const commissions = await Commission.find(filter);

    const summary = commissions.reduce(
      (acc, curr) => {
        const share = req.user.role === 'admin' ? (curr.adminShare || 0) : curr.agentShare;
        acc.total += share;
        if (curr.status === 'paid') {
          acc.paid += share;
        } else {
          acc.pending += share;
        }
        return acc;
      },
      { total: 0, paid: 0, pending: 0 }
    );

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update commission status
// @route   PUT /api/commissions/:id/status
// @access  Private (Manager/Admin only)
const updateCommissionStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const commission = await Commission.findById(req.params.id);

    if (!commission) return res.status(404).json({ message: 'Commission not found' });

    commission.status = status;
    if (remarks) commission.remarks = remarks;
    if (status === 'paid') commission.paidAt = new Date();

    await commission.save();
    res.json(commission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCommissions, getCommissionSummary, updateCommissionStatus };
