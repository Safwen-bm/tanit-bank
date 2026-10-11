/**
 * Demo data for recruiters: four customers with six months of believable history.
 *
 * Everything goes through the real services (registration, ledger, loans, cards), so every rule
 * (atomic transfers, limits, debt ratio, audit trail, notifications) applies exactly as in
 * production. The history is built chronologically: after each simulated month the whole database
 * is moved back by one calendar month, so the charts and statements span real months.
 *
 *   npm run build && npm run db:seed:demo
 */
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AccountsService } from "../accounts/accounts.service";
import { AppModule } from "../app.module";
import { AuthService } from "../auth/auth.service";
import { CardsService } from "../cards/cards.service";
import { LoanApplicationsService } from "../loans/loan-applications.service";
import { LoanReviewService } from "../loans/loan-review.service";
import { PrismaService } from "../prisma/prisma.service";
import { TransactionsService } from "../transactions/transactions.service";

const PASSWORD = "Demo-Pass-2026";

interface Person {
  key: string;
  name: string;
  email: string;
  income: string;
  rent: string;
  living: string;
}

const PEOPLE: Person[] = [
  { key: "amel", name: "Amel Trabelsi", email: "amel@demo.tn", income: "3200", rent: "900", living: "1100" },
  { key: "youssef", name: "Youssef Ben Ali", email: "youssef@demo.tn", income: "2100", rent: "700", living: "800" },
  { key: "salma", name: "Salma Gharbi", email: "salma@demo.tn", income: "4500", rent: "1300", living: "1500" },
  { key: "karim", name: "Karim Jlassi", email: "karim@demo.tn", income: "1800", rent: "500", living: "600" },
];

const MERCHANTS = ["Carrefour Lac 2", "Monoprix", "Station Agil", "Pharmacie Centrale", "Cafe Lac", "Fnac Tunis", "Jumia", "Ooredoo"];

interface Ctx {
  id: string;
  accountId: string;
  iban: string;
  savingsId?: string;
  cardId?: string;
}

// Small deterministic generator: the demo looks the same every time it is rebuilt.
let seed = 20261009;
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const amount = (min: number, max: number) => (min + rand() * (max - min)).toFixed(3);

const AGE_SQL = [
  `UPDATE "User" SET "createdAt" = "createdAt" - interval '1 month'`,
  `UPDATE "Account" SET "createdAt" = "createdAt" - interval '1 month', "closedAt" = "closedAt" - interval '1 month'`,
  `UPDATE "Card" SET "createdAt" = "createdAt" - interval '1 month'`,
  `UPDATE "Transaction" SET "createdAt" = "createdAt" - interval '1 month'`,
  `UPDATE "AuditLog" SET "createdAt" = "createdAt" - interval '1 month'`,
  `UPDATE "Notification" SET "createdAt" = "createdAt" - interval '1 month', "readAt" = "readAt" - interval '1 month'`,
  `UPDATE "Loan" SET "createdAt" = "createdAt" - interval '1 month', "reviewedAt" = "reviewedAt" - interval '1 month', "disbursedAt" = "disbursedAt" - interval '1 month'`,
  `UPDATE "LoanInstallment" SET "dueDate" = ("dueDate" - interval '1 month')::date, "paidAt" = "paidAt" - interval '1 month'`,
];

const SPREAD: [string, string][] = [
  ["Transaction", "createdAt"],
  ["AuditLog", "createdAt"],
  ["Notification", "createdAt"],
  ["Loan", "createdAt"],
  ["LoanInstallment", "paidAt"],
];

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "true") {
    console.error("Refusing to create demo data with NODE_ENV=production. Set ALLOW_DEMO_SEED=true to override.");
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ["error", "warn"] });
  const prisma = app.get(PrismaService);
  const auth = app.get(AuthService);
  const accounts = app.get(AccountsService);
  const transactions = app.get(TransactionsService);
  const cards = app.get(CardsService);
  const loans = app.get(LoanApplicationsService);
  const review = app.get(LoanReviewService);

  if ((await prisma.user.count({ where: { email: { endsWith: "@demo.tn" } } })) > 0) {
    console.log("Demo data already exists. Nothing to do.");
    await app.close();
    return;
  }

  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  const treasury = await prisma.account.findFirst({ where: { type: "TREASURY" } });
  const products = await prisma.loanProduct.findMany();
  if (!admin || !treasury || products.length === 0) {
    throw new Error("Run `npm run db:seed` first (admin, treasury and loan products are required).");
  }
  const product = (name: string) => {
    const found = products.find((p) => p.name === name);
    if (!found) throw new Error(`Loan product "${name}" is missing. Run \`npm run db:seed\` on an empty product table.`);
    return found.id;
  };

  const ctx = new Map<string, Ctx>();
  const loanIds: Record<string, string> = {};

  const deposit = (who: Ctx, value: string, description: string) =>
    transactions.deposit(who.id, { accountId: who.accountId, amount: value, description }, {});
  const withdraw = (who: Ctx, value: string, description: string) =>
    transactions.withdraw(who.id, { accountId: who.accountId, amount: value, description }, {});
  const send = (from: Ctx, to: Ctx, value: string, description: string) =>
    transactions.transfer(from.id, { fromAccountId: from.accountId, toIban: to.iban, amount: value, description }, {});

  for (let m = 5; m >= 0; m--) {
    console.log(m === 0 ? "This month" : `${m} month${m > 1 ? "s" : ""} ago`);

    if (m === 5) {
      for (const person of PEOPLE) {
        const result = await auth.register(
          { email: person.email, password: PASSWORD, fullName: person.name, monthlyIncome: person.income },
          {},
        );
        const [account] = await accounts.list(result.user.id);
        ctx.set(person.key, { id: result.user.id, accountId: account.id, iban: account.iban });
      }
      const amel = ctx.get("amel")!;
      const youssef = ctx.get("youssef")!;
      const karim = ctx.get("karim")!;
      amel.cardId = (await cards.issue(amel.id, { accountId: amel.accountId, spendingLimit: "1500" })).id;
      youssef.cardId = (await cards.issue(youssef.id, { accountId: youssef.accountId, spendingLimit: "600" })).id;
      karim.cardId = (await cards.issue(karim.id, { accountId: karim.accountId, spendingLimit: "300" })).id;
    }

    if (m === 4) {
      const amel = ctx.get("amel")!;
      const savings = await accounts.open(amel.id, { type: "SAVINGS", label: "Holiday fund" });
      amel.savingsId = savings.id;
    }

    // Salaries, rent, and everyday spending
    for (const person of PEOPLE) {
      const who = ctx.get(person.key)!;
      await deposit(who, person.income, "Salary");
      await withdraw(who, person.rent, "Rent");
      await withdraw(who, person.living, "Groceries and bills");
      if (who.cardId) {
        const count = 3 + Math.floor(rand() * 3);
        for (let i = 0; i < count; i++) {
          const merchant = MERCHANTS[Math.floor(rand() * MERCHANTS.length)];
          await cards.pay(who.id, who.cardId, { merchant, amount: amount(8, 70) }, undefined);
        }
      }
    }

    const amel = ctx.get("amel")!;
    const youssef = ctx.get("youssef")!;
    const salma = ctx.get("salma")!;
    const karim = ctx.get("karim")!;
    if (m <= 4) {
      await send(amel, youssef, amount(40, 140), "Dinner");
      await send(salma, amel, amount(150, 320), "Shared trip");
      await send(karim, youssef, amount(30, 80), "Football night");
      if (amel.savingsId) {
        const savings = (await accounts.list(amel.id)).find((a) => a.id === amel.savingsId)!;
        await transactions.transfer(
          amel.id,
          { fromAccountId: amel.accountId, toIban: savings.iban, amount: "400", description: "Saving for the holidays" },
          {},
        );
      }
    }

    // Loans: one running, one flagged, one declined, two waiting
    if (m === 3) {
      const loan = await loans.apply(amel.id, {
        productId: product("Personal loan"),
        accountId: amel.accountId,
        amount: "8000",
        months: 24,
        purpose: "Home renovation",
      });
      await review.approve(admin.id, loan.id, {});
      loanIds.amel = loan.id;
      await withdraw(amel, "6500", "Contractor payment, renovation");
    }
    if (m <= 2 && m >= 0 && loanIds.amel) {
      await loans.repay(amel.id, loanIds.amel, {});
    }
    if (m === 1) {
      await loans.apply(youssef.id, {
        productId: product("Personal loan"),
        accountId: youssef.accountId,
        amount: "20000",
        months: 24,
        purpose: "Used car",
      });
      const declined = await loans.apply(salma.id, {
        productId: product("Student loan"),
        accountId: salma.accountId,
        amount: "5000",
        months: 24,
        purpose: "Master's tuition",
      });
      await review.reject(admin.id, declined.id, { reason: "Please provide proof of enrolment and apply again." });
    }
    if (m === 0) {
      await loans.apply(amel.id, {
        productId: product("Student loan"),
        accountId: amel.accountId,
        amount: "3000",
        months: 12,
        purpose: "Course for my sister",
      });
      await loans.apply(salma.id, {
        productId: product("Home loan"),
        accountId: salma.accountId,
        amount: "120000",
        months: 180,
        purpose: "First apartment",
      });
      await cards.update(karim.id, karim.cardId!, { status: "FROZEN" });

      // A customer who joined this month
      const nour = await auth.register(
        { email: "nour@demo.tn", password: PASSWORD, fullName: "Nour Hamdi", monthlyIncome: "1500" },
        {},
      );
      const [nourAccount] = await accounts.list(nour.user.id);
      const nourCtx: Ctx = { id: nour.user.id, accountId: nourAccount.id, iban: nourAccount.iban };
      await deposit(nourCtx, "1500", "First salary");
      await withdraw(nourCtx, "480", "Rent");
      await send(amel, nourCtx, "35", "Welcome gift");
    }

    if (m > 0) for (const sql of AGE_SQL) await prisma.$executeRawUnsafe(sql);
  }

  // The current month happened "all at once". Spread it, in the same order, from the 1st until now,
  // so the 14-day chart, the recent activity and the notifications look like a real month.
  for (const [table, column] of SPREAD) {
    await prisma.$executeRawUnsafe(`
      UPDATE "${table}" t
      SET "${column}" = date_trunc('month', now()) + (r.rn::float8 / r.cnt) * (now() - interval '1 minute' - date_trunc('month', now()))
      FROM (
        SELECT id, row_number() OVER (ORDER BY "${column}", id) AS rn, count(*) OVER () AS cnt
        FROM "${table}" WHERE "${column}" > now() - interval '1 hour'
      ) r
      WHERE t.id = r.id`);
  }

  // Sessions of the build are not needed, and their dates were moved around.
  await prisma.refreshSession.deleteMany({ where: { user: { email: { endsWith: "@demo.tn" } } } });

  const total = await prisma.account.aggregate({ _sum: { balance: true } });
  if (!total._sum.balance?.isZero()) throw new Error("Ledger is not balanced after the demo build. Aborting.");

  console.log("\nDemo data ready. Ledger balanced.");
  console.log(`Customers (password: ${PASSWORD}):`);
  for (const person of PEOPLE) console.log(`  ${person.email}   ${person.name}`);
  console.log("  nour@demo.tn   Nour Hamdi   (joined this month)");
  await app.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});