/**
 * Wealth Quantitative Engine - Self-Contained Backtesting & Walk-Forward Simulator
 */

// Historical annual returns matrix (2015-2025 sample historical dataset)
const HISTORICAL_RETURNS = {
  VTI: [0.003, 0.127, 0.211, -0.052, 0.308, 0.210, 0.257, -0.195, 0.260, 0.238],  // US Total Market
  BND: [0.005, 0.026, 0.036, 0.001, 0.087, 0.075, -0.017, -0.130, 0.057, 0.015],  // Total Bond
  VXUS: [-0.043, 0.047, 0.274, -0.143, 0.216, 0.107, 0.086, -0.158, 0.155, 0.058], // Intl Equities
  VNQ: [0.024, 0.086, 0.049, -0.056, 0.287, -0.047, 0.404, -0.249, 0.118, 0.045]  // Real Estate
};

const MACRO_REGIMES = {
  baseline: { expectedReturn: 0.07, volatility: 0.12 },
  stagflation: { expectedReturn: 0.02, volatility: 0.18 },
  bull_market: { expectedReturn: 0.12, volatility: 0.10 },
  bear_market: { expectedReturn: -0.05, volatility: 0.22 }
};

export function backtestPortfolio(weights = { VTI: 0.6, BND: 0.4 }, initialBalance = 100000) {
  // Normalize weights
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const normWeights = {};
  for (const k in weights) {
    normWeights[k] = weights[k] / (totalWeight || 1);
  }

  const sampleYears = 10;
  let currentBalance = initialBalance;
  const yearlyBalances = [initialBalance];
  const annualReturns = [];

  for (let i = 0; i < sampleYears; i++) {
    let yearReturn = 0;
    for (const ticker in normWeights) {
      const series = HISTORICAL_RETURNS[ticker.toUpperCase()] || HISTORICAL_RETURNS.VTI;
      yearReturn += normWeights[ticker] * series[i % series.length];
    }
    annualReturns.push(yearReturn);
    currentBalance = currentBalance * (1 + yearReturn);
    yearlyBalances.push(Math.round(currentBalance));
  }

  // Calculate CAGR
  const cagr = parseFloat((Math.pow(currentBalance / initialBalance, 1 / sampleYears) - 1).toFixed(4));

  // Annualized Volatility
  const avgReturn = annualReturns.reduce((a, b) => a + b, 0) / sampleYears;
  const variance = annualReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (sampleYears - 1);
  const volatility = parseFloat(Math.sqrt(variance).toFixed(4));

  // Risk-Free Rate (3%)
  const rf = 0.03;
  const sharpeRatio = volatility > 0 ? parseFloat(((cagr - rf) / volatility).toFixed(2)) : 0;

  // Downside Volatility for Sortino
  const downsideReturns = annualReturns.filter(r => r < rf);
  const downsideVariance = downsideReturns.length > 0 
    ? downsideReturns.reduce((sum, r) => sum + Math.pow(r - rf, 2), 0) / downsideReturns.length 
    : 0.0001;
  const sortinoRatio = parseFloat(((cagr - rf) / Math.sqrt(downsideVariance)).toFixed(2));

  // Maximum Drawdown (MDD)
  let peak = yearlyBalances[0];
  let maxDrawdown = 0;

  for (const bal of yearlyBalances) {
    if (bal > peak) peak = bal;
    const dd = (peak - bal) / peak;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  return {
    initialBalance,
    endingBalance: Math.round(currentBalance),
    sampleYears,
    metrics: {
      cagrPercent: parseFloat((cagr * 100).toFixed(2)),
      volatilityPercent: parseFloat((volatility * 100).toFixed(2)),
      sharpeRatio,
      sortinoRatio,
      maxDrawdownPercent: parseFloat((maxDrawdown * 100).toFixed(2))
    },
    yearlyBalances
  };
}

export function forwardTestSimulation(weights = { VTI: 0.6, BND: 0.4 }, regime = 'baseline', years = 5, trials = 500) {
  const regConfig = MACRO_REGIMES[regime.toLowerCase()] || MACRO_REGIMES.baseline;
  const { expectedReturn, volatility } = regConfig;

  let successes = 0;
  const finalValues = [];

  for (let t = 0; t < trials; t++) {
    let bal = 100000;
    for (let y = 0; y < years; y++) {
      const u1 = Math.random() || 1e-10;
      const u2 = Math.random() || 1e-10;
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

      const r = expectedReturn + z * volatility;
      bal *= (1 + r);
    }
    if (bal >= 100000) successes++;
    finalValues.push(bal);
  }

  finalValues.sort((a, b) => a - b);
  const medianEnding = Math.round(finalValues[Math.floor(trials * 0.5)]);
  const p10Ending = Math.round(finalValues[Math.floor(trials * 0.1)]);
  const p90Ending = Math.round(finalValues[Math.floor(trials * 0.9)]);

  return {
    regime,
    years,
    trials,
    expectedReturnPercent: parseFloat((expectedReturn * 100).toFixed(1)),
    volatilityPercent: parseFloat((volatility * 100).toFixed(1)),
    probabilityOfGrowthPercent: parseFloat(((successes / trials) * 100).toFixed(1)),
    projections: {
      downsidePercentile10: p10Ending,
      medianPercentile50: medianEnding,
      upsidePercentile90: p90Ending
    }
  };
}
