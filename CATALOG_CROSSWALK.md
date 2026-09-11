# US Wealth Management Capability Catalog Crosswalk

This maps the executable resources in the US Wealth Management Capability Catalog to `wealth-skills` packs and states how much of each is backed by engine code.

The catalog has **400 resources in four sections of 100**: `T001–T100` executable skills, tools and commercial platforms; `G001–G100` open-source GitHub repositories; `S001–S100` authoritative specifications and rules; and `R001–R100` research and white papers. Only the `T` section describes capabilities a skill pack can implement, so only it is mapped here. The `G`, `S` and `R` sections are reference material and are not assigned to packs. (An earlier version of this file described a `T001–T400` numbering that the catalog does not use.)

---

## Status Definitions

| Status | Meaning |
|---|---|
| **Engine-backed** | A library function implements the core calculation for this resource's primary use. |
| **Partial engine** | A function covers one narrow piece; the rest is `SKILL.md` guidance. |
| **Payload builder only** | Builds request payloads locally. There is no connection and nothing is submitted. |
| **Sample fixture only** | Returns fictitious bundled data. Not connected to the real service. |
| **Guidance only** | `SKILL.md` workflow guidance with no engine code. |

None of these replace the named product, and there are no live connectors to any commercial platform.

---

## Range Summary (T Section)

| Range | Category | Pack | What the engines actually cover |
|---|---|---|---|
| **T001–T007** | Financial planning platforms | `wealth-planning` | Bracket headroom, RMDs, retirement Monte Carlo |
| **T008–T014** | Wealth CRMs & meeting tools | `wealth-crm` | Transcript keyword parsing; CRM task payloads (not sent) |
| **T015–T024** | Portfolio accounting & reporting | `wealth-portfolio` | None of the accounting; drift and rebalance math only |
| **T025–T033** | Risk engines & optimization | `wealth-portfolio` | Parametric VaR/ES; averages of supplied factor scores; tax-loss harvesting screen |
| **T034–T041** | Market intelligence & research | `wealth-research` | Ratios from supplied fundamentals |
| **T042–T051** | Custody & brokerage | `wealth-execution` | Pre-trade checks; Alpaca, IBKR and FIX payloads (not submitted) |
| **T052–T061** | Market & fundamental data APIs | `wealth-research` | Latest FRED observation; SEC EDGAR company facts (library only) |
| **T062–T070** | Identity, aggregation & onboarding | `wealth-onboarding` | CIP field checks; records a caller-supplied OFAC result |
| **T071–T081** | Compliance & surveillance | `wealth-compliance` | Promissory-language screen; fictitious registration fixture |
| **T082–T090** | Specialized planning & household | `wealth-planning` | Nothing beyond the planning engines above |
| **T091–T100** | Packaged AI agents & briefings | `wealth-crm` / `wealth-research` | Transcript keyword parsing |

---

## Selected Resources

