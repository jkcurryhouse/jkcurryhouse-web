// Prisma client singleton (survives Next.js hot reloads in dev).
// Run `npx prisma generate` after cloning / after schema changes.
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { _prisma?: PrismaClient };

const prisma =
  globalForPrisma._prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma._prisma = prisma;

export default prisma;
