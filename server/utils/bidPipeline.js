const Bid = require('../models/Bid');

/** Four-column broker negotiation pipeline */
const PIPELINE_STAGES = ['negotiation', 'advance_paid', 'deal_done', 'deal_cancelled'];

/**
 * One-time style migration from legacy stage names + sync advance paid from payment data.
 */
async function migrateLegacyPipelineStages() {
  await Bid.updateMany(
    { pipelineStage: { $in: ['new_bid', 'proposal_sent'] } },
    { $set: { pipelineStage: 'negotiation' } }
  );
  await Bid.updateMany({ pipelineStage: 'deal_pending' }, { $set: { pipelineStage: 'advance_paid' } });
  await Bid.updateMany({ pipelineStage: 'deal_closed' }, { $set: { pipelineStage: 'deal_done' } });
  await Bid.updateMany(
    {
      'advancePaymentDetails.status': 'completed',
      pipelineStage: { $nin: ['deal_done', 'deal_cancelled', 'advance_paid'] },
    },
    { $set: { pipelineStage: 'advance_paid' } }
  );

  await Bid.updateMany(
    {
      $or: [
        { pipelineStage: { $exists: false } },
        { pipelineStage: null },
        { pipelineStage: { $nin: PIPELINE_STAGES } },
      ],
    },
    { $set: { pipelineStage: 'negotiation' } }
  );
}

function isAllowedPipelineStage(stage) {
  return PIPELINE_STAGES.includes(stage);
}

module.exports = {
  PIPELINE_STAGES,
  migrateLegacyPipelineStages,
  isAllowedPipelineStage,
};
