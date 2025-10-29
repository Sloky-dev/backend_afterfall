import { Router } from "express";
import authRouter from "./auth.route";
import healthRouter from "./health.route";
import usersRouter from "./users.route";

const router = Router();

router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);

export default router;
