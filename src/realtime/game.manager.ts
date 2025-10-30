import { randomUUID } from "crypto";
import { ClientGameState, GameId, GameState, PlayerId, PlayerSession } from "./game.types";

export class GameManager {
  private games = new Map<GameId, GameState>();

  createGame(createdBy: string): GameState {
    const id = randomUUID();
    const game: GameState = {
      id,
      createdBy,
      createdAt: Date.now(),
      players: {},
    };
    this.games.set(id, game);
    return game;
  }

  getGame(id: GameId): GameState | undefined {
    return this.games.get(id);
  }

  list(): ClientGameState[] {
    return Array.from(this.games.values()).map((g) => this.toClientState(g));
  }

  toClientState(game: GameState): ClientGameState {
    return {
      id: game.id,
      players: Object.values(game.players).map((p) => ({
        id: p.id,
        pseudonym: p.pseudonym,
        connected: p.connected,
      })),
    };
  }

  joinGame(gameId: GameId, userId: string, pseudonym: string): PlayerSession | undefined {
    const game = this.games.get(gameId);
    if (!game) return undefined;
    // Reuse existing session for this user if present
    const existing = Object.values(game.players).find((p) => p.userId === userId);
    if (existing) {
      existing.connected = true;
      existing.lastSeenAt = Date.now();
      return existing;
    }

    const id: PlayerId = randomUUID();
    const token = randomUUID();
    const session: PlayerSession = {
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

  reconnect(gameId: GameId, playerId: PlayerId, token: string): PlayerSession | undefined {
    const game = this.games.get(gameId);
    if (!game) return undefined;
    const session = game.players[playerId];
    if (!session) return undefined;
    if (session.token !== token) return undefined;
    session.connected = true;
    session.lastSeenAt = Date.now();
    return session;
  }

  markDisconnected(gameId: GameId, playerId: PlayerId) {
    const game = this.games.get(gameId);
    if (!game) return;
    const session = game.players[playerId];
    if (!session) return;
    session.connected = false;
    session.lastSeenAt = Date.now();
  }
}

export const gameManager = new GameManager();

