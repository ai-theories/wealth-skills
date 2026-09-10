/**
 * Wealth Research Engine - Self-Contained Valuation & SEC EDGAR Parser
 */

export function generateCompanyTearSheet(ticker, financials) {
  const t = ticker.toUpperCase();
  const {
    marketCap = 0,
    price = 0,
    eps = 0,
    revenue = 0,
    netIncome = 0,
    freeCashFlow = 0,
    dividends = 0,
    sector = 'General'
  } = financials;

  const peRatio = eps > 0 ? parseFloat((price / eps).toFixed(2)) : 'N/A';
  const psRatio = revenue > 0 && marketCap > 0 ? parseFloat((marketCap / revenue).toFixed(2)) : 'N/A';
  const dividendYield = price > 0 && dividends > 0 ? parseFloat(((dividends / price) * 100).toFixed(2)) : 0;
  const fcfConversion = netIncome > 0 ? parseFloat(((freeCashFlow / netIncome) * 100).toFixed(1)) : 'N/A';

  return {
    ticker: t,
    sector,
    price,
    marketCapFormatted: formatCurrency(marketCap),
    valuationMetrics: {
      peRatio,
      psRatio,
      dividendYieldPercent: dividendYield,
      freeCashFlowConversionPercent: fcfConversion
    },
    investmentSummary: `${t} trades at a P/E of ${peRatio} with a dividend yield of ${dividendYield}%. FCF Conversion is ${fcfConversion}%.`
  };
}

export function parseEdgarFilingSummary(cik, filingType = '10-K', filingText = '') {
  const lower = filingText.toLowerCase();
  
  const riskPhrases = ['supply chain', 'cybersecurity', 'regulatory', 'interest rate', 'competition'];
  const identifiedRisks = riskPhrases.filter(p => lower.includes(p));

  return {
    cik,
    filingType,
    parsedAt: new Date().toISOString(),
    item1ARiskSummary: identifiedRisks.length > 0 ? `Identified risks relating to: ${identifiedRisks.join(', ')}.` : "Standard Item 1A disclosure.",
    hasMaterialChange: lower.includes('material adverse') || lower.includes('restatement')
  };
}

function formatCurrency(val) {
  if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
  return `$${val.toLocaleString()}`;
}
