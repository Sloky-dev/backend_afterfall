"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
const NINETY_DAYS_IN_MS = 90 * 24 * 60 * 60 * 1000;
const SUPPORTED_LOCALES = ["fr", "en"];
const sanitizeLocale = (raw) => {
    if (typeof raw !== "string") {
        return null;
    }
    const normalized = raw.trim().toLowerCase();
    return SUPPORTED_LOCALES.includes(normalized)
        ? normalized
        : null;
};
router.patch("/:id", async (req, res, next) => {
    try {
        const { id } = req.params;
        const { email, currentPassword } = req.body;
        if (!id) {
            return res.status(400).json({ message: "User id is required" });
        }
        if (!email || typeof email !== "string") {
            return res.status(400).json({ message: "Email is required" });
        }
        if (!currentPassword || typeof currentPassword !== "string") {
            return res.status(400).json({ message: "Le mot de passe actuel est requis pour modifier l'adresse e-mail." });
        }
        const user = await prisma_1.prisma.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const matches = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!matches) {
            return res.status(401).json({ message: "Mot de passe actuel incorrect." });
        }
        const normalizedEmail = email.trim().toLowerCase();
        if (normalizedEmail !== user.email) {
            const conflict = await prisma_1.prisma.user.findUnique({ where: { email: normalizedEmail } });
            if (conflict) {
                return res.status(409).json({ message: "Cette adresse e-mail est deja utilisee." });
            }
        }
        const updated = await prisma_1.prisma.user.update({
            where: { id },
            data: { email: normalizedEmail },
            select: {
                id: true,
                email: true,
                pseudonym: true,
                pseudonymUpdatedAt: true,
                level: true,
                createdAt: true,
                locale: true,
                role: true,
            },
        });
        return res.json(updated);
    }
    catch (error) {
        next(error);
    }
});
router.post("/:id/password", async (req, res, next) => {
    try {
        const { id } = req.params;
        const { currentPassword, newPassword } = req.body;
        if (!id) {
            return res.status(400).json({ message: "User id is required" });
        }
        if (!currentPassword ||
            typeof currentPassword !== "string" ||
            !newPassword ||
            typeof newPassword !== "string") {
            return res.status(400).json({ message: "Les champs mot de passe sont obligatoires." });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: "Le nouveau mot de passe doit contenir au moins 6 caracteres." });
        }
        const user = await prisma_1.prisma.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const matches = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!matches) {
            return res.status(401).json({ message: "Mot de passe actuel incorrect." });
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        await prisma_1.prisma.user.update({
            where: { id },
            data: { password: hashedPassword },
        });
        return res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
router.patch("/:id/pseudonym", async (req, res, next) => {
    try {
        const { id } = req.params;
        const { pseudonym } = req.body;
        if (!id) {
            return res.status(400).json({ message: "User id is required" });
        }
        if (!pseudonym || typeof pseudonym !== "string") {
            return res.status(400).json({ message: "Le nouveau pseudonyme est requis." });
        }
        const normalized = pseudonym.trim();
        if (normalized.length < 3 || normalized.length > 24) {
            return res.status(400).json({ message: "Le pseudonyme doit contenir entre 3 et 24 caracteres." });
        }
        if (/[^a-zA-Z0-9 _-]/.test(normalized)) {
            return res.status(400).json({ message: "Le pseudonyme ne peut contenir que des lettres, chiffres, espaces, tirets et underscores." });
        }
        const user = await prisma_1.prisma.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (normalized === user.pseudonym) {
            return res.json({
                id: user.id,
                email: user.email,
                pseudonym: user.pseudonym,
                pseudonymUpdatedAt: user.pseudonymUpdatedAt,
                level: user.level,
                createdAt: user.createdAt,
                locale: user.locale,
                role: user.role,
            });
        }
        if (user.pseudonymUpdatedAt) {
            const nextAllowedAt = new Date(user.pseudonymUpdatedAt.getTime() + NINETY_DAYS_IN_MS);
            const now = new Date();
            if (nextAllowedAt > now) {
                return res.status(403).json({
                    message: "Votre pseudonyme ne peut etre modifie qu'une fois tous les 90 jours.",
                    nextAllowedAt: nextAllowedAt.toISOString(),
                });
            }
        }
        const conflict = await prisma_1.prisma.user.findUnique({
            where: { pseudonym: normalized },
            select: { id: true },
        });
        if (conflict && conflict.id !== user.id) {
            return res.status(409).json({ message: "Ce pseudonyme est deja utilise." });
        }
        const now = new Date();
        const updated = await prisma_1.prisma.user.update({
            where: { id },
            data: {
                pseudonym: normalized,
                pseudonymUpdatedAt: now,
            },
            select: {
                id: true,
                email: true,
                pseudonym: true,
                pseudonymUpdatedAt: true,
                level: true,
                createdAt: true,
                locale: true,
                role: true,
            },
        });
        return res.json(updated);
    }
    catch (error) {
        next(error);
    }
});
router.patch("/:id/locale", async (req, res, next) => {
    try {
        const { id } = req.params;
        const { locale } = req.body;
        if (!id) {
            return res.status(400).json({ message: "User id is required" });
        }
        const sanitized = sanitizeLocale(locale);
        if (!sanitized) {
            return res.status(400).json({ message: "Locale non prise en charge." });
        }
        const user = await prisma_1.prisma.user.update({
            where: { id },
            data: { locale: sanitized },
            select: {
                id: true,
                email: true,
                pseudonym: true,
                pseudonymUpdatedAt: true,
                level: true,
                createdAt: true,
                locale: true,
                role: true,
            },
        });
        return res.json(user);
    }
    catch (error) {
        if (error instanceof Error && "code" in error && error.code === "P2025") {
            return res.status(404).json({ message: "User not found" });
        }
        next(error);
    }
});
exports.default = router;
