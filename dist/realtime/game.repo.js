"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGame = createGame;
exports.listGames = listGames;
exports.joinGame = joinGame;
exports.reconnect = reconnect;
exports.markDisconnected = markDisconnected;
exports.getClientState = getClientState;
const prisma_1 = require("../lib/prisma");
const crypto_1 = require("crypto");
async function createGame(createdBy) {
    const game = await prisma_1.prisma.gameSession.create({
        data: { createdBy },
        select: { id: true, createdAt: true },
    });
    return game;
}
async function listGames() {
    const games = await prisma_1.prisma.gameSession.findMany({
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            players: { select: { id: true, pseudonym: true, connected: true } },
        },
    });
    return games.map((g) => ({ id: g.id, players: g.players }));
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
        select: { id: true, players: { select: { id: true, pseudonym: true, connected: true } } },
    });
    return game ? { id: game.id, players: game.players } : null;
}
