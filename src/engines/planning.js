/**
 * Wealth Planning Engine - Self-Contained Financial Planning Calculations
 */

// 2026 Estimated Federal Tax Brackets (MFJ & Single)
const TAX_BRACKETS_2026 = {
  MFJ: [
    { rate: 0.10, limit: 23200 },
    { rate: 0.12, limit: 94300 },
    { rate: 0.22, limit: 201050 },
    { rate: 0.24, limit: 383900 },
    { rate: 0.32, limit: 487450 },
    { rate: 0.35, limit: 731200 },
    { rate: 0.37, limit: Infinity }
  ],
  SINGLE: [
    { rate: 0.10, limit: 11600 },
    { rate: 0.12, limit: 47150 },
    { rate: 0.22, limit: 100525 },
    { rate: 0.24, limit: 191950 },
    { rate: 0.32, limit: 243725 },
    { rate: 0.35, limit: 609350 },
    { rate: 0.37, limit: Infinity }
  ]
};

const STANDARD_DEDUCTION_2026 = {
  MFJ: 30000,
  SINGLE: 15000
};

// IRS Uniform Lifetime Table (Sample RMD Factors for ages 73-80)
const RMD_UNIFORM_TABLE = {
  73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0, 79: 21.1, 80: 20.2
};

export function calculateTaxBracketHeadroom(agi, filingStatus = 'MFJ', customDeduction = null) {
  const statusKey = filingStatus.toUpperCase();
  const brackets = TAX_BRACKETS_2026[statusKey] || TAX_BRACKETS_2026.MFJ;
  const stdDeduction = customDeduction !== null ? customDeduction : (STANDARD_DEDUCTION_2026[statusKey] || 30000);

  const taxableIncome = Math.max(0, agi - stdDeduction);

  // Find current bracket
  let currentBracket = brackets[0];
  for (const b of brackets) {
    if (taxableIncome <= b.limit) {
      currentBracket = b;
      break;
    }
  }

  const headroom = currentBracket.limit === Infinity ? 0 : Math.max(0, currentBracket.limit - taxableIncome);

  return {
    agi,
    filingStatus: statusKey,
    standardDeduction: stdDeduction,
    taxableIncome,
    currentBracketRate: `${(currentBracket.rate * 100).toFixed(1)}%`,
    currentBracketCeiling: currentBracket.limit,
    headroomForRothConversion: headroom
  };
}

export function calculateRMD(age, accountBalance) {
  if (age < 73) {
    return { age, accountBalance, rmdRequired: 0, message: "RMD age threshold (73) not reached." };
  }

  const factor = RMD_UNIFORM_TABLE[age] || Math.max(10.0, 26.5 - (age - 73) * 0.9);
  const rmdAmount = Math.round(accountBalance / factor);

  return {
    age,
    accountBalance,
    distributionFactor: factor,
    rmdRequired: rmdAmount,
    monthlyDistribution: Math.round(rmdAmount / 12)
  };
}

export function runMonteCarloCashFlow(initialAssets, annualSpend, expectedReturn = 0.06, volatility = 0.12, years = 30, trials = 1000) {
  let successes = 0;
  const finalBalances = [];

  for (let t = 0; t < trials; t++) {
    let balance = initialAssets;
    let failed = false;

    for (let y = 0; y < years; y++) {
      // Box-Muller transform for normal distribution
      const u1 = Math.random() || 1e-10;
      const u2 = Math.random() || 1e-10;
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

      const yearReturn = expectedReturn + z * volatility;
      balance = (balance - annualSpend) * (1 + yearReturn);

      if (balance <= 0) {
        failed = true;
        balance = 0;
        break;
      }
    }

    if (!failed) successes++;
    finalBalances.push(balance);
  }

  finalBalances.sort((a, b) => a - b);
  const successRate = ((successes / trials) * 100).toFixed(1);
  const medianEndingBalance = Math.round(finalBalances[Math.floor(trials * 0.5)]);
  const percentile10 = Math.round(finalBalances[Math.floor(trials * 0.1)]);

  return {
    initialAssets,
    annualSpend,
    years,
    trials,
    successRatePercent: parseFloat(successRate),
    medianEndingBalance,
    downsidePercentile10: percentile10
  };
}
