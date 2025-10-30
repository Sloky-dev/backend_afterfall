import "dotenv/config";
import { app } from "./app";
import { createServer } from "http";
import { initRealtime } from "./realtime";

const port = Number(process.env.PORT) || 5000;
const server = createServer(app);

initRealtime(server);

server.listen(port, () => {
  console.log(`[api] Server listening on http://localhost:${port}`);
});
