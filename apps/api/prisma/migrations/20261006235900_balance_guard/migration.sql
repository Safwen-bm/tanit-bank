-- Defense in depth: the ledger already refuses overdrafts, the database does too.
-- Only the internal TREASURY account may go negative.
ALTER TABLE "Account"
  ADD CONSTRAINT "account_balance_non_negative"
  CHECK ("type" = 'TREASURY' OR "balance" >= 0);