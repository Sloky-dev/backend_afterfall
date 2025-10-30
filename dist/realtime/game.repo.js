"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGame = createGame;
exports.listGames = listGames;
exports.joinGame = joinGame;
exports.reconnect = reconnect;
exports.markDisconnected = markDisconnected;
exports.getClientState = getClientState;
exports.deleteGame = deleteGame;
const prisma_1 = require("../lib/prisma");
const crypto_1 = require("crypto");
const map_generator_1 = require("./map.generator");
async function createGame(createdBy) {
    const map = (0, map_generator_1.generateGameMap)();
    const game = await prisma_1.prisma.gameSession.create({
        // Cast to any to avoid prisma type mismatch before generate
        data: { createdBy, map },
        select: { id: true, createdAt: true },
    });
    return game;
}
async function listGames() {
    const games = await prisma_1.prisma.gameSession.findMany({
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            createdAt: true,
            players: { select: { id: true, pseudonym: true, connected: true } },
        },
    });
    return games.map((g) => ({ id: g.id, createdAt: g.createdAt.getTime(), players: g.players }));
}
async function joinGame(gameId, userId, pseudonym) {
    // Reuse existing session if any for this game/user
    const existing = await prisma_1.prisma.playerSession.findFirst({ where: { gameId, userId } });
    if (existing) {
        const updated = await prisma_1.prisma.playerSession.update({
            where: { id: existing.id },
            data: { connected: true, lastSeenAt: new Date() },
            select: { id: true, token: true, pseudonym: true },
        });
        return updated;
    }
    const token = (0, crypto_1.randomUUID)();
    const created = await prisma_1.prisma.playerSession.create({
        data: { gameId, userId, pseudonym, token },
        select: { id: true, token: true, pseudonym: true },
    });
    return created;
}
async function reconnect(gameId, playerId, token) {
    const session = await prisma_1.prisma.playerSession.findFirst({ where: { id: playerId, gameId, token } });
    if (!session)
        return null;
    await prisma_1.prisma.playerSession.update({
        where: { id: session.id },
        data: { connected: true, lastSeenAt: new Date() },
    });
    return session;
}
async function markDisconnected(gameId, playerId) {
    await prisma_1.prisma.playerSession.updateMany({
        where: { id: playerId, gameId },
        data: { connected: false, lastSeenAt: new Date() },
    });
}
async function getClientState(gameId) {
    const game = await prisma_1.prisma.gameSession.findUnique({
        where: { id: gameId },
        // Cast select as any to read map without regenerated client types
        select: { id: true, map: true, players: { select: { id: true, pseudonym: true, connected: true } } },
    });
    return game ? { id: game.id, players: game.players, map: game.map } : null;
}
async function deleteGame(gameId) {
    // Remove related player sessions first, then the game session
    await prisma_1.prisma.playerSession.deleteMany({ where: { gameId } });
    await prisma_1.prisma.gameSession.delete({ where: { id: gameId } });
}
