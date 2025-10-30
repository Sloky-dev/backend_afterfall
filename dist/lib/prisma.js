"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
exports.prisma = new client_1.PrismaClient();
async function enableShutdownHooks() {
    const signals = ["SIGINT", "SIGTERM"];
    for (const signal of signals) {
        process.once(signal, async () => {
            await exports.prisma.$disconnect();
            process.exit(0);
        });
    }
}
void enableShutdownHooks();
