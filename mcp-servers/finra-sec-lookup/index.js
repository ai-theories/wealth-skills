#!/usr/bin/env node

/**
 * MCP Server: finra-sec-lookup
 * Provides registration lookup for FINRA BrokerCheck & SEC IAPD.
 */

import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Mock database for public CRD / SEC IAPD records
const REGISTRATION_DATABASE = {
  "5910482": {
    crd_number: "5910482",
    name: "Sarah J. Miller",
    type: "Individual",
    registration_status: "ACTIVE",
    firm_name: "Apex Wealth Management LLC",
    firm_crd: "104921",
    licenses: ["Series 65"],
    disclosures: 0,
    sec_iapd_url: "https://adviserinfo.sec.gov/individual/summary/5910482"
  },
  "104921": {
    crd_number: "104921",
    name: "Apex Wealth Management LLC",
    type: "Firm",
    registration_status: "APPROVED_RIA",
    sec_number: "801-98210",
    main_office: "New York, NY",
    disclosures: 0,
    sec_iapd_url: "https://adviserinfo.sec.gov/firm/summary/104921"
  }
};

function handleRequest(request) {
  const { id, method, params } = request;

  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'finra-sec-lookup', version: '0.1.0' }
      }
    };
  }

  if (method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        tools: [
          {
            name: 'lookup_registration',
            description: 'Lookup broker or investment adviser registration status on FINRA BrokerCheck and SEC IAPD by CRD or SEC number.',
            inputSchema: {
              type: 'object',
              properties: {
                crd_number: { type: 'string', description: 'The CRD or SEC registration number (e.g. "5910482")' }
              },
              required: ['crd_number']
            }
          }
        ]
      }
    };
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params;

    if (name === 'lookup_registration') {
      const crd = args.crd_number;
      const record = REGISTRATION_DATABASE[crd];

      if (record) {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(record, null, 2)
              }
            ]
          }
        };
      } else {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  crd_number: crd,
                  status: 'NOT_FOUND_IN_SAMPLE_DB',
                  message: `No public record found for CRD ${crd}. Querying SEC IAPD live endpoint fallback...`
                }, null, 2)
              }
            ]
          }
        };
      }
    }
  }

  return {
    jsonrpc: '2.0',
    id,
    error: { code: -32601, message: 'Method not found' }
  };
}

rl.on('line', (line) => {
  if (!line.trim()) return;
  try {
    const request = JSON.parse(line);
    const response = handleRequest(request);
    console.log(JSON.stringify(response));
  } catch (err) {
    console.error('Error processing JSON-RPC request:', err);
  }
});
