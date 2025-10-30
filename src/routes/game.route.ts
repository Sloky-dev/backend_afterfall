import { Router } from "express";
import { prisma } from "../lib/prisma";
import * as repo from "../realtime/game.repo";

const router = Router();

// Naive admin check using user id from header for now
const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const userId = (req.headers["x-user-id"] || req.body?.userId) as string | undefined;
    if (!userId) return res.status(401).json({ message: "Missing user" });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || (user as any).role !== "ADMIN") return res.status(403).json({ message: "Forbidden" });
    (req as any).user = user;
    next();
  } catch (e) {
    next(e);
  }
};

router.post("/create", requireAdmin, async (req, res, next) => {
  try {
    const adminId = (req as any).user.id as string;
    const game = await repo.createGame(adminId);
    return res.status(201).json({ id: game.id, createdAt: game.createdAt.getTime() });
  } catch (e) {
    next(e);
  }
});

router.get("/list", async (_req, res, next) => {
  try {
    const list = await repo.listGames();
    return res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post("/:gameId/join", async (req, res, next) => {
  try {
    const { gameId } = req.params as { gameId?: string };
    const { userId } = req.body as Partial<{ userId: string }>;
    if (!gameId) return res.status(400).json({ message: "gameId required" });
    if (!userId) return res.status(400).json({ message: "userId required" });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const game = await prisma.gameSession.findUnique({ where: { id: gameId } });
    if (!game) return res.status(404).json({ message: "Game not found" });

    const session = await repo.joinGame(gameId, user.id, user.pseudonym);
    const state = await repo.getClientState(gameId);
    return res.json({
      player: { id: session.id, token: session.token, pseudonym: session.pseudonym },
      state,
    });
  } catch (e) {
    next(e);
  }
});

router.post("/:gameId/rejoin", async (req, res, next) => {
  try {
    const { gameId } = req.params as { gameId?: string };
    const { playerId, token } = req.body as Partial<{ playerId: string; token: string }>;
    if (!gameId || !playerId || !token) return res.status(400).json({ message: "Missing params" });
    const session = await repo.reconnect(gameId, playerId, token);
    if (!session) return res.status(401).json({ message: "Invalid session" });
    const state = await repo.getClientState(gameId);
    return res.json({ state });
  } catch (e) {
    next(e);
  }
});

export default router;
