"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = require("./app");
const http_1 = require("http");
const realtime_1 = require("./realtime");
const port = Number(process.env.PORT) || 5000;
const server = (0, http_1.createServer)(app_1.app);
(0, realtime_1.initRealtime)(server);
server.listen(port, () => {
    console.log(`[api] Server listening on http://localhost:${port}`);
});
