// Wiki TWOTT — Sections.
// Mises à jour incrémentales : dès que de nouvelles infos sont confirmées,
// elles sont ajoutées ici. Le contenu actuel est issu de l'observation
// in-game du métier Forgeron sur SAO Chronicles.

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
        '',
        '**Sections disponibles** (sélectionne dans le menu déroulant ci-dessous) :',
        '🛠️ **Forgeron — Vue d\'ensemble**',
        '🐗 **Set Sanglier** (lvl 2-3)',
        '🐺 **Set Cuir Renforcé** (lvl 5-6)',
        '🌳 **Set Écorcé** (lvl 7-8)',
        '🌑 **Set Ombre** (lvl 10-11)',
        '🪙 **Lingots** — matériaux de base',
        '🔑 **Clés des boss** (Axcerus, Noctanther, Mycofange)',
        '',
        '*Tu repères une info incorrecte ou manquante ? Ping un staff.*',
      ].join('\n'),
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'forgeron',
    label: 'Forgeron — Vue d\'ensemble',
    emoji: '🛠️',
    description: 'Le métier de Forgeron',
    embed: {
      title: '🛠️ Métier : Forgeron',
      description: [
        WIKI_DISCLAIMER,
        '',
        'Le **Forgeron** fabrique armes, armures et lingots à partir de matériaux récoltés sur les mobs et les minerais.',
        '',
        '**Progression** : monte le niveau de Forgeron en craftant. Chaque recette donne de l\'XP de Forgeron (et parfois de Mineur pour les lingots de minerai).',
        '',
        '**Tiers d\'équipement disponibles**',
        '🐗 Sanglier — niveaux 2 à 3',
        '🐺 Cuir Renforcé / Sauvage — niveaux 5 à 6',
        '🌳 Écorcé — niveaux 7 à 8',
        '🌑 Ombre — niveaux 10 à 11',
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
    label: 'Set Sanglier (lvl 2-3)',
    emoji: '🐗',
    description: 'Tier 1 — entrée de gamme',
    embed: {
      title: '🐗 Set Sanglier — Forgeron lvl 2-3',
      description: [
        '**Tier 1** — Le set d\'entrée. Matériaux récoltés sur les sangliers.',
        '',
        '*Format : `Niveau · Temps · Coût · XP` puis ingrédients.*',
      ].join('\n'),
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
    label: 'Set Cuir Renforcé (lvl 5-6)',
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
    label: 'Set Écorcé (lvl 7-8)',
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
    label: 'Set Ombre (lvl 10-11)',
    emoji: '🌑',
    description: 'Tier 4 — haut de gamme',
    embed: {
      title: '🌑 Set Ombre — Forgeron lvl 10-11',
      description: '**Tier 4** — Le set le plus avancé observé. Demande des matériaux de Noctanther et de l\'acier.',
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
    id: 'lingots',
    label: 'Lingots',
    emoji: '🪙',
    description: 'Matériaux de base',
    embed: {
      title: '🪙 Lingots — Matériaux de base',
      description: '**Lingots de base** craftés au Forgeron. Les lingots de minerai (cuivre, zinc, fer) demandent le métier **Mineur** ; ils donnent de l\'XP aux deux métiers.',
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
    label: 'Clés des boss',
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
];

export function findSection(id) {
  return WIKI_SECTIONS.find((s) => s.id === id) ?? null;
}
