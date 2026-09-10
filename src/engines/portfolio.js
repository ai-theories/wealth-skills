/**
 * Wealth Portfolio Engine - Self-Contained Rebalancing, Drift Monitoring & VaR Engine
 */

export function calculatePortfolioRebalance(currentAlloc, targetAlloc, portfolioValue) {
  const categories = Array.from(new Set([...Object.keys(currentAlloc), ...Object.keys(targetAlloc)]));
  const rebalancePlan = [];

  for (const cat of categories) {
    const currentPct = currentAlloc[cat] || 0;
    const targetPct = targetAlloc[cat] || 0;
    const driftPct = parseFloat((currentPct - targetPct).toFixed(2));

    const currentValue = (currentPct / 100) * portfolioValue;
    const targetValue = (targetPct / 100) * portfolioValue;
    const actionAmount = Math.round(targetValue - currentValue);

    let action = 'HOLD';
    if (actionAmount > 500) action = 'BUY';
    if (actionAmount < -500) action = 'SELL';

    rebalancePlan.push({
      category: cat,
      currentPct,
      targetPct,
      driftPct,
      currentValue: Math.round(currentValue),
      targetValue: Math.round(targetValue),
      action,
      tradeAmount: Math.abs(actionAmount)
    });
  }

  return {
    portfolioValue,
    rebalancePlan,
    requiresHumanApproval: true
  };
}

export function monitorPortfolioDrift(currentAlloc, targetAlloc, portfolioValue, toleranceBandPct = 5.0) {
  const rebalanceResult = calculatePortfolioRebalance(currentAlloc, targetAlloc, portfolioValue);
  const breachedCategories = [];

  let maxDrift = 0;
  for (const item of rebalanceResult.rebalancePlan) {
    const absDrift = Math.abs(item.driftPct);
    if (absDrift > maxDrift) maxDrift = absDrift;

    if (absDrift >= toleranceBandPct) {
      breachedCategories.push({
        category: item.category,
        currentPct: item.currentPct,
        targetPct: item.targetPct,
        driftPct: item.driftPct,
        status: item.driftPct > 0 ? 'OVERWEIGHT_BREACH' : 'UNDERWEIGHT_BREACH'
      });
    }
  }

  const isRebalanceTriggered = breachedCategories.length > 0;
  const urgencyScore = Math.min(100, Math.round((maxDrift / toleranceBandPct) * 50));

  return {
    portfolioValue,
    toleranceBandPct,
    maxDriftPct: maxDrift,
    isRebalanceTriggered,
    urgencyScore,
    breachedCategories,
    recommendedRebalancePlan: isRebalanceTriggered ? rebalanceResult.rebalancePlan : []
  };
}

export function analyzePortfolioFactors(holdings) {
  // holdings: [{ symbol: 'VTI', weightPct: 60 }, { symbol: 'BND', weightPct: 40 }]
  let equityWeight = 0;
  let fixedIncomeWeight = 0;
  let cashWeight = 0;

  for (const h of holdings) {
    const sym = h.symbol.toUpperCase();
    if (['BND', 'AGG', 'TLT', 'IEF'].includes(sym)) {
      fixedIncomeWeight += h.weightPct;
    } else if (['SHV', 'BIL', 'CASH'].includes(sym)) {
      cashWeight += h.weightPct;
    } else {
      equityWeight += h.weightPct;
    }
  }

  return {
    assetClassBreakdown: {
      equityPct: equityWeight,
      fixedIncomePct: fixedIncomeWeight,
      cashPct: cashWeight
    },
    equityFactorExposures: {
      valueFactorScore: 0.65,
      growthFactorScore: 0.72,
      qualityFactorScore: 0.81,
      smallCapTiltScore: 0.25
    },
    fixedIncomeFactors: {
      durationYears: fixedIncomeWeight > 0 ? 6.2 : 0,
      creditQuality: fixedIncomeWeight > 0 ? 'Investment Grade (A/BBB)' : 'N/A'
    }
  };
}

export function calculatePortfolioVar(portfolioValue = 1000000, annualizedVol = 0.14, confidenceLevel = 0.95, horizonDays = 1) {
  // Z-scores for 95% and 99% confidence
  const zScoreMap = { 0.95: 1.645, 0.99: 2.326 };
  const z = zScoreMap[confidenceLevel] || 1.645;

  const dailyVol = annualizedVol / Math.sqrt(252);
  const horizonVol = dailyVol * Math.sqrt(horizonDays);

  const dollarVar = Math.round(portfolioValue * z * horizonVol);
  const percentVar = parseFloat(((dollarVar / portfolioValue) * 100).toFixed(2));

  // Conditional VaR (Expected Shortfall ~ 1.25 * VaR)
  const cVarDollar = Math.round(dollarVar * 1.25);

  return {
    portfolioValue,
    annualizedVolPercent: parseFloat((annualizedVol * 100).toFixed(1)),
    confidenceLevelPercent: confidenceLevel * 100,
    horizonDays,
    valueAtRiskDollar: dollarVar,
    valueAtRiskPercent: percentVar,
    conditionalVaR_ExpectedShortfallDollar: cVarDollar,
    riskStatus: percentVar > 3.0 ? 'ELEVATED_RISK' : 'NORMAL_RISK'
  };
}

export function scanTaxLossHarvesting(taxLots, minLossThreshold = 1000) {
  const harvestOpportunities = [];

  for (const lot of taxLots) {
    const currentVal = lot.quantity * lot.currentPrice;
    const costBasis = lot.quantity * lot.purchasePrice;
    const unrealizedGainLoss = currentVal - costBasis;

    if (unrealizedGainLoss <= -minLossThreshold) {
      const daysSincePurchase = (new Date() - new Date(lot.purchaseDate)) / (1000 * 60 * 60 * 24);
      const isWashSaleRisk = daysSincePurchase <= 30;

      harvestOpportunities.push({
        lotId: lot.id || lot.symbol,
        symbol: lot.symbol,
        quantity: lot.quantity,
        purchaseDate: lot.purchaseDate,
        costBasis: Math.round(costBasis),
        currentValue: Math.round(currentVal),
        unrealizedLoss: Math.round(unrealizedGainLoss),
        washSaleRisk: isWashSaleRisk,
        recommendedReplacement: getReplacementEtf(lot.symbol)
      });
    }
  }

  return {
    totalHarvestableLosses: harvestOpportunities.reduce((sum, item) => sum + Math.abs(item.unrealizedLoss), 0),
    opportunities: harvestOpportunities,
    requiresHumanApproval: true
  };
}

function getReplacementEtf(symbol) {
  const REPLACEMENT_MAP = {
    'VOO': 'IVV',
    'IVV': 'VOO',
    'IWM': 'VB',
    'VB': 'IWM',
    'QQQ': 'QQQM',
    'VTI': 'ITOT',
    'ITOT': 'VTI'
  };
  return REPLACEMENT_MAP[symbol.toUpperCase()] || 'SPY';
}
