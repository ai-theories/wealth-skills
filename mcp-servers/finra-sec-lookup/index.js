#!/usr/bin/env node

/**
 * MCP Server: finra-sec-lookup
 * SAMPLE DATA ONLY. Serves a two-record fictitious fixture for demos. It is not connected to FINRA
 * BrokerCheck or SEC IAPD and must not be used to answer real registration questions.
 */

import { startStdioServer, isMainModule } from '../lib/stdio-server.js';
import { parseBrokerCheckRecord } from '../../src/engines/compliance.js';
import { withAuditMetadata, LIBRARY_VERSION } from '../../src/engines/audit.js';

export const server = {
  name: 'finra-sec-lookup',
  version: LIBRARY_VERSION,
  tools: [
    {
      name: 'lookup_registration',
      description: 'SAMPLE DATA ONLY - NOT CONNECTED TO FINRA BROKERCHECK OR SEC IAPD. Looks up a CRD number in a two-record fictitious fixture bundled for demos. No result can confirm or deny that a real person or firm is registered or has disclosures; verify real registrations at https://brokercheck.finra.org or https://adviserinfo.sec.gov.',
      inputSchema: {
        type: 'object',
        properties: {
          crd_number: { type: 'string', description: 'CRD number to look up in the sample fixture, e.g. "5910482"' }
        },
        required: ['crd_number']
      },
      handler: (args) => withAuditMetadata(parseBrokerCheckRecord(args.crd_number), {
        skillPack: 'wealth-compliance',
        tool: 'lookup_registration',
        engineFunction: 'parseBrokerCheckRecord',
        methodology: 'Exact CRD match against a bundled fixture',
        dataSources: ['bundled SAMPLE_FIXTURE (two fictitious records); no registry queried']
      })
    }
  ]
};

if (isMainModule(import.meta.url)) startStdioServer(server);
