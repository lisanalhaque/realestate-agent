const calculateCommission = (dealValue, commissionRate, splitPercentage = 0) => {
  const total = (dealValue * commissionRate) / 100;
  
  // Admin statically receives 1% of the deal value from the total commission
  const adminShare = (dealValue * 1.0) / 100;
  
  // Ensure we don't go below 0 if commission rate was set arbitrarily low
  const actualAdminShare = Math.min(adminShare, total);
  
  const remainingForAgents = total - actualAdminShare;
  const coAgentShare = (remainingForAgents * splitPercentage) / 100;
  const agentShare = remainingForAgents - coAgentShare;

  return { total, agentShare, coAgentShare, adminShare: actualAdminShare };
};

module.exports = { calculateCommission };