| ID | Resource | Catalog capability | Pack | Status |
|---|---|---|---|---|
| **T001** | eMoney Advisor | Cash-flow & household scenarios | `skills/wealth-planning` | Partial engine — retirement Monte Carlo |
| **T002** | RightCapital | Retirement & tax planning | `skills/wealth-planning` | Partial engine — bracket headroom, RMDs, Monte Carlo |
| **T003** | MoneyGuide | Goal-based financial planning | `skills/wealth-planning` | Partial engine — retirement Monte Carlo |
| **T004** | Orion Planning | Integrated advisor planning | `skills/wealth-planning` | Guidance only |
| **T005** | Asset-Map | Household visual financial discovery | `skills/wealth-planning` | Guidance only |
| **T006** | Holistiplan | Tax return parsing & opportunities | `skills/wealth-planning` | Partial engine — bracket headroom from a supplied AGI; no return parsing |
| **T007** | Income Lab | Retirement spending & income analysis | `skills/wealth-planning` | Partial engine — Monte Carlo with inflation-adjusted withdrawals, RMDs |
| **T008** | Salesforce FSC | Relationship & workflow CRM | `skills/wealth-crm` | Payload builder only — generic task JSON, not sent |
| **T009** | Wealthbox | Advisor CRM & task workflows | `skills/wealth-crm` | Payload builder only — generic task JSON, not sent |
| **T010** | Practifi | Wealth management CRM processes | `skills/wealth-crm` | Payload builder only — generic task JSON, not sent |
| **T011** | AdvisorEngine | Advisor CRM & portfolio workflows | `skills/wealth-crm` | Payload builder only — generic task JSON, not sent |
| **T012** | Advyzon | Reporting & advisor CRM | `skills/wealth-crm` | Payload builder only — generic task JSON, not sent |
| **T013** | Jump | Meeting prep & doc generation | `skills/wealth-crm` | Partial engine — transcript keyword parsing |
| **T014** | Zocks | Meeting intelligence & CRM sync | `skills/wealth-crm` | Partial engine — transcript keyword parsing |
| **T015** | Addepar | Investment aggregation & reporting | `skills/wealth-portfolio` | Guidance only |
| **T016** | Orion Advisor Tech | Portfolio accounting & ops | `skills/wealth-portfolio` | Guidance only |
| **T017** | SS&C Black Diamond | Wealth reporting & client portal | `skills/wealth-portfolio` | Guidance only |
| **T018** | SS&C Advent APX | Portfolio accounting & reporting | `skills/wealth-portfolio` | Guidance only |
| **T019** | SS&C Geneva | Complex alternative accounting | `skills/wealth-portfolio` | Guidance only |
| **T020** | Envestnet | Managed-account investment platform | `skills/wealth-portfolio` | Guidance only |
| **T025** | MSCI BarraOne | Multi-asset portfolio risk engine | `skills/wealth-portfolio` | Partial engine — parametric VaR/ES; no factor model |
| **T034** | Morningstar Direct | Fund research & analysis | `skills/wealth-research` | Guidance only |
| **T035** | Bloomberg Terminal | Real-time market data & news | `skills/wealth-research` | Guidance only |
| **T042** | Schwab Advisor Services | Custody & account servicing | `skills/wealth-execution` | Payload builder only — FIX 4.4 messages and pre-trade checks; no custodian connection |
| **T047** | Alpaca Trading API | Programmatic trading | `skills/wealth-execution` | Payload builder only — REST order JSON; no MCP tool; not submitted |
| **T049** | Interactive Brokers API | Brokerage, market data & reporting | `skills/wealth-execution` | Payload builder only — REST order JSON with a caller-supplied `conid`; not submitted |
| **T061** | SEC EDGAR API | Issuer filings & company facts | `skills/wealth-research` | Engine-backed (library) — live company facts; requires `SEC_EDGAR_USER_AGENT`; no CLI or MCP tool |
| **T062** | Plaid Investments | Investment holdings aggregation | `skills/wealth-onboarding` | Guidance only |
| **T068** | Alloy | Identity decisioning & CIP rules | `skills/wealth-onboarding` | Partial engine — CIP field checks; no identity decisioning |
| **T080** | FINRA BrokerCheck | Broker registration & disclosures | `skills/wealth-compliance` | Sample fixture only — two fictitious records |
| **T081** | SEC IAPD | Investment adviser registration lookup | `skills/wealth-compliance` | Sample fixture only — two fictitious records |
| **T082** | FP Alpha | Tax, estate & insurance analysis | `skills/wealth-planning` | Guidance only |
| **T083** | Vanilla | Estate planning document visualization | `skills/wealth-planning` | Guidance only |
| **T090** | YNAB | Household budgeting & spending | `skills/wealth-planning` | Guidance only |
| **T091** | Anthropic Meeting Prep Agent | Briefing & client summary draft | `skills/wealth-crm` | Partial engine — transcript keyword parsing |
