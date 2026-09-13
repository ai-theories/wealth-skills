/**
 * Wealth Guidance Engine - Clarifying questions and next-step suggestions for conversational use.
 *
 * The calculation engines fail closed and say what is missing, but an agent needs that in a form it
 * can act on: which question to put to the advisor, and what is worth doing next. This module holds
 * that dialogue layer in one place so the CLI, the MCP servers and library callers share it. It
 * imports no engine, so engines can raise questions through `inputError` without a cycle.
 */

const step = (tool, why) => ({ tool, why });
const check = (action, why) => ({ tool: null, action, why });

const HUMAN_APPROVAL = check(
  'Route to a licensed advisor for review and approval before anything is submitted',
  'Order payloads and trade proposals are prepared for a person to act on, never executed here.'
);

const TOOLS = {
  'planning tax-headroom': {
    summary: 'Room left in the current federal ordinary-income bracket, for sizing a Roth conversion.',
    typicalRequests: [
      'how much can they convert to a Roth this year',
      'are they near the top of their tax bracket',
      'roth conversion headroom'
    ],
    inputs: [
      { field: 'agi', required: true, question: "What is the household's adjusted gross income for the year?", why: 'Bracket headroom is measured from taxable income, which starts at AGI.' },
      { field: 'filingStatus', required: true, question: 'Are they married filing jointly or single?', why: 'Bracket thresholds and the standard deduction differ by filing status.' }
    ],
    suggest: (result) => {
      const next = [];
      if (result.headroomForRothConversion > 0) {
        next.push(step('planning rmd', 'If the client is 73 or older, the required minimum distribution must come out before converting, and it consumes this headroom.'));
      } else {
        next.push(check('Discuss whether converting into the next bracket is still worthwhile', 'Taxable income already fills the current bracket.'));
      }
      next.push(check('Confirm state tax, NIIT and IRMAA effects with the tax preparer', 'The calculation covers federal ordinary-income brackets and the standard deduction only.'));
      return next;
    }
  },

  'planning rmd': {
    summary: 'Required minimum distribution from the Uniform Lifetime Table.',
    typicalRequests: ['what is their RMD this year', 'how much must they withdraw from the IRA', 'required minimum distribution'],
    inputs: [
      { field: 'age', required: true, question: 'How old will the account owner be this year?', why: 'The distribution period comes from their age.' },
      { field: 'balance', required: true, question: 'What was the account balance on December 31 of last year?', why: 'RMDs are calculated on the prior year-end balance, not the current one.' },
      { field: 'birthYear', required: false, question: 'What year was the account owner born?', why: 'RMDs begin at 75 rather than 73 for anyone born in 1960 or later.' }
    ],
    suggest: (result) => {
      if (!result.rmdRequired) {
        return [check('Revisit in the year they reach the starting age', 'No distribution is required yet.')];
      }
      return [
        step('planning tax-headroom', 'The distribution is ordinary income, so it reduces any remaining Roth conversion headroom.'),
        step('portfolio drift-monitor', 'Raising cash for the distribution changes the allocation; check the drift it creates.'),
        check('Confirm whether the sole beneficiary is a spouse more than 10 years younger', 'That case uses the Joint and Last Survivor Table instead, and the figure here would be too high.')
      ];
    }
  },

  'planning monte-carlo': {
    summary: 'Retirement cash-flow simulation with inflation-adjusted withdrawals.',
    typicalRequests: ['will their money last', 'can they retire on this', 'probability of running out'],
    inputs: [
      { field: 'assets', required: true, question: 'What is the total value of the portfolio funding retirement?', why: 'The simulation starts from this balance.' },
      { field: 'spend', required: true, question: 'How much do they plan to withdraw in the first year?', why: 'Withdrawals drive the outcome more than returns do.' }
    ],
    suggest: () => [
      check('Agree the return, volatility and inflation assumptions with the advisor', 'Defaults are illustrative; the success rate is only as good as they are.'),
      check('Treat the success rate as a planning input, not a promise', 'Results ignore taxes, fees and spending changes over time.')
    ]
  },

  'portfolio drift-monitor': {
    summary: 'Allocation drift against targets, with the trades that would correct it.',
    typicalRequests: ['is the portfolio off target', 'do they need rebalancing', 'how far has it drifted'],
    inputs: [
      { field: 'current', required: true, question: 'What is the current allocation, as percentages by sleeve?', why: 'Drift is measured against the targets sleeve by sleeve.' },
      { field: 'target', required: true, question: 'What is the target allocation?', why: 'Needed to measure drift.' },
      { field: 'value', required: true, question: 'What is the total portfolio value?', why: 'Trade sizes are a share of total value.' }
    ],
    suggest: (result) => {
      if (!result.isRebalanceTriggered) {
        return [check('No action needed yet; agree when to re-check', 'Every sleeve is inside its tolerance band.')];
      }
      return [
        step('portfolio tlh', 'Rebalancing sells may realize gains. Scan taxable lots for offsetting losses before trading.'),
        step('execution validate', 'Check each proposed trade against settled cash and the held position before routing it.'),
        HUMAN_APPROVAL
      ];
    }
  },

  'portfolio rebalance': {
    summary: 'Trades that move a portfolio from its current allocation to target.',
    typicalRequests: ['what trades bring this back to target', 'rebalance this portfolio'],
    inputs: [
      { field: 'current', required: true, question: 'What is the current allocation, as percentages by sleeve?', why: 'Trades are the difference from target.' },
      { field: 'target', required: true, question: 'What is the target allocation?', why: 'Needed to size the trades.' },
      { field: 'value', required: true, question: 'What is the total portfolio value?', why: 'Percentages become dollars against total value.' }
    ],
    suggest: (result) => {
      const next = [];
      if (result.allocationWarnings?.length) {
        next.push(check('Confirm the allocation percentages are of total portfolio value', result.allocationWarnings[0]));
      }
      next.push(step('portfolio tlh', 'Check for harvestable losses before realizing gains on the sells.'));
      next.push(step('execution validate', 'Validate each trade against settled cash and held positions.'));
      next.push(HUMAN_APPROVAL);
      return next;
    }
  },

  'portfolio var': {
    summary: 'Parametric Value at Risk and expected shortfall.',
    typicalRequests: ['how much could this portfolio lose', 'what is the value at risk', 'downside risk in a bad day'],
    inputs: [
      { field: 'value', required: true, question: 'What is the total portfolio value?', why: 'Risk is reported in dollars against it.' },
      { field: 'vol', required: true, question: 'What annualized volatility should the estimate use?', why: 'The library has no volatility of its own; the figure comes from you.' }
    ],
    suggest: (result) => {
      const next = [];
      if (result.riskStatus === 'ELEVATED_RISK') {
        next.push(step('portfolio drift-monitor', 'Elevated risk often follows allocation drift into equities; check the current mix.'));
      }
      next.push(check('State that this assumes normally distributed returns', 'Real losses in a crisis regularly exceed a normal-model estimate.'));
      return next;
    }
  },

  'portfolio factors': {
    summary: 'Asset-class mix, with factor and duration averages of values you supply.',
    typicalRequests: ['what is this portfolio made of', 'what is the duration', 'factor exposure'],
    inputs: [
      { field: 'holdings', required: true, question: 'What are the holdings and their weights?', why: 'Every figure is a weighted average across them.' }
    ],
    questions: (result) => {
      const questions = [];
      if (result.unclassifiedSymbols?.length) {
        questions.push({
          field: 'assetClass',
          question: `What asset class are ${result.unclassifiedSymbols.join(', ')}? (equity, fixedIncome, cash or realAssets)`,
          why: 'They are not in the symbol table, so their weight is sitting in "unclassified".'
        });
      }
      if (result.fixedIncomeFactors?.durationYears === null) {
        questions.push({ field: 'durationYears', question: 'What is the duration of each bond holding?', why: 'Without it no portfolio duration can be reported.' });
      }
      if (result.equityFactorExposures?.valueFactorScore === null) {
        questions.push({ field: 'factorScores', question: 'Do you have factor scores for the equity holdings from your risk system?', why: 'The library has no factor model, so exposures are averaged only from scores you provide.' });
      }
      return questions;
    },
    suggest: () => [check('Source factor and duration inputs from the risk or accounting system', 'Anything not supplied is reported as null rather than estimated.')]
  },

  'portfolio tlh': {
    summary: 'Tax-loss harvesting screen with a wash-sale look-back and replacement candidates.',
    typicalRequests: ['any losses to harvest', 'tax loss harvesting opportunities', 'can we offset these gains'],
    inputs: [
      { field: 'lots', required: true, question: 'Which taxable lots should I scan? For each I need the symbol, quantity, purchase price, current price and purchase date.', why: 'Losses and the wash-sale window are computed per lot.' }
    ],
    questions: (result) => {
      const unmatched = (result.opportunities ?? []).filter(o => o.recommendedReplacement === null);
      if (unmatched.length === 0) return [];
      return [{
        field: 'replacement',
        question: `Which fund should replace ${unmatched.map(o => o.symbol).join(', ')} during the wash-sale window?`,
        why: 'No candidate tracking a different index is defined for these, and the library will not guess one.'
      }];
    },
    suggest: (result) => {
      const next = [];
      if ((result.opportunities ?? []).length === 0) {
        return [check('No lots met the loss threshold; re-check after market moves', 'Nothing to harvest right now.')];
      }
      next.push(check('Confirm no substantially identical purchase in the 30 days after the sale, including IRA and spouse accounts', 'Only the 30 days before the sale, across the lots supplied, can be checked here.'));
      next.push(check('Have the advisor or tax professional confirm each replacement is not substantially identical', 'Candidates track a different index, but the determination is a judgment call.'));
      next.push(step('execution validate', 'Validate the sells against the held positions before routing.'));
      next.push(HUMAN_APPROVAL);
      return next;
    }
  },

  'quant backtest': {
    summary: 'Historical backtest over embedded annual returns for VTI, BND, VXUS and VNQ.',
    typicalRequests: ['how would this mix have done', 'backtest a 60/40', 'historical return and drawdown'],
    inputs: [
      { field: 'weights', required: true, question: 'What weights should I test, using VTI, BND, VXUS or VNQ?', why: 'Only those four have embedded return data.' }
    ],
    suggest: () => [
      step('quant forward-test', 'Past results say little about the future; project the same weights forward under a regime.'),
      check('State that returns are annual and approximate, so drawdowns are understated', 'Year-end data cannot capture an intra-year fall and recovery.')
    ]
  },

  'quant forward-test': {
    summary: 'Monte Carlo projection of a weighted portfolio under a macro regime.',
    typicalRequests: ['what happens if stagflation returns', 'project this portfolio forward', 'simulate the next five years'],
    inputs: [
      { field: 'weights', required: true, question: 'What weights should I project, using VTI, BND, VXUS or VNQ?', why: 'Assumptions are defined per asset.' },
      { field: 'regime', required: false, question: 'Which regime: baseline, stagflation, bull_market or bear_market?', why: 'Each carries different return and volatility assumptions.' }
    ],
    suggest: () => [
      check("Replace the illustrative assumptions with your firm's capital market assumptions", 'Library defaults are not forecasts and should not reach a client deliverable unchanged.')
    ]
  },

  'execution validate': {
    summary: 'Pre-trade checks: buying power, overselling and holding period.',
    typicalRequests: ['can they afford this trade', 'is this sell allowed', 'check this order before we place it'],
    inputs: [
      { field: 'order', required: true, question: 'What is the order: symbol, side, quantity and price?', why: 'Every check is against the order.' },
      { field: 'settledCash', required: false, question: 'How much settled cash is in the account?', why: 'Required to verify buying power on a buy.' },
      { field: 'positions', required: false, question: 'How many shares of the symbol are held?', why: 'Required to confirm a sell is not a short sale.' }
    ],
    questions: (result) => {
      const questions = [];
      for (const error of result.errors ?? []) {
        if (/Settled cash not supplied/.test(error)) {
          questions.push({ field: 'settledCash', question: 'How much settled cash is in the account?', why: 'Buying power cannot be verified without it.' });
        }
        if (/not supplied \(accountBalance\.positions/.test(error)) {
          questions.push({ field: 'positions', question: 'How many shares of this symbol does the account hold?', why: 'Selling more than is held would be a short sale, so the check fails closed.' });
        }
        if (/reference price/.test(error)) {
          questions.push({ field: 'price', question: 'What reference price should I use for this order?', why: 'Cost and buying power cannot be estimated without one.' });
        }
      }
      return questions;
    },
    suggest: (result) => (result.passed
      ? [step('execution payload', 'The checks passed; build the broker payload for approval.'), HUMAN_APPROVAL]
      : [check('Resolve the errors above before building any payload', 'The order failed pre-trade validation.')])
  },

  'execution payload': {
    summary: 'Broker order payload for Alpaca or Interactive Brokers. Built locally, never submitted.',
    typicalRequests: ['build the order for alpaca', 'prepare this trade for IBKR'],
    inputs: [
      { field: 'order', required: true, question: 'What is the order: symbol, side, quantity and price?', why: 'It becomes the payload.' },
      { field: 'account', required: true, question: 'Which account number should the order be placed in?', why: 'The payload is account-specific.' },
      { field: 'conid', required: false, question: 'What is the Interactive Brokers contract id (conid) for this symbol?', why: 'IBKR routes on conid, so it must be resolved rather than guessed.' }
    ],
    suggest: () => [HUMAN_APPROVAL]
  },

  'execution fix-payload': {
    summary: 'FIX 4.4 New Order Single message for a custodian.',
    typicalRequests: ['generate a FIX order', 'build a 35=D message'],
    inputs: [
      { field: 'symbol', required: true, question: 'Which symbol, side, quantity and limit price?', why: 'These become the FIX tags.' }
    ],
    suggest: () => [
      check('Take MsgSeqNum from the live FIX session', "The generator's counter is a placeholder and will not match the session."),
      HUMAN_APPROVAL
    ]
  },

  'onboarding validate-cip': {
    summary: 'Customer Identification Program field checks, recording an OFAC result screened elsewhere.',
    typicalRequests: ['can we open this account', 'is this application complete', 'CIP check'],
    inputs: [
      { field: 'applicant', required: true, question: 'What are the applicant details: legal name, taxpayer identification number, date of birth and residential address?', why: 'These are the CIP elements.' },
      { field: 'ofacStatus', required: true, question: 'Has an OFAC/SDN screen been run for this applicant, and what was the result?', why: 'The library performs no screening; without a result CIP fails as not screened.' }
    ],
    questions: (result) => {
      const questions = [];
      if (result.ofacScreened === false) {
        questions.push({ field: 'ofacStatus', question: 'Has an OFAC/SDN screen been run for this applicant, and what was the result?', why: 'CIP cannot pass without a result from a real screening source.' });
      }
      for (const flag of result.verificationFlags ?? []) {
        if (/legal name/.test(flag)) questions.push({ field: 'name', question: "What is the applicant's full legal name?", why: 'Required CIP element.' });
        if (/SSN/.test(flag)) questions.push({ field: 'ssn', question: "What is the applicant's nine-digit taxpayer identification number?", why: 'The supplied value is not nine digits.' });
        if (/address/.test(flag)) questions.push({ field: 'address', question: 'What is their residential address?', why: 'CIP requires a physical address of record.' });
        if (/Date of birth/.test(flag)) questions.push({ field: 'dob', question: 'What is their date of birth?', why: 'Age could not be verified from what was supplied.' });
      }
      return questions;
    },
    suggest: (result) => (result.cipPassed
      ? [check('Track the remaining onboarding steps (W-9, custodial agreement, funding)', 'CIP is one of four milestones before trading.')]
      : [check('Collect the missing items above, then re-run the check', 'The application is not yet complete.')])
  },

  'compliance scan': {
    summary: 'Keyword and pattern screen of a communication before principal review.',
    typicalRequests: ['is this email compliant', 'can we send this to clients', 'check this marketing copy'],
    inputs: [
      { field: 'text', required: true, question: 'What is the full text of the communication?', why: 'The screen runs over the wording as it would be sent.' }
    ],
    questions: (result) => ((result.missingDisclaimers ?? []).length > 0
      ? [{ field: 'disclosures', question: `Should the standard disclosures be added (${result.missingDisclaimers.join('; ')}), or is there a reason they do not apply here?`, why: 'They are absent from the text as written.' }]
      : []),
    suggest: (result) => {
      const next = [];
      if (result.screenStatus === 'VIOLATION') {
        next.push(check(`Rewrite the flagged language (${result.prohibitedTermsFound.join(', ')}) and re-run the screen`, 'Promissory wording cannot go to clients.'));
      }
      next.push(check('Send to a registered principal for review', 'Passing this screen is not Rule 2210 approval.'));
      return next;
    }
  },

  'compliance lookup': {
    summary: 'Registration lookup against a bundled fictitious fixture. Not connected to any registry.',
    typicalRequests: ['is this adviser registered', 'look up this CRD', 'check their disclosures'],
    inputs: [
      { field: 'crd', required: true, question: 'What CRD number should I look up?', why: 'The fixture is keyed by CRD.' }
    ],
    suggest: () => [
      check('Verify at brokercheck.finra.org or adviserinfo.sec.gov', 'This result comes from sample data and says nothing about a real person or firm.')
    ]
  },

  'uhnw collar': {
    summary: 'Collar strikes on a concentrated position, with constructive-sale review.',
    typicalRequests: ['hedge this concentrated stock', 'build a collar', 'protect this position without selling'],
    inputs: [
      { field: 'symbol', required: true, question: 'Which position, how many shares, and at what price?', why: 'Strikes are a percentage of the share price.' },
      { field: 'basis', required: true, question: 'What is the cost basis per share?', why: 'It determines the embedded gain the hedge is protecting.' },
      { field: 'premiums', required: false, question: 'What are the current put and call premiums per share?', why: 'Without live quotes the net cost of the collar is unknown.' }
    ],
    questions: (result) => (result.zeroCostStructure === null
      ? [{ field: 'premiums', question: `What are the current put premium at ${result.collarParameters?.putStrikeFloor} and call premium at ${result.collarParameters?.callStrikeCap}?`, why: 'The engine does not price options, so it cannot say whether this collar is zero-cost.' }]
      : []),
    suggest: (result) => {
      const next = [check('Have tax counsel review constructive-sale treatment under IRC §1259', 'No rule defines a safe band, and the consequence is a deemed sale of an appreciated position.')];
      if (result.constructiveSaleReview?.narrowBand) {
        next.push(check('Consider widening the strikes', `A ${result.constructiveSaleReview.collarBandPct}% band is inside the range practitioners treat as a warning sign.`));
      }
      next.push(HUMAN_APPROVAL);
      return next;
    }
  },

  'uhnw pe-metrics': {
    summary: 'Private equity multiples: TVPI/MOIC, DPI, RVPI and unfunded commitment.',
    typicalRequests: ['how is this fund performing', 'what is the TVPI', 'private equity multiples'],
    inputs: [
      { field: 'commitment', required: true, question: 'What is the commitment, called capital, distributions to date and current NAV?', why: 'Each multiple is a ratio of these.' }
    ],
    suggest: (result) => [
      check('Confirm the NAV date with the fund administrator', 'Multiples move with a stale NAV.'),
      check(`Plan liquidity for the ${result.unfundedCommitment?.toLocaleString?.('en-US') ?? 'unfunded'} commitment still to be called`, 'Capital calls arrive on the fund’s schedule, not the client’s.')
    ]
  },

  'research tear-sheet': {
    summary: 'Valuation ratios from fundamentals you supply.',
    typicalRequests: ['build a tear sheet', 'what is this trading at', 'valuation summary'],
    inputs: [
      { field: 'financials', required: true, question: 'What are the current fundamentals: price, EPS, market cap, revenue and free cash flow?', why: 'Every ratio comes from these; the library fetches no market data.' }
    ],
    suggest: () => [
      check('Confirm the fundamentals are current before using them with a client', 'Ratios are only as fresh as the inputs.'),
      step('compliance scan', 'If any of this reaches a client communication, screen the wording first.')
    ]
  },

  'crm parse-transcript': {
    summary: 'Decisions and action items pulled from meeting notes.',
    typicalRequests: ['summarize this client meeting', 'what did we agree to', 'turn these notes into tasks'],
    inputs: [
      { field: 'text', required: true, question: 'What are the meeting notes or transcript?', why: 'Extraction runs line by line over the text.' }
    ],
    suggest: (result) => {
      const next = [check('Read the extracted items against the transcript before creating tasks', 'Matching is keyword-based, so follow-ups phrased differently are missed.')];
      if (result.extractedActionItemsCount > 0) {
        next.push(check('Create the tasks in the CRM', 'Payloads are built locally and never sent anywhere.'));
      }
      return next;
    }
  }
};

export function listCapabilities() {
  return Object.entries(TOOLS).map(([tool, def]) => ({
    tool,
    summary: def.summary,
    typicalRequests: def.typicalRequests,
    inputs: def.inputs.map(({ field, required, question, why }) => ({ field, required, question, why }))
  }));
}

export function requiredInputs(tool) {
  return (TOOLS[tool]?.inputs ?? []).filter(input => input.required).map(({ field, question, why }) => ({ field, question, why }));
}

// Which required inputs the caller has not supplied yet, as questions to ask before running.
export function missingInputs(tool, args = {}) {
  return requiredInputs(tool).filter(input => args[input.field] === undefined || args[input.field] === null);
}

export function guidanceFor(tool, result) {
  const def = TOOLS[tool];
  if (!def || result === null || typeof result !== 'object' || Array.isArray(result)) {
    return { needsInput: [], suggestedNextSteps: [] };
  }

  const needsInput = def.questions ? def.questions(result) : [];
  const suggestedNextSteps = def.suggest ? def.suggest(result) : [];
  return { needsInput, suggestedNextSteps };
}

// Attaches what to ask and what to do next, so an agent can carry the conversation forward instead
// of stopping at a number.
export function withGuidance(result, tool) {
  if (result === null || typeof result !== 'object' || Array.isArray(result)) return result;

  const { needsInput, suggestedNextSteps } = guidanceFor(tool, result);
  const guided = { ...result };
  if (needsInput.length > 0) guided.needsInput = needsInput;
  if (suggestedNextSteps.length > 0) guided.suggestedNextSteps = suggestedNextSteps;
  return guided;
}

// An error an agent can turn into a question rather than a dead end.
export function inputError(message, needsInput) {
  const error = new Error(message);
  error.needsInput = needsInput;
  return error;
}
