import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import * as repo from "./game.repo";

export interface SocketAuth {
  gameId: string;
  playerId: string;
  token: string;
}

export const initRealtime = (server: HttpServer) => {
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    socket.on("game:join", async (auth: SocketAuth) => {
      const { gameId, playerId, token } = auth || {} as SocketAuth;
      const session = await repo.reconnect(gameId, playerId, token);
      if (!session) {
        socket.emit("error", { message: "Invalid session" });
        return;
      }
      socket.join(gameId);
      const state = await repo.getClientState(gameId);
      if (state) io.to(gameId).emit("game:state", state);

      socket.on("disconnect", async () => {
        await repo.markDisconnected(gameId, playerId);
        const s2 = await repo.getClientState(gameId);
        if (s2) io.to(gameId).emit("game:state", s2);
      });
    });
  });

  return io;
};
