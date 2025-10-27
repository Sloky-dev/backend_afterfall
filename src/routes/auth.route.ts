import bcrypt from "bcryptjs";
import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

router.post("/register", async (req, res, next) => {
  try {
    const { email, password } = req.body as Partial<{ email: string; password: string }>;

    if (!email || typeof email !== "string") {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ message: "Password must contain at least 6 characters" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    return res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

export default router;
