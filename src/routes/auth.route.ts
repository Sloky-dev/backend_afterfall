import bcrypt from "bcryptjs";
import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

const generateDigits = () => Math.floor(Math.random() * 10000)
  .toString()
  .padStart(4, "0");

const generateUniquePseudonym = async (): Promise<string> => {
  const maxAttempts = 50;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const pseudonym = `SURVIVOR${generateDigits()}`;
    const existing = await prisma.user.findUnique({
      where: { pseudonym },
      select: { id: true },
    });

    if (!existing) {
      return pseudonym;
    }
  }

  throw new Error("Failed to generate unique survivor pseudonym");
};

router.post("/register", async (req, res, next) => {
  try {
    const { email, password } = req.body as Partial<{ email: string; password: string; }>;

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
    const pseudonym = await generateUniquePseudonym();
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        pseudonym,
      },
      select: {
        id: true,
        email: true,
        pseudonym: true,
        level: true,
        createdAt: true,
      },
    });

    return res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body as Partial<{ email: string; password: string }>;

    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    return res.json({
      id: user.id,
      email: user.email,
      pseudonym: user.pseudonym,
      level: user.level,
      createdAt: user.createdAt,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
