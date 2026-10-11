import Decimal from "decimal.js";

// 40 significant digits: far more than needed, so rounding only ever happens at the edges.
const D = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

/** The dinar has 3 decimals (millimes). */
const round3 = (value: Decimal) => value.toDecimalPlaces(3, Decimal.ROUND_HALF_UP);

/** Thrown when millime rounding makes a schedule impossible (tiny amount, huge rate, very long term). */
export class UnschedulableLoanError extends Error {
  constructor() {
    super("This amount, duration and rate cannot be scheduled. Try a larger amount or a shorter duration.");
    this.name = "UnschedulableLoanError";
  }
}

export interface ScheduleRow {
  number: number;
  payment: string;
  principal: string;
  interest: string;
  remaining: string;
}

export interface LoanQuote {
  amount: string;
  months: number;
  annualRate: string;
  monthlyPayment: string;
  totalPayment: string;
  totalInterest: string;
  schedule: ScheduleRow[];
}

/**
 * Fixed-installment amortization (annuity), computed with arbitrary-precision decimals.
 *
 * Rounding policy:
 *  - the monthly payment is rounded once, to the millime;
 *  - each month's interest is rounded to the millime;
 *  - principal = payment - interest, so every row adds up exactly;
 *  - the last installment absorbs the accumulated rounding and clears the balance to 0.000.
 */
export function computeLoan(amount: string, annualRatePercent: string, months: number): LoanQuote {
  const principal = new D(amount);
  const monthlyRate = new D(annualRatePercent).div(100).div(12);

  const payment = monthlyRate.isZero()
    ? round3(principal.div(months))
    : round3(principal.mul(monthlyRate).div(new D(1).minus(monthlyRate.plus(1).pow(-months))));

  let balance = principal;
  let totalPayment = new D(0);
  let totalInterest = new D(0);
  const schedule: ScheduleRow[] = [];

  for (let number = 1; number <= months; number++) {
    const interest = round3(balance.mul(monthlyRate));
    const last = number === months;
    const principalPart = last ? balance : payment.minus(interest);
    const installment = last ? principalPart.plus(interest) : payment;

    // Never emit a broken row: every installment repays some principal and stays positive.
    if (principalPart.lte(0) || installment.lte(0)) throw new UnschedulableLoanError();

    balance = balance.minus(principalPart);
    totalPayment = totalPayment.plus(installment);
    totalInterest = totalInterest.plus(interest);

    schedule.push({
      number,
      payment: installment.toFixed(3),
      principal: principalPart.toFixed(3),
      interest: interest.toFixed(3),
      remaining: balance.toFixed(3),
    });
  }

  return {
    amount: principal.toFixed(3),
    months,
    annualRate: new D(annualRatePercent).toFixed(4),
    monthlyPayment: payment.toFixed(3),
    totalPayment: totalPayment.toFixed(3),
    totalInterest: totalInterest.toFixed(3),
    schedule,
  };
}

/** Smallest monthly income for which this payment stays within the product's debt ratio. */
export function minimumIncome(monthlyPayment: string, maxDebtRatio: string): string {
  const ratio = new D(maxDebtRatio);
  if (ratio.lte(0)) return "0.000";
  return new D(monthlyPayment).div(ratio).toDecimalPlaces(3, Decimal.ROUND_UP).toFixed(3);
}