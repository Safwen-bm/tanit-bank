import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import * as argon2 from "argon2";
import { buildTnIban } from "../src/common/iban";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  }),
});

async function main() {
  // 1. The first admin. There is no admin registration in the UI.
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in apps/api/.env before seeding");
  }
  if (password.length < 10) throw new Error("ADMIN_PASSWORD must have at least 10 characters");

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash: await argon2.hash(password, { type: argon2.argon2id }),
      fullName: process.env.ADMIN_NAME?.trim() || "Bank Administrator",
      role: "ADMIN",
    },
  });
  console.log(`Admin ready: ${admin.email}`);

  // 2. The internal treasury account: counterparty of every cash movement.
  const treasury =
    (await prisma.account.findFirst({ where: { type: "TREASURY" } })) ??
    (await prisma.account.create({
      data: {
        type: "TREASURY",
        iban: buildTnIban("0000000000001"),
        label: "Bank treasury",
      },
    }));
  console.log(`Treasury ready: ${treasury.iban}`);

  // 3. Demo loan products, only on an empty table (the admin owns them afterwards).
  if ((await prisma.loanProduct.count()) === 0) {
    await prisma.loanProduct.createMany({
      data: [
        {
          name: "Personal loan",
          description: "Flexible cash for projects, travel or unexpected costs.",
          annualRate: "9.5",
          minAmount: "1000",
          maxAmount: "50000",
          minMonths: 6,
          maxMonths: 84,
          maxDebtRatio: "0.4",
        },
        {
          name: "Auto loan",
          description: "Finance a new or used vehicle.",
          annualRate: "8.25",
          minAmount: "5000",
          maxAmount: "120000",
          minMonths: 12,
          maxMonths: 84,
          maxDebtRatio: "0.4",
        },
        {
          name: "Home loan",
          description: "Buy, build or renovate your home over the long term.",
          annualRate: "7",
          minAmount: "20000",
          maxAmount: "500000",
          minMonths: 60,
          maxMonths: 300,
          maxDebtRatio: "0.35",
        },
        {
          name: "Student loan",
          description: "Fund your studies at a gentle rate.",
          annualRate: "5.5",
          minAmount: "500",
          maxAmount: "20000",
          minMonths: 12,
          maxMonths: 60,
          maxDebtRatio: "0.3",
        },
      ],
    });
    console.log("Demo loan products created");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());