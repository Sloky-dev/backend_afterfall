import { Router } from "express";
import authRouter from "./auth.route";
import healthRouter from "./health.route";

const router = Router();

router.use("/health", healthRouter);
router.use("/auth", authRouter);

export default router;
