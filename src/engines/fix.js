/**
 * Wealth FIX Engine - Institutional FIX 4.4 / 5.0 Trade Protocol Tag Generator
 */

export function buildFixOrderPayload(orderDetails = {}) {
  const {
    account = 'U9821045',
    symbol = 'VTI',
    side = 'BUY', // BUY=1, SELL=2
    quantity = 100,
    price = 275.50,
    orderType = 'LIMIT', // MARKET=1, LIMIT=2
    timeInForce = 'DAY', // DAY=0, GTC=1
    targetCustodian = 'Pershing_NetX360'
  } = orderDetails;

  const sideCode = side.toUpperCase() === 'BUY' ? '1' : '2';
  const ordTypeCode = orderType.toUpperCase() === 'LIMIT' ? '2' : '1';
  const tifCode = timeInForce.toUpperCase() === 'GTC' ? '1' : '0';
  const transactTime = new Date().toISOString().replace(/[-:]/g, '').replace('Z', '');

  const tags = [
    '8=FIX.4.4',
    '35=D', // New Order Single
    `49=WEALTH_SKILLS_AI`,
    `56=${targetCustodian.toUpperCase()}`,
    `34=${Math.floor(Math.random() * 10000)}`,
    `52=${transactTime}`,
    `11=ORD-${Date.now()}`,
    `1=${account}`,
    `55=${symbol.toUpperCase()}`,
    `54=${sideCode}`,
    `60=${transactTime}`,
    `38=${quantity}`,
    `40=${ordTypeCode}`,
    ordTypeCode === '2' ? `44=${price}` : null,
    `59=${tifCode}`
  ].filter(Boolean);

  const rawMessageBody = tags.slice(2).join('\x01') + '\x01';
  const bodyLength = rawMessageBody.length;
  const fullMessageNoChecksum = `8=FIX.4.4\x019=${bodyLength}\x01` + rawMessageBody;

  const checksum = calculateFixChecksum(fullMessageNoChecksum);
  const fixMessageStr = `${fullMessageNoChecksum}10=${checksum}\x01`;

  return {
    protocol: 'FIX.4.4',
    targetCustodian,
    symbol: symbol.toUpperCase(),
    side,
    quantity,
    price,
    fixMessageRaw: fixMessageStr,
    fixMessageReadable: fixMessageStr.replace(/\x01/g, ' | '),
    tagsMap: {
      '8_BeginString': 'FIX.4.4',
      '35_MsgType': 'D (New Order Single)',
      '1_Account': account,
      '55_Symbol': symbol.toUpperCase(),
      '54_Side': sideCode === '1' ? '1 (Buy)' : '2 (Sell)',
      '38_OrderQty': quantity,
      '40_OrdType': ordTypeCode === '2' ? '2 (Limit)' : '1 (Market)',
      '44_Price': price,
      '10_CheckSum': checksum
    },
    requiresHumanApproval: true
  };
}

export function parseFixMessage(fixString) {
  const parts = fixString.split(/[\x01|]/).filter(Boolean);
  const tagMap = {};

  for (const p of parts) {
    const [k, v] = p.split('=');
    if (k && v) tagMap[k] = v;
  }

  return {
    beginString: tagMap['8'],
    msgType: tagMap['35'],
    account: tagMap['1'],
    symbol: tagMap['55'],
    side: tagMap['54'] === '1' ? 'BUY' : 'SELL',
    quantity: parseFloat(tagMap['38']),
    price: tagMap['44'] ? parseFloat(tagMap['44']) : undefined,
    checksum: tagMap['10']
  };
}

function calculateFixChecksum(str) {
  let sum = 0;
  for (let i = 0; i < str.length; i++) {
    sum += str.charCodeAt(i);
  }
  const check = sum % 256;
  return String(check).padStart(3, '0');
}
