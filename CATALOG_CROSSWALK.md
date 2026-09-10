# US Wealth Management Capability Catalog Crosswalk (T001 - T400)

This document provides the complete mapping of all **400 resources** in the US Wealth Management Capability Catalog to their corresponding **`wealth-skills`** pack and MCP connector interface.

---

## Catalog Index & Capability Summary

| Capability Range | Category | Target `wealth-skills` Pack | Primary Outcome / Capabilities |
|---|---|---|---|
| **T001 - T007** | Financial Planning Platforms | `wealth-planning` | Goal planning, cash flow, tax scenarios (eMoney, RightCapital, MoneyGuide) |
| **T008 - T014** | Wealth CRMs & Operations | `wealth-crm` | Household relationships, meeting briefings, task workflows (Salesforce FSC, Wealthbox) |
| **T015 - T024** | Portfolio Accounting & Reporting | `wealth-portfolio` | Performance attribution, account reporting, GL reconciliation (Addepar, Orion, SS&C) |
| **T025 - T033** | Risk Engine & Optimization | `wealth-portfolio` | Multi-asset factor risk, portfolio optimization, tax transitions (Barra, Axioma, 55ip) |
| **T034 - T041** | Market Intelligence & Research | `wealth-research` | Equity research, news synthesis, alternatives access (Morningstar, Bloomberg, CAIS) |
| **T042 - T051** | Custody & Brokerage Execution | `wealth-execution` | Pre-trade compliance, trade order formatting, execution (Schwab, Fidelity, Alpaca, IBKR) |
| **T052 - T061** | Market & Fundamental APIs | `wealth-research` | Real-time prices, SEC filings, FRED macro data (Databento, FMP, SEC EDGAR, FRED) |
| **T062 - T070** | Identity, Aggregation & Onboarding| `wealth-onboarding` | Account aggregation, KYC/CIP identity verification, eSign (Plaid, Alloy, Socure) |
| **T071 - T081** | Compliance & Surveillance | `wealth-compliance` | BrokerCheck/IAPD lookups, communications archiving, AML screening (FINRA, Smarsh) |
| **T082 - T090** | Specialized Planning & Household | `wealth-planning` | Estate planning, tax-lot optimization, budgeting (FP Alpha, Vanilla, YNAB) |
| **T091 - T100** | Packaged AI Agents & Briefings | `wealth-crm` / `wealth-research` | Meeting prep agents, market researcher agents, earnings reviewers |
| **T101 - T200** | Advisory & Investment Workflows | `wealth-planning` / `wealth-portfolio` | Direct indexing, asset location, tax-loss harvesting, HNW estate structuring |
| **T201 - T300** | Trading, Custody & Data Feeds | `wealth-execution` / `wealth-research` | FIX protocol translation, corporate action feeds, option vol strategies |
| **T301 - T400** | Enterprise Operations & Legal | `wealth-compliance` / `wealth-onboarding` | Custodial ACAT transfers, GIPS compliance, trust accounting, regulatory reporting |

---

## Detailed Resource Mapping Matrix (Sample View T001–T100)

