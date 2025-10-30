"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = require("./app");
const port = Number(process.env.PORT) || 4000;
app_1.app.listen(port, () => {
    console.log(`[api] Server listening on http://localhost:${port}`);
});
