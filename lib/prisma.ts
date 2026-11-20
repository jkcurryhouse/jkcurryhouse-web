// Prisma client — runtime-only singleton.
// Run `npx prisma generate` after cloning before starting the server.

/* eslint-disable */
declare global {
  var _prisma: any | undefined;
}

function getPrismaClient(): any {
  if (global._prisma) return global._prisma;
  const { PrismaClient } = require("@prisma/client");
  global._prisma = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
  return global._prisma;
}

const prisma = new Proxy({} as any, {
  get(_target: any, prop: string) {
    return getPrismaClient()[prop];
  },
});

export default prisma;
/* eslint-enable */