| ID | Resource Name | Catalog Capability | Assigned `wealth-skills` Pack | Implementation Status |
|---|---|---|---|---|
| **T001** | eMoney Advisor | Cash-flow & household scenarios | `skills/wealth-planning` | ✅ Ready (Workflow Skill) |
| **T002** | RightCapital | Retirement & tax planning | `skills/wealth-planning` | ✅ Ready (Workflow Skill) |
| **T003** | MoneyGuide | Goal-based financial planning | `skills/wealth-planning` | ✅ Ready (Workflow Skill) |
| **T004** | Orion Planning | Integrated advisor planning | `skills/wealth-planning` | ✅ Ready (Workflow Skill) |
| **T005** | Asset-Map | Household visual financial discovery | `skills/wealth-planning` | ✅ Ready (Workflow Skill) |
| **T006** | Holistiplan | Tax return parsing & opportunities | `skills/wealth-planning` | ✅ Ready (Workflow Skill) |
| **T007** | Income Lab | Retirement spending & income analysis | `skills/wealth-planning` | ✅ Ready (Workflow Skill) |
| **T008** | Salesforce FSC | Relationship & workflow CRM | `skills/wealth-crm` | ✅ Ready (Workflow Skill) |
| **T009** | Wealthbox | Advisor CRM & task workflows | `skills/wealth-crm` | ✅ Ready (Workflow Skill) |
| **T010** | Practifi | Wealth management CRM processes | `skills/wealth-crm` | ✅ Ready (Workflow Skill) |
| **T011** | AdvisorEngine | Advisor CRM & portfolio workflows | `skills/wealth-crm` | ✅ Ready (Workflow Skill) |
| **T012** | Advyzon | Reporting & advisor CRM | `skills/wealth-crm` | ✅ Ready (Workflow Skill) |
| **T013** | Jump | Meeting prep & doc generation | `skills/wealth-crm` | ✅ Ready (Workflow Skill) |
| **T014** | Zocks | Meeting intelligence & CRM sync | `skills/wealth-crm` | ✅ Ready (Workflow Skill) |
| **T015** | Addepar | Investment aggregation & reporting | `skills/wealth-portfolio` | ✅ Ready (Workflow Skill) |
| **T016** | Orion Advisor Tech | Portfolio accounting & ops | `skills/wealth-portfolio` | ✅ Ready (Workflow Skill) |
| **T017** | SS&C Black Diamond | Wealth reporting & client portal | `skills/wealth-portfolio` | ✅ Ready (Workflow Skill) |
| **T018** | SS&C Advent APX | Portfolio accounting & reporting | `skills/wealth-portfolio` | ✅ Ready (Workflow Skill) |
| **T019** | SS&C Geneva | Complex alternative accounting | `skills/wealth-portfolio` | ✅ Ready (Workflow Skill) |
| **T020** | Envestnet | Managed-account investment platform | `skills/wealth-portfolio` | ✅ Ready (Workflow Skill) |
| **T025** | MSCI BarraOne | Multi-asset portfolio risk engine | `skills/wealth-portfolio` | ✅ Ready (Workflow Skill) |
| **T034** | Morningstar Direct | Fund research & analysis | `skills/wealth-research` | ✅ Ready (Workflow Skill) |
| **T035** | Bloomberg Terminal | Real-time market data & news | `skills/wealth-research` | ✅ Ready (Workflow Skill) |
| **T042** | Schwab Advisor Services | Custody & account servicing | `skills/wealth-execution` | ✅ Ready (Workflow Skill) |
| **T047** | Alpaca Trading API | Programmatic equity/crypto trading | `skills/wealth-execution` | ✅ Ready (MCP + Workflow) |
| **T049** | Interactive Brokers API| Brokerage, market data & reporting | `skills/wealth-execution` | ✅ Ready (MCP + Workflow) |
| **T061** | SEC EDGAR API | Issuer filings & company facts | `skills/wealth-research` | ✅ Ready (MCP + Workflow) |
| **T062** | Plaid Investments | Investment holdings aggregation | `skills/wealth-onboarding` | ✅ Ready (Workflow Skill) |
| **T068** | Alloy | Identity decisioning & CIP rules | `skills/wealth-onboarding` | ✅ Ready (Workflow Skill) |
| **T080** | FINRA BrokerCheck | Broker registration & disclosures | `skills/wealth-compliance` | ✅ Ready (MCP + Workflow) |
| **T081** | SEC IAPD | Investment adviser registration lookup | `skills/wealth-compliance` | ✅ Ready (MCP + Workflow) |
| **T082** | FP Alpha | Tax, estate & insurance analysis | `skills/wealth-planning` | ✅ Ready (Workflow Skill) |
| **T083** | Vanilla | Estate planning document visualization| `skills/wealth-planning` | ✅ Ready (Workflow Skill) |
| **T090** | YNAB | Household budgeting & spending | `skills/wealth-planning` | ✅ Ready (Workflow Skill) |
| **T091** | Meeting Prep Agent | Briefing & client summary draft | `skills/wealth-crm` | ✅ Ready (Workflow Skill) |

---

## Full Catalog Map (T101 - T400 Range Coverage)

All remaining 300 capabilities (`T101` through `T400`) are mapped in the respective `SKILL.md` documents across the 7 Skill Packs:
- **T101-T150**: Handled in [`skills/wealth-planning/SKILL.md`](skills/wealth-planning/SKILL.md) and [`skills/wealth-portfolio/SKILL.md`](skills/wealth-portfolio/SKILL.md)
- **T151-T250**: Handled in [`skills/wealth-portfolio/SKILL.md`](skills/wealth-portfolio/SKILL.md) and [`skills/wealth-research/SKILL.md`](skills/wealth-research/SKILL.md)
- **T251-T320**: Handled in [`skills/wealth-execution/SKILL.md`](skills/wealth-execution/SKILL.md) and [`skills/wealth-onboarding/SKILL.md`](skills/wealth-onboarding/SKILL.md)
- **T321-T400**: Handled in [`skills/wealth-compliance/SKILL.md`](skills/wealth-compliance/SKILL.md) and [`skills/wealth-onboarding/SKILL.md`](skills/wealth-onboarding/SKILL.md)
