// index.ts — library API for the mechanical cumulative spend gate.
//
// Any orchestrator imports checkSpend() from here. See gate.ts for the
// invariant. This barrel intentionally re-exports the SUM-based gate only —
// there is no single-amount "is this cheap?" entry point to import.

export { checkSpend, defaultPaths, monthOf, dateOf } from "./gate.ts";
export type {
  CheckSpendRequest,
  CheckSpendResult,
  SpendGatePaths,
} from "./gate.ts";
export {
  readLedger,
  monthAllowedTotalCents,
  type LedgerEntry,
  type LedgerStatus,
} from "./ledger.ts";
export { loadCeilingCents } from "./config.ts";
export { dollarsToCents, centsToDollarString } from "./money.ts";
