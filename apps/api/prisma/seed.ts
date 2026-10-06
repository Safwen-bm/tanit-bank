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
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());