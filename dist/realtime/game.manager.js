"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameManager = exports.GameManager = void 0;
const crypto_1 = require("crypto");
class GameManager {
    constructor() {
        this.games = new Map();
    }
    createGame(createdBy) {
        const id = (0, crypto_1.randomUUID)();
        const game = {
            id,
            createdBy,
            createdAt: Date.now(),
            players: {},
        };
        this.games.set(id, game);
        return game;
    }
    getGame(id) {
        return this.games.get(id);
    }
    list() {
        return Array.from(this.games.values()).map((g) => this.toClientState(g));
    }
    toClientState(game) {
        return {
            id: game.id,
            players: Object.values(game.players).map((p) => ({
                id: p.id,
                pseudonym: p.pseudonym,
                connected: p.connected,
            })),
        };
    }
    joinGame(gameId, userId, pseudonym) {
        const game = this.games.get(gameId);
        if (!game)
            return undefined;
        // Reuse existing session for this user if present
        const existing = Object.values(game.players).find((p) => p.userId === userId);
        if (existing) {
            existing.connected = true;
            existing.lastSeenAt = Date.now();
            return existing;
        }
        const id = (0, crypto_1.randomUUID)();
        const token = (0, crypto_1.randomUUID)();
        const session = {
            id,
            userId,
            pseudonym,
            connected: true,
            lastSeenAt: Date.now(),
            token,
        };
        game.players[id] = session;
        return session;
    }
    reconnect(gameId, playerId, token) {
        const game = this.games.get(gameId);
        if (!game)
            return undefined;
        const session = game.players[playerId];
        if (!session)
            return undefined;
        if (session.token !== token)
            return undefined;
        session.connected = true;
        session.lastSeenAt = Date.now();
        return session;
    }
    markDisconnected(gameId, playerId) {
        const game = this.games.get(gameId);
        if (!game)
            return;
        const session = game.players[playerId];
        if (!session)
            return;
        session.connected = false;
        session.lastSeenAt = Date.now();
    }
}
exports.GameManager = GameManager;
exports.gameManager = new GameManager();
