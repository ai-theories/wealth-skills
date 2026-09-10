/**
 * Wealth UHNW Engine - Self-Contained Family Office & Concentrated Stock Strategy
 */

export function calculateCollarStrategy(symbol = 'AAPL', shares = 100000, currentPrice = 215, costBasis = 25) {
  const positionValue = shares * currentPrice;
  const unrealizedGain = (currentPrice - costBasis) * shares;

  // 10% OTM Put (Downside Floor)
  const putStrike = parseFloat((currentPrice * 0.90).toFixed(2));
  const putFloorValue = shares * putStrike;

  // 15% OTM Call (Upside Cap)
  const callStrike = parseFloat((currentPrice * 1.15).toFixed(2));
  const callCapValue = shares * callStrike;

  return {
    symbol: symbol.toUpperCase(),
    shares,
    costBasis,
    currentPrice,
    positionValue: Math.round(positionValue),
    unrealizedGain: Math.round(unrealizedGain),
    collarParameters: {
      putStrikeFloor: putStrike,
      putFloorValue: Math.round(putFloorValue),
      protectedMaxLossPercent: 10.0,
      callStrikeCap: callStrike,
      callCapValue: Math.round(callCapValue),
      upsideCapPercent: 15.0
    },
    zeroCostStructure: true,
    requiresHumanApproval: true
  };
}

export function calculatePeMetrics(commitment = 5000000, calledCapital = 3000000, distributions = 1200000, nav = 3200000) {
  const unfundedCommitment = Math.max(0, commitment - calledCapital);
  const totalValue = distributions + nav;

  // MOIC / TVPI = Total Value / Paid-in Capital
  const tvpiMoic = calledCapital > 0 ? parseFloat((totalValue / calledCapital).toFixed(2)) : 0;

  // DPI = Distributions / Paid-in Capital
  const dpi = calledCapital > 0 ? parseFloat((distributions / calledCapital).toFixed(2)) : 0;

  // RVPI = Residual Value / Paid-in Capital
  const rvpi = calledCapital > 0 ? parseFloat((nav / calledCapital).toFixed(2)) : 0;

  return {
    commitment,
    calledCapital,
    unfundedCommitment,
    distributions,
    nav,
    totalValue,
    metrics: {
      tvpiMoic: `${tvpiMoic}x`,
      dpi: `${dpi}x`,
      rvpi: `${rvpi}x`,
      jCurvePhase: dpi > 0.5 ? 'Harvesting Phase' : 'Investment & Value Creation Phase'
    }
  };
}
