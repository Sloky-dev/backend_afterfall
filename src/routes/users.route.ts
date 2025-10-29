import bcrypt from "bcryptjs";
import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

router.patch("/:id", async (req, res, next) => {
  try {
    const { id } = req.params as { id?: string };
    const { email, currentPassword } = req.body as Partial<{ email: string; currentPassword: string }>;

    if (!id) {
      return res.status(400).json({ message: "User id is required" });
    }

    if (!email || typeof email !== "string") {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!currentPassword || typeof currentPassword !== "string") {
      return res.status(400).json({ message: "Le mot de passe actuel est requis pour modifier l'adresse e-mail." });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const matches = await bcrypt.compare(currentPassword, user.password);
    if (!matches) {
      return res.status(401).json({ message: "Mot de passe actuel incorrect." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail !== user.email) {
      const conflict = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (conflict) {
        return res.status(409).json({ message: "Cette adresse e-mail est deja utilisee." });
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { email: normalizedEmail },
      select: { id: true, email: true, pseudonym: true, level: true, createdAt: true },
    });

    return res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/password", async (req, res, next) => {
  try {
    const { id } = req.params as { id?: string };
    const { currentPassword, newPassword } = req.body as Partial<{ currentPassword: string; newPassword: string }>;

    if (!id) {
      return res.status(400).json({ message: "User id is required" });
    }

    if (
      !currentPassword ||
      typeof currentPassword !== "string" ||
      !newPassword ||
      typeof newPassword !== "string"
    ) {
      return res.status(400).json({ message: "Les champs mot de passe sont obligatoires." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Le nouveau mot de passe doit contenir au moins 6 caracteres." });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const matches = await bcrypt.compare(currentPassword, user.password);
    if (!matches) {
      return res.status(401).json({ message: "Mot de passe actuel incorrect." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
