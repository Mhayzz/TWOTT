# TWOTT — The Wolves Of The Trinity Bot

Bot Discord pour la guilde **The Wolves Of The Trinity** sur le serveur Minecraft **SAO Chronicles** (`play.saochronicles.fr`, version 1.21.11).

## Fonctionnalités v1

- **/inscription** — rejoindre la guilde (pseudo MC, classe). Auto-attribution de rôles si configuré.
- **/profil [@membre]** — fiche d'un membre (rang, classe, raids effectués).
- **/raid create | list | cancel** — planification de raids avec inscriptions par boutons (✅ / ❔ / ❌) et rappel automatique.
- **/status show | setchannel** — statut live du serveur Minecraft, mis à jour automatiquement dans un salon dédié.

## Stack

- Node.js 20+ • discord.js v14 • Prisma + PostgreSQL • node-cron • minecraft-server-util

## Setup local

```bash
npm install
cp .env.example .env
# Remplir DISCORD_TOKEN, CLIENT_ID, GUILD_ID, DATABASE_URL
npm run db:migrate
npm run deploy:commands
npm start
```

## Déploiement Railway

1. Créer un nouveau projet Railway, connecter ce repo.
2. Ajouter le plugin **PostgreSQL** → la variable `DATABASE_URL` est injectée automatiquement.
3. Définir les variables d'environnement (cf. `.env.example`) :
   - `DISCORD_TOKEN` (Developer Portal → Bot → Token)
   - `CLIENT_ID` (Developer Portal → General Information → Application ID)
   - `GUILD_ID` (clic droit sur le serveur Discord avec le mode dev activé)
   - `MC_SERVER_HOST=play.saochronicles.fr`
   - `MC_SERVER_PORT=25565`
   - `STATUS_UPDATE_INTERVAL_MINUTES=5`
   - `RAID_REMINDER_LEAD_MINUTES=30`
4. Le `startCommand` (cf. `railway.json`) applique les migrations Prisma, redéploie les slash commands et lance le bot.

## Permissions Discord requises

Lors de l'invitation du bot, scopes : `bot` + `applications.commands`.
Permissions minimales : *View Channels*, *Send Messages*, *Embed Links*, *Read Message History*, *Manage Roles* (pour l'auto-attribution), *Use Application Commands*.

URL d'invitation type :
```
https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=268520512&scope=bot%20applications.commands
```

## Configuration en jeu

1. **Statut serveur** : dans Discord, tape `/status setchannel salon:#statut-serveur` (réservé à *Gérer le serveur*).
2. **Auto-rôles** (classe / rang) : pour l'instant les mappings se définissent en base via `GuildConfig.classRoleMap` et `rankRoleMap`. Une commande d'admin sera ajoutée plus tard.

## Roadmap (v2)

- Commandes admin pour configurer les rôles classe/rang sans toucher la DB.
- Wiki interne (mobs, items, étages) une fois la doc SAO Chronicles dispo.
- Économie / shop tracker.
- Sync chat Discord ↔ Minecraft (si le serveur expose un plugin compatible).
