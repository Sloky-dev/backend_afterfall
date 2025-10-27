# Afterfall API

Serveur Express + Prisma pour consommer la base PostgreSQL existante `afterfall`.

## Prerequis

- Node.js 18+
- Acces PostgreSQL au schema `afterfall`

## Installation

```bash
npm install
```

## Configuration

Renseigne `DATABASE_URL` dans `.env` avec tes identifiants&nbsp;:

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/afterfall?schema=public"
PORT=4000
```

## Commandes utiles

- `npm run dev` : demarre le serveur en mode developpement (reload automatique).
- `npm run build` puis `npm start` : compile en JavaScript et lance le serveur en production.
- `npm run prisma:pull` : introspecte la base existante pour generer le schema Prisma.
- `npm run prisma:generate` : regenere le client Prisma apres modification du schema.
- `npm run prisma:push` : pousse le schema Prisma vers la base (a utiliser uniquement si tu veux creer/modifier des tables).

## Routes disponibles

- `POST /api/auth/register` : cree un utilisateur avec `email` et `password` (mot de passe >= 6 caracteres).
- `GET /api/health` : verifie la connexion a PostgreSQL (`SELECT 1`).

## Etapes suivantes

1. Executer `npm run prisma:pull` pour recuperer la structure actuelle de la base `afterfall`.
2. Lancer `npx prisma migrate dev --name create-user` (apres avoir arrete le serveur et configure `.env`) afin de creer la table `User`, puis `npm run prisma:generate`.
3. Coder les controlleurs et routes Express correspondant aux tables generees par Prisma.
4. Ajouter des tests ou de l'observabilite selon les besoins.

Le routeur `GET /api/health` verifie la connexion a PostgreSQL (`SELECT 1`). Remplace ce point d'entree une fois les vraies routes metier en place.
