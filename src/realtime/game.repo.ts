import { prisma } from "../lib/prisma";
import { randomUUID } from "crypto";
import { generateGameMap, GameMap } from "./map.generator";

export async function createGame(createdBy: string) {
  const map = generateGameMap();
  const game = await prisma.gameSession.create({
    // Cast to any to avoid prisma type mismatch before generate
    data: { createdBy, map } as any,
    select: { id: true, createdAt: true },
  });
  return game;
}

export async function listGames() {
  const games = await prisma.gameSession.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      players: { select: { id: true, pseudonym: true, connected: true } },
    },
  });
  return games.map((g) => ({ id: g.id, createdAt: g.createdAt.getTime(), players: g.players }));
}

export async function joinGame(gameId: string, userId: string, pseudonym: string) {
  // Reuse existing session if any for this game/user
  const existing = await prisma.playerSession.findFirst({ where: { gameId, userId } });
  if (existing) {
    const updated = await prisma.playerSession.update({
      where: { id: existing.id },
      data: { connected: true, lastSeenAt: new Date() },
      select: { id: true, token: true, pseudonym: true },
    });
    return updated;
  }

  const token = randomUUID();
  const created = await prisma.playerSession.create({
    data: { gameId, userId, pseudonym, token },
    select: { id: true, token: true, pseudonym: true },
  });
  return created;
}

export async function reconnect(gameId: string, playerId: string, token: string) {
  const session = await prisma.playerSession.findFirst({ where: { id: playerId, gameId, token } });
  if (!session) return null;
  await prisma.playerSession.update({
    where: { id: session.id },
    data: { connected: true, lastSeenAt: new Date() },
  });
  return session;
}

export async function markDisconnected(gameId: string, playerId: string) {
  await prisma.playerSession.updateMany({
    where: { id: playerId, gameId },
    data: { connected: false, lastSeenAt: new Date() },
  });
}

export async function getClientState(gameId: string) {
  const game = await prisma.gameSession.findUnique({
    where: { id: gameId },
    // Cast select as any to read map without regenerated client types
    select: { id: true, map: true, players: { select: { id: true, pseudonym: true, connected: true } } } as any,
  }) as any;
  return game ? { id: game.id, players: game.players, map: game.map as GameMap } : null;
}

export async function deleteGame(gameId: string) {
  // Remove related player sessions first, then the game session
  await prisma.playerSession.deleteMany({ where: { gameId } });
  await prisma.gameSession.delete({ where: { id: gameId } });
}
