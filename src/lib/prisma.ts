import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

async function enableShutdownHooks() {
  const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
  for (const signal of signals) {
    process.once(signal, async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  }
}

void enableShutdownHooks();
