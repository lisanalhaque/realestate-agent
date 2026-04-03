const calculateCommission = (dealValue, commissionRate, splitPercentage = 0) => {
  const total = (dealValue * commissionRate) / 100;
  const coAgentShare = (total * splitPercentage) / 100;
  const agentShare = total - coAgentShare;

  return { total, agentShare, coAgentShare };
};

module.exports = { calculateCommission };
