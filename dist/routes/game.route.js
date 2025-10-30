"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const repo = __importStar(require("../realtime/game.repo"));
const router = (0, express_1.Router)();
// Naive admin check using user id from header for now
const requireAdmin = async (req, res, next) => {
    try {
        const userId = (req.headers["x-user-id"] || req.body?.userId);
        if (!userId)
            return res.status(401).json({ message: "Missing user" });
        const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role !== "ADMIN")
            return res.status(403).json({ message: "Forbidden" });
        req.user = user;
        next();
    }
    catch (e) {
        next(e);
    }
};
router.post("/create", requireAdmin, async (req, res, next) => {
    try {
        const adminId = req.user.id;
        const game = await repo.createGame(adminId);
        return res.status(201).json({ id: game.id, createdAt: game.createdAt.getTime() });
    }
    catch (e) {
        next(e);
    }
});
router.get("/list", async (_req, res, next) => {
    try {
        const list = await repo.listGames();
        return res.json(list);
    }
    catch (e) {
        next(e);
    }
});
router.post("/:gameId/join", async (req, res, next) => {
    try {
        const { gameId } = req.params;
        const { userId } = req.body;
        if (!gameId)
            return res.status(400).json({ message: "gameId required" });
        if (!userId)
            return res.status(400).json({ message: "userId required" });
        const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            return res.status(404).json({ message: "User not found" });
        const game = await prisma_1.prisma.gameSession.findUnique({ where: { id: gameId } });
        if (!game)
            return res.status(404).json({ message: "Game not found" });
        const session = await repo.joinGame(gameId, user.id, user.pseudonym);
        const state = await repo.getClientState(gameId);
        return res.json({
            player: { id: session.id, token: session.token, pseudonym: session.pseudonym },
            state,
        });
    }
    catch (e) {
        next(e);
    }
});
router.post("/:gameId/rejoin", async (req, res, next) => {
    try {
        const { gameId } = req.params;
        const { playerId, token } = req.body;
        if (!gameId || !playerId || !token)
            return res.status(400).json({ message: "Missing params" });
        const session = await repo.reconnect(gameId, playerId, token);
        if (!session)
            return res.status(401).json({ message: "Invalid session" });
        const state = await repo.getClientState(gameId);
        return res.json({ state });
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
