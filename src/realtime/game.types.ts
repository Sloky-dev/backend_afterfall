export type PlayerId = string;
export type GameId = string;

export interface PlayerSession {
  id: PlayerId;
  userId: string; // from DB
  pseudonym: string;
  connected: boolean;
  lastSeenAt: number;
  // simple session token to allow rejoin without full auth for now
  token: string;
}

export interface GameState {
  id: GameId;
  createdBy: string; // admin user id
  createdAt: number;
  players: Record<PlayerId, PlayerSession>;
}

export interface ClientGameState {
  id: GameId;
  players: Array<Pick<PlayerSession, "id" | "pseudonym" | "connected">>;
}

