/**
 * Wealth Execution Engine - Self-Contained Pre-Trade Validation & Broker Payload Logic
 */

export function validatePreTradeCompliance(accountBalance, orderDetails) {
  const { symbol, action, quantity, price } = orderDetails;
  const estimatedCost = quantity * price;

  const errors = [];
  const warnings = [];

  if (action === 'BUY' && estimatedCost > accountBalance.settledCash) {
    errors.push(`Insufficient buying power. Order cost ($${estimatedCost}) exceeds settled cash ($${accountBalance.settledCash}).`);
  }

  if (action === 'SELL' && orderDetails.holdingPeriodDays && orderDetails.holdingPeriodDays < 365) {
    warnings.push(`Short-term capital gains tax triggered. Holding period is ${orderDetails.holdingPeriodDays} days.`);
  }

  const passed = errors.length === 0;

  return {
    symbol,
    action,
    quantity,
    price,
    estimatedCost,
    passed,
    errors,
    warnings,
    requiresHumanApproval: true
  };
}

export function buildTradePayload(broker = 'Alpaca', accountId, orderDetails) {
  const { symbol, action, quantity, price, orderType = 'LIMIT', tif = 'DAY' } = orderDetails;

  if (broker.toLowerCase() === 'alpaca') {
    return {
      broker: 'Alpaca_API',
      endpoint: '/v2/orders',
      payload: {
        symbol: symbol.toUpperCase(),
        qty: quantity,
        side: action.toLowerCase(),
        type: orderType.toLowerCase(),
        time_in_force: tif.toLowerCase(),
        limit_price: orderType.toUpperCase() === 'LIMIT' ? String(price) : undefined
      },
      requiresHumanApproval: true
    };
  }

  return {
    broker: 'Interactive_Brokers_API',
    endpoint: '/v1/api/iserver/account/' + accountId + '/orders',
    payload: {
      orders: [
        {
          acctId: accountId,
          conid: 265598, // Example contract ID
          secType: 'STK',
          cFC: 'USD',
          ticker: symbol.toUpperCase(),
          orderType: orderType.toUpperCase(),
          price: price,
          side: action.toUpperCase(),
          quantity: quantity,
          tif: tif.toUpperCase()
        }
      ]
    },
    requiresHumanApproval: true
  };
}
