"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const routes_1 = __importDefault(require("./routes"));
exports.app = (0, express_1.default)();
exports.app.use((0, cors_1.default)());
exports.app.use(express_1.default.json());
exports.app.use("/api", routes_1.default);
exports.app.get("/", (_req, res) => {
    res.json({ name: "afterfall-api", status: "running" });
});
exports.app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});
// Basic error translator so unexpected errors are still JSON
exports.app.use((error, _req, res, _next) => {
    const message = error instanceof Error ? error.message : "Unexpected error";
    console.error("[api] unhandled error", error);
    res.status(500).json({ message });
});
