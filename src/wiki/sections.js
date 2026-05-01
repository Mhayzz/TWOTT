// Wiki TWOTT — Sections.
// Mises à jour incrémentales : dès que de nouvelles infos sont confirmées,
// elles sont ajoutées ici. Le contenu actuel est issu de l'observation
// in-game des métiers de SAO Chronicles.

export const WIKI_DISCLAIMER =
  '> ⚠️ *Wiki communautaire **The Wolves Of The Trinity** — informations issues de l\'observation in-game et de l\'ancien gitbook. Le serveur évolue, ce wiki sera mis à jour au fil de nos découvertes.*';

export const WIKI_SECTIONS = [
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'accueil',
    label: 'Accueil',
    emoji: '🏠',
    description: 'Présentation du wiki',
    embed: {
      title: '📚 Wiki TWOTT — SAO Chronicles',
      description: [
        WIKI_DISCLAIMER,
        '',
        'Bienvenue sur le wiki de la guilde **The Wolves Of The Trinity**.',
        'Sélectionne une section dans le menu déroulant ci-dessous.',
        '',
        '**🛠️ Métiers**',
        '🔥 Forgeron · 🪓 Bûcheron · 🌾 Farmeur · ⚗️ Alchimiste · ⛏️ Mineur',
        '',
        '**🗡️ Sets Forgeron**',
        '🐗 Sanglier · 🐺 Cuir Renforcé · 🌳 Écorcé · 🌑 Ombre · 🐊 Marécageux',
        '',
        '*Tu repères une info incorrecte ou manquante ? Ping un staff.*',
      ].join('\n'),
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'metiers',
    label: 'Métiers — Vue d\'ensemble',
    emoji: '🛠️',
    description: 'Les 5 métiers du serveur',
    embed: {
      title: '🛠️ Les Métiers de SAO Chronicles',
      description: [
        WIKI_DISCLAIMER,
        '',
        'Cinq métiers permettent de progresser et craft sur le serveur. Ils interagissent entre eux : un Forgeron a souvent besoin d\'un Bûcheron / Farmeur pour ses matériaux.',
      ].join('\n'),
      fields: [
        { name: '🔥 Forgeron', value: 'Armes, armures et lingots. 5 tiers d\'équipement (Sanglier → Marécageux). Clés des boss.' },
        { name: '🪓 Bûcheron', value: 'Planches, bâtons, manches, bûches renforcées et bois visqueux. Outil : Hache.' },
        { name: '🌾 Farmeur', value: 'Cuir renforcé, lien de loup, corde, tissu de l\'ombre, huile d\'ortie, liant naturel. Outil : Houe.' },
        { name: '⚗️ Alchimiste', value: 'Potions de soin et substances spéciales (substance marécageuse). Outil : Cisaille.' },
        { name: '⛏️ Mineur', value: 'Extrait minerais (cuivre, zinc, fer) et charbon. Outil : Pioche.' },
        { name: '💡 Outils', value: 'Chaque métier a son **outil de débutant** acheté chez le PNJ correspondant : 200 cor, niveau de coupe/extraction/cueillette = 5, utilisable sur les ressources de niveau 1 à 20.' },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'forgeron',
    label: 'Forgeron — Vue d\'ensemble',
    emoji: '🔥',
    description: 'Le métier de Forgeron',
    embed: {
      title: '🔥 Métier : Forgeron',
      description: [
        WIKI_DISCLAIMER,
        '',
        'Le **Forgeron** fabrique armes, armures et lingots à partir de matériaux récoltés sur les mobs et les minerais.',
        '',
        '**Tiers d\'équipement disponibles**',
        '🐗 Sanglier — niveaux 2 à 3',
        '🐺 Cuir Renforcé / Sauvage — niveaux 5 à 6',
        '🌳 Écorcé — niveaux 7 à 8',
        '🌑 Ombre — niveaux 10 à 11',
        '🐊 Marécageux — niveaux 13 à 14',
        '',
        '**À retenir**',
        '• Chaque craft a un **temps**, un **coût en cor** et une **XP forgeron**.',
        '• Les lingots de cuivre/zinc/fer demandent le métier **Mineur** ; le laiton et l\'acier demandent le **Forgeron**.',
        '• Les **clés des boss d\'étage** (Axcerus, Noctanther, Mycofange) sont craftables au Forgeron.',
      ].join('\n'),
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'set-sanglier',
    label: 'Forgeron — Sanglier (lvl 2-3)',
    emoji: '🐗',
    description: 'Tier 1 — entrée de gamme',
    embed: {
      title: '🐗 Set Sanglier — Forgeron lvl 2-3',
      description: '**Tier 1** — Le set d\'entrée. Matériaux récoltés sur les sangliers.',
      fields: [
        { name: '🪖 Casque en sanglier', value: '`lvl 2 · 15s · 10 cor · +40 xp`\n6 peau de sanglier · 5 fibre végétale · 3 défense de sanglier · 2 lingot de laiton' },
        { name: '🛡️ Plastron en sanglier', value: '`lvl 3 · 15s · 10 cor · +40 xp`\n12 peau de sanglier · 10 fibre végétale · 4 défense de sanglier · 3 lingot de laiton' },
        { name: '👖 Pantalon en sanglier', value: '`lvl 2 · 15s · 10 cor · +40 xp`\n10 peau de sanglier · 9 fibre végétale · 4 défense de sanglier · 3 lingot de laiton' },
        { name: '🥾 Bottes en sanglier', value: '`lvl 2 · 15s · 10 cor · +40 xp`\n6 peau de sanglier · 5 fibre végétale · 2 défense de sanglier · 1 lingot de laiton' },
        { name: '🗡️ Dague en sanglier', value: '`lvl 3 · 30s · 10 cor · +40 xp`\n12 défense de sanglier · 16 fibre végétale · 10 peau de sanglier · 1 manche fragile · 2 lingot de laiton' },
        { name: '⚔️ Épée en sanglier', value: '`lvl 3 · 30s · 10 cor · +40 xp`\n12 défense de sanglier · 16 fibre végétale · 6 peau de sanglier · 1 manche fragile · 2 lingot de laiton' },
        { name: '🪓 Fendoir en sanglier', value: '`lvl 3 · 30s · 10 cor · +40 xp`\n12 défense de sanglier · 16 fibre végétale · 10 peau de sanglier · 1 manche fragile · 2 lingot de laiton' },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'set-cuir',
    label: 'Forgeron — Cuir Renforcé (lvl 5-6)',
    emoji: '🐺',
    description: 'Tier 2',
    embed: {
      title: '🐺 Set Cuir Renforcé / Sauvage — Forgeron lvl 5-6',
      description: '**Tier 2** — Cuir renforcé + matériaux issus des loups (lien de loup) et de plantes (fibre, résine). Les armes prennent le préfixe « sauvage ».',
      fields: [
        { name: '🪖 Casque en cuir renforcé', value: '`lvl 5 · 25s · 20 cor · +80 xp`\n8 fibre végétale · 3 lien de loup · 4 résine · 8 cuir renforcé · 2 lingot de laiton' },
        { name: '🛡️ Plastron en cuir renforcé', value: '`lvl 6 · 25s · 20 cor · +80 xp`\n13 fibre végétale · 5 lien de loup · 6 résine · 11 cuir renforcé · 7 lingot de laiton' },
        { name: '👖 Pantalon en cuir renforcé', value: '`lvl 5 · 25s · 20 cor · +80 xp`\n10 fibre végétale · 5 lien de loup · 4 résine · 8 cuir renforcé · 4 lingot de laiton' },
        { name: '🥾 Bottes en cuir renforcé', value: '`lvl 5 · 25s · 20 cor · +80 xp`\n6 fibre végétale · 3 lien de loup · 2 résine · 4 cuir renforcé · 3 lingot de laiton' },
        { name: '🗡️ Rapière sauvage', value: '`lvl 6 · 45s · 20 cor · +80 xp`\n20 fibre végétale · 6 lien de loup · 1 manche fragile · 4 résine · 11 cuir renforcé · 2 lingot de laiton' },
        { name: '⚔️ Lame sauvage', value: '`lvl 6 · 45s · 20 cor · +80 xp`\n20 fibre végétale · 6 lien de loup · 1 manche fragile · 4 résine · 11 cuir renforcé · 2 lingot de laiton' },
        { name: '🗡️ Espadon sauvage', value: '`lvl 6 · 45s · 20 cor · +80 xp`\n20 fibre végétale · 6 lien de loup · 1 manche fragile · 4 résine · 11 cuir renforcé · 2 lingot de laiton' },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'set-ecorce',
    label: 'Forgeron — Écorcé (lvl 7-8)',
    emoji: '🌳',
    description: 'Tier 3',
    embed: {
      title: '🌳 Set Écorcé — Forgeron lvl 7-8',
      description: '**Tier 3** — Équipement à base de bois et d\'écorce vivante.',
      fields: [
        { name: '🪖 Casque écorcé', value: '`lvl 7 · 45s · 60 cor · +175 xp`\n21 écorce vivante · 14 brindilles noueuses · 2 corde · 3 sève solidifiée · 3 bûche renforcée · 1 cœur de bois ancien' },
        { name: '🛡️ Plastron écorcé', value: '`lvl 8 · 45s · 60 cor · +175 xp`\n36 écorce vivante · 24 brindilles noueuses · 5 corde · 7 sève solidifiée · 8 bûche renforcée · 1 cœur de bois ancien' },
        { name: '👖 Pantalon écorcé', value: '`lvl 7 · 45s · 60 cor · +175 xp`\n27 écorce vivante · 19 brindilles noueuses · 4 corde · 5 sève solidifiée · 7 bûche renforcée · 1 cœur de bois ancien' },
        { name: '🥾 Bottes écorcées', value: '`lvl 7 · 45s · 60 cor · +175 xp`\n15 écorce vivante · 10 brindilles noueuses · 2 corde · 2 sève solidifiée · 4 bûche renforcée · 1 cœur de bois ancien' },
        { name: '🗡️ Rapière écorcée', value: '`lvl 8 · 1m · 60 cor · +175 xp`\n32 écorce vivante · 20 brindilles noueuses · 5 corde · 4 résine · 3 sève solidifiée · 3 bûche renforcée · 1 cœur de bois ancien' },
        { name: '⚔️ Épée écorcée', value: '`lvl 8 · 1m · 60 cor · +175 xp`\n32 écorce vivante · 20 brindilles noueuses · 5 corde · 4 résine · 3 sève solidifiée · 3 bûche renforcée · 1 cœur de bois ancien' },
        { name: '🔨 Marteau écorcé', value: '`lvl 8 · 1m · 60 cor · +175 xp`\n32 écorce vivante · 20 brindilles noueuses · 5 corde · 6 résine · 3 sève solidifiée · 3 bûche renforcée · 1 cœur de bois ancien' },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'set-ombre',
    label: 'Forgeron — Ombre (lvl 10-11)',
    emoji: '🌑',
    description: 'Tier 4 — haut de gamme',
    embed: {
      title: '🌑 Set Ombre — Forgeron lvl 10-11',
      description: '**Tier 4** — Set avancé. Demande des matériaux de Noctanther et de l\'acier.',
      fields: [
        { name: '🪖 Casque de l\'ombre', value: '`lvl 10 · 1m · 100 cor · +220 xp`\n12 tissu de l\'ombre · 4 huile d\'ortie · 3 cuir de Noctanther · 5 corde · 4 lingot d\'acier · 1 aile de Noctanther' },
        { name: '🛡️ Plastron de l\'ombre', value: '`lvl 11 · 1m · 100 cor · +280 xp`\n28 tissu de l\'ombre · 8 huile d\'ortie · 6 cuir de Noctanther · 10 corde · 9 lingot d\'acier · 1 aile de Noctanther' },
        { name: '👖 Pantalon de l\'ombre', value: '`lvl 10 · 1m · 100 cor · +250 xp`\n22 tissu de l\'ombre · 6 huile d\'ortie · 4 cuir de Noctanther · 8 corde · 7 lingot d\'acier · 1 aile de Noctanther' },
        { name: '🥾 Bottes de l\'ombre', value: '`lvl 10 · 1m · 100 cor · +200 xp`\n9 tissu de l\'ombre · 3 huile d\'ortie · 2 cuir de Noctanther · 4 corde · 3 lingot d\'acier · 1 aile de Noctanther' },
        { name: '🗡️ Rapière de l\'ombre', value: '`lvl 11 · 1m 30s · 100 cor · +250 xp`\n12 tissu de l\'ombre · 8 huile d\'ortie · 6 cuir de Noctanther · 4 corde · 2 lingot d\'acier · 2 aile de Noctanther' },
        { name: '⚔️ Épée de l\'ombre', value: '`lvl 11 · 1m 30s · 100 cor · +250 xp`\n12 tissu de l\'ombre · 8 huile d\'ortie · 6 cuir de Noctanther · 4 corde · 2 lingot d\'acier · 2 aile de Noctanther' },
        { name: '🔨 Marteau de l\'ombre', value: '`lvl 11 · 1m 30s · 100 cor · +250 xp`\n12 tissu de l\'ombre · 8 huile d\'ortie · 6 cuir de Noctanther · 4 corde · 2 lingot d\'acier · 2 aile de Noctanther' },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'set-marecageux',
    label: 'Forgeron — Marécageux (lvl 13-14)',
    emoji: '🐊',
    description: 'Tier 5 — le plus avancé observé',
    embed: {
      title: '🐊 Set Marécageux — Forgeron lvl 13-14',
      description: '**Tier 5** — Le set le plus avancé observé. Matériaux issus du marécage : crocodiles, bois visqueux, cortinaire et substance marécageuse (Alchimiste).',
      fields: [
        { name: '🪖 Casque marécageux', value: '`lvl 13 · 2m · 100 cor · +340 xp`\n5 substance marécageuse · 8 bois visqueux · 24 écaille de crocodile' },
        { name: '🛡️ Plastron marécageux', value: '`lvl 14 · 2m · 100 cor · +400 xp`\n9 substance marécageuse · 12 bois visqueux · 45 écaille de crocodile · 1 cortinaire' },
        { name: '👖 Pantalon marécageux', value: '`lvl 13 · 2m · 100 cor · +360 xp`\n6 substance marécageuse · 10 bois visqueux · 32 écaille de crocodile' },
        { name: '🥾 Bottes marécageuses', value: '`lvl 13 · 2m · 100 cor · +320 xp`\n3 substance marécageuse · 6 bois visqueux · 13 écaille de crocodile' },
        { name: '🗡️ Dague marécageuse', value: '`lvl 14 · 2m · 100 cor · +380 xp`\n11 substance marécageuse · 10 bois visqueux · 26 écaille de crocodile · 1 cortinaire' },
        { name: '⚔️ Épée marécageuse', value: '`lvl 14 · 2m · 100 cor · +380 xp`\n11 substance marécageuse · 10 bois visqueux · 30 écaille de crocodile · 1 cortinaire' },
        { name: '⚔️ Glaive double marécageux', value: '`lvl 14 · 2m · 100 cor · +380 xp`\n11 substance marécageuse · 10 bois visqueux · 30 écaille de crocodile · 1 cortinaire' },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'lingots',
    label: 'Forgeron — Lingots',
    emoji: '🪙',
    description: 'Matériaux de base',
    embed: {
      title: '🪙 Lingots — Matériaux de base',
      description: '**Lingots de base**. Les lingots de minerai (cuivre, zinc, fer) demandent le métier **Mineur** ; ils donnent de l\'XP aux deux métiers.',
      fields: [
        { name: '🟠 Lingot de cuivre', value: '`Mineur lvl 3 · 4s`\n2 minerai de cuivre · 1 charbon\n→ +6 xp forgeron · +4 xp mineur' },
        { name: '⚪ Lingot de zinc', value: '`Mineur lvl 3 · 4s`\n2 minerai de zinc · 1 charbon\n→ +6 xp forgeron · +4 xp mineur' },
        { name: '🟡 Lingot de laiton', value: '`Forgeron lvl 1 · 4s · 1 cor`\n2 lingot de cuivre · 1 lingot de zinc\n→ +12 xp forgeron' },
        { name: '⚫ Lingot de fer', value: '`Mineur lvl 9 · 4s`\n2 minerai de fer · 1 charbon\n→ +18 xp forgeron · +7 xp mineur' },
        { name: '🔩 Lingot d\'acier', value: '`Forgeron lvl 9 · 7s · 2 cor`\n2 lingot de fer · 1 charbon\n→ +28 xp forgeron' },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'cles-boss',
    label: 'Forgeron — Clés des boss',
    emoji: '🔑',
    description: 'Accès aux boss d\'étage',
    embed: {
      title: '🔑 Clés des Boss',
      description: 'Les **clés** ouvrent l\'accès aux salles de boss. Chaque clé requiert d\'abord son **fragment**.',
      fields: [
        { name: '🟢 Fragment de clé Axcerus', value: '`Forgeron lvl 4 · 20s · 15 cor · +30 xp`\n6 fibre végétale · 10 boule de slime verte · 3 résine · 1 lingot de laiton' },
        { name: '🟢 Clé Axcerus', value: '`Forgeron lvl 4 · 20s · 50 cor · +55 xp`\n8 fibre végétale · 5 boule de slime verte · 1 fragment de clé Axcerus · 3 résine · 1 cuir renforcé · 2 lingot de laiton' },
        { name: '🟣 Fragment de clé Noctanther', value: '`Forgeron lvl 8 · 50s · 25 cor · +50 xp`\n25 boule de slime verte · 2 fibre végétale · 4 résine · 1 lingot d\'acier' },
        { name: '🟣 Clé Noctanther', value: '`Forgeron lvl 8 · 50s · 75 cor · +110 xp`\n12 boule de slime verte · 1 fragment de clé Noctanther · 5 fibre végétale · 4 résine · 5 lingot d\'acier · 3 lingot de laiton' },
        { name: '⚫ Fragment de clé Mycofange', value: '`Forgeron lvl 12 · 1m 40s · 100 cor · +75 xp`\n25 boule de slime noire · 6 fibre végétale · 3 liant naturel · 1 lingot de laiton' },
        { name: '⚫ Clé Mycofange', value: '`Forgeron lvl 12 · 1m 40s · 225 cor · +160 xp`\n12 boule de slime noire · 1 fragment de clé Mycofange · 2 œil de Lurmor · 2 feuille de Népenthès · 5 corde · 5 liant naturel · 3 lingot d\'acier' },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'bucheron',
    label: 'Bûcheron',
    emoji: '🪓',
    description: 'Bois, planches, manches',
    embed: {
      title: '🪓 Métier : Bûcheron',
      description: [
        WIKI_DISCLAIMER,
        '',
        'Le **Bûcheron** transforme le bois brut en planches, bâtons, manches et bûches renforcées — matériaux essentiels pour le Forgeron.',
        '',
        '**Outil de débutant** : 🪓 Hache du débutant — `200 cor` · COMMUN · efficacité 5 · niveau 1 à 20.',
      ].join('\n'),
      fields: [
        { name: '🪵 Planche de sapin', value: '`lvl 1 · 3s · 2 cor · +3 xp`\n1 bûche de sapin' },
        { name: '🥢 Bâton', value: '`lvl 1 · 3s · 3 cor · +3 xp`\n2 planche de sapin' },
        { name: '🤚 Manche fragile', value: '`lvl 2 · 10s · 5 cor · +10 xp`\n8 bâton · 4 fibre végétale' },
        { name: '🪵 Bûche renforcée', value: '`lvl 6 · 12s · 10 cor · +75 xp`\n5 bûche de sapin · 4 écorce vivante · 5 fibre végétale · 1 sève solidifiée · 1 lingot de laiton' },
        { name: '🟢 Bois visqueux', value: '`lvl 11 · 30s · 25 cor · +140 xp`\n10 boule de slime verte · 6 boule de slime noire · 8 bûche de chêne · 3 liant naturel · 1 lingot d\'acier' },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'farmeur',
    label: 'Farmeur',
    emoji: '🌾',
    description: 'Cuir, corde, tissu, huile',
    embed: {
      title: '🌾 Métier : Farmeur',
      description: [
        WIKI_DISCLAIMER,
        '',
        'Le **Farmeur** assemble les matériaux issus des plantes et du bétail pour produire cuir renforcé, lien de loup, corde, tissu de l\'ombre, huile d\'ortie et liant naturel — la plupart sont indispensables au Forgeron.',
        '',
        '**Outil de débutant** : 🪒 Houe du débutant — `200 cor` · COMMUN · efficacité 5 · niveau 1 à 20.',
      ].join('\n'),
      fields: [
        { name: '🍞 Pain', value: '`lvl 1 · 5s · 1 cor · +8 xp`\n3 blé\n*⚠️ ingrédient à confirmer in-game (le tooltip semble afficher "Pain" plutôt que "Blé")*' },
        { name: '🟫 Cuir renforcé', value: '`lvl 1 · 5s · 3 cor`\n2 peau de sanglier · 2 fibre végétale · 1 peau de loup' },
        { name: '🩹 Lien de loup', value: '`lvl 1 · 5s · 3 cor · +10 xp`\n1 graisse de loup · 2 boule de slime verte' },
        { name: '🪢 Corde', value: '`lvl 5 · 8s · 6 cor · +30 xp`\n5 fibre végétale · 1 résine' },
        { name: '🕸️ Tissu de l\'ombre', value: '`lvl 6 · 6s · 10 cor · +65 xp`\n2 oreille de Velmur · 2 queue de Umbrelion · 1 résine' },
        { name: '🫒 Huile d\'ortie', value: '`lvl 6 · 10s · 10 cor · +70 xp`\n6 orties · 3 graisse de cerf · 3 boule de slime noire · 1 fiole vide' },
        { name: '🟤 Liant naturel', value: '`lvl 9 · 10s · 12 cor · +80 xp`\n2 résine · 1 sève solidifiée' },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'alchimiste',
    label: 'Alchimiste',
    emoji: '⚗️',
    description: 'Potions et substances',
    embed: {
      title: '⚗️ Métier : Alchimiste',
      description: [
        WIKI_DISCLAIMER,
        '',
        'L\'**Alchimiste** prépare potions de soin et substances spéciales utilisées par d\'autres métiers (la substance marécageuse alimente le Forgeron tier 5).',
        '',
        '**Outil de débutant** : ✂️ Cisaille du débutant — `200 cor` · COMMUN · efficacité 5 · niveau 1 à 20.',
      ].join('\n'),
      fields: [
        { name: '❤️ Potion de vie mineure', value: '`lvl 2 · 3s · 1 cor · +3 xp`\n2 orties · 1 fiole vide\n*Restaure 6 HP · 3s de récupération*' },
        { name: '💚 Potion de vie moyenne', value: '`lvl 10 · 5s · 6 cor · +11 xp`\n4 orchidée morelle · 2 boule de slime noire · 1 fiole vide' },
        { name: '🟢 Substance marécageuse', value: '`lvl 7 · 8s · 8 cor · +50 xp`\n3 feuille de Népenthès · 2 œil de Lurmor · 2 résine · 2 patte de Mantarys · 1 queue de Mycofange' },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'mineur',
    label: 'Mineur',
    emoji: '⛏️',
    description: 'Minerais et charbon',
    embed: {
      title: '⛏️ Métier : Mineur',
      description: [
        WIKI_DISCLAIMER,
        '',
        'Le **Mineur** extrait charbon, minerai de cuivre, de zinc et de fer — matières premières des lingots du Forgeron.',
        '',
        '**Outil de débutant** : ⛏️ Pioche du débutant — `200 cor` · COMMUN · efficacité 5 · niveau 1 à 20.',
        '',
        '**Recettes connues** : les fontes de lingots (cuivre, zinc, fer) demandent le **Mineur** mais s\'effectuent à la **Forgeron** — voir la section *Forgeron — Lingots*.',
        '',
        '*Section à étoffer dès qu\'on récupère plus d\'infos sur les recettes / outils du Mineur.*',
      ].join('\n'),
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'outils-debutant',
    label: 'Outils du Débutant',
    emoji: '🛠️',
    description: 'Outils pour démarrer chaque métier',
    embed: {
      title: '🛠️ Outils du Débutant',
      description: [
        'Chaque métier a son **outil de débutant** acheté chez le PNJ correspondant.',
        '',
        '**Caractéristiques communes**',
        '• Niveau métier requis : **1**',
        '• Rareté : **COMMUN**',
        '• Prix : **200 cor**',
        '• Efficacité : **5**',
        '• Utilisable sur ressources niveau **1 à 20**',
      ].join('\n'),
      fields: [
        { name: '🪓 Hache du débutant', value: 'Bûcheron · permet d\'abattre les arbres niveau 1 à 20.' },
        { name: '🪒 Houe du débutant', value: 'Farmeur · permet de faucher les cultures niveau 1 à 20.' },
        { name: '✂️ Cisaille du débutant', value: 'Alchimiste · permet de cueillir les plantes niveau 1 à 20.' },
        { name: '⛏️ Pioche du débutant', value: 'Mineur · permet d\'extraire les minerais niveau 1 à 20.' },
      ],
    },
  },
];

export function findSection(id) {
  return WIKI_SECTIONS.find((s) => s.id === id) ?? null;
}
