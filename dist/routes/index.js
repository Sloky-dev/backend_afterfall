"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_route_1 = __importDefault(require("./auth.route"));
const health_route_1 = __importDefault(require("./health.route"));
const users_route_1 = __importDefault(require("./users.route"));
const game_route_1 = __importDefault(require("./game.route"));
const router = (0, express_1.Router)();
router.use("/health", health_route_1.default);
router.use("/auth", auth_route_1.default);
router.use("/users", users_route_1.default);
router.use("/game", game_route_1.default);
exports.default = router;
