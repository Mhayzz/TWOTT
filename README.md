# TWOTT — The Wolves Of The Trinity Bot

Bot Discord minimaliste pour la guilde **The Wolves Of The Trinity** sur **SAO Chronicles** (`play.saochronicles.fr`).

## Ce que fait le bot

- `/setup create` — crée deux salons vocaux verrouillés en haut du serveur :
  - `📡・play.saochronicles.fr` — l'IP du serveur Minecraft (statique)
  - `🟢・X/Y joueurs` — le statut serveur, mis à jour automatiquement (toutes les 5 min)
- `/setup remove` — supprime ces deux salons

Les deux salons sont en lecture seule (`@everyone` ne peut pas s'y connecter).

## Stack

Node.js 20+ • discord.js v14 • Prisma + PostgreSQL • node-cron • minecraft-server-util

## Setup local

```bash
npm install
cp .env.example .env
# Remplir DISCORD_TOKEN, CLIENT_ID, GUILD_ID, DATABASE_URL
npm run db:push
npm run deploy:commands
npm start
```

## Déploiement Railway

1. Nouveau projet Railway → connecter ce repo.
2. Plugin **PostgreSQL** → `DATABASE_URL` injectée auto. Lier la variable `DATABASE_URL` au service du bot.
3. Variables d'environnement :
   - `DISCORD_TOKEN`
   - `CLIENT_ID`
   - `GUILD_ID`
   - `MC_SERVER_HOST=play.saochronicles.fr`
   - `MC_SERVER_PORT=25565`
   - `STATUS_UPDATE_INTERVAL_MINUTES=5` (minimum 5, contrainte Discord)
4. Le `startCommand` exécute auto : `prisma db push` → `deploy-commands` → bot.

## Permissions Discord requises

Lors de l'invitation : `bot` + `applications.commands`.

Permissions :
- **Voir les salons**
- **Gérer les salons** (création / suppression / renommage des vocaux)
- **Se connecter** (au cas où)
- **Utiliser les commandes slash**
