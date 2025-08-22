// F2.1 - Données de seed pour 100+ variétés courantes
// Organisé par catégories avec infos techniques complètes

export interface InfosCulture {
  // Plantation
  profondeurPlantationCm: number;
  espacementCm: number;
  expositionSoleil: 'PLEIN_SOLEIL' | 'MI_OMBRE' | 'OMBRE';
  
  // Timing
  joursGermination: number;
  joursRecolte: number;
  dureeRecolte?: number; // semaines
  
  // Conditions
  temperatureMinSemis: number;
  temperatureOptimaleCroissance: [number, number]; // [min, max]
  besoinsEau: 'FAIBLE' | 'MOYEN' | 'ELEVE';
  typesolPrefere: string[];
  phOptimal: [number, number];
  
  // Associations
  plantesCompagnes: string[];
  plantesIncompatibles: string[];
  
  // Difficultés et conseils
  niveauDifficulte: 1 | 2 | 3 | 4 | 5;
  conseilsCulture: string[];
  problemesCourants: string[];
  
  // Production
  rendementMoyenKgM2?: number;
  hauteurMoyenneCm?: number;
  resistanceFroid?: boolean;
  resistanceMaladies?: string[];
}

export const varietesF21Data = [
  // === LÉGUMES - SOLANACÉES ===
  {
    nomScientifique: 'Solanum lycopersicum',
    nomCommun: 'Tomate cerise Rouge',
    famille: 'Solanaceae',
    categorie: 'LEGUME' as const,
    infosCulture: {
      profondeurPlantationCm: 1,
      espacementCm: 50,
      expositionSoleil: 'PLEIN_SOLEIL',
      joursGermination: 8,
      joursRecolte: 75,
      dureeRecolte: 12,
      temperatureMinSemis: 18,
      temperatureOptimaleCroissance: [20, 28],
      besoinsEau: 'MOYEN',
      typesolPrefere: ['limon', 'limon_sable'],
      phOptimal: [6.0, 7.0],
      plantesCompagnes: ['basilic', 'persil', 'œillet d\'Inde'],
      plantesIncompatibles: ['pomme de terre', 'fenouil'],
      niveauDifficulte: 2,
      conseilsCulture: [
        'Tuteurage indispensable',
        'Arroser au pied régulièrement', 
        'Supprimer les gourmands'
      ],
      problemesCourants: ['mildiou', 'blossom end rot', 'cracking'],
      rendementMoyenKgM2: 8,
      hauteurMoyenneCm: 200,
      resistanceFroid: false,
      resistanceMaladies: ['TMV']
    } as InfosCulture,
    calendrierDefaut: {
      moisSemis: [3, 4],
      moisPlantation: [5, 6],
      moisRecolte: [7, 8, 9, 10]
    },
    sourceDonnees: 'MANUEL',
    estPersonnalise: false
  },
  
  {
    nomScientifique: 'Solanum lycopersicum',
    nomCommun: 'Tomate Cœur de Bœuf',
    famille: 'Solanaceae', 
    categorie: 'LEGUME' as const,
    infosCulture: {
      profondeurPlantationCm: 1,
      espacementCm: 60,
      expositionSoleil: 'PLEIN_SOLEIL',
      joursGermination: 8,
      joursRecolte: 85,
      dureeRecolte: 10,
      temperatureMinSemis: 18,
      temperatureOptimaleCroissance: [20, 28],
      besoinsEau: 'ELEVE',
      typesolPrefere: ['limon', 'limon_sable'],
      phOptimal: [6.0, 7.0],
      plantesCompagnes: ['basilic', 'persil', 'œillet d\'Inde'],
      plantesIncompatibles: ['pomme de terre', 'fenouil'],
      niveauDifficulte: 3,
      conseilsCulture: [
        'Tuteurage solide requis',
        'Éclaircissage des fruits nécessaire',
        'Apport compost important'
      ],
      problemesCourants: ['mildiou', 'éclatement', 'nécrose apicale'],
      rendementMoyenKgM2: 6,
      hauteurMoyenneCm: 180,
      resistanceFroid: false,
      resistanceMaladies: []
    } as InfosCulture,
    calendrierDefaut: {
      moisSemis: [3, 4],
      moisPlantation: [5, 6], 
      moisRecolte: [8, 9, 10]
    },
    sourceDonnees: 'MANUEL',
    estPersonnalise: false
  },

  {
    nomScientifique: 'Capsicum annuum',
    nomCommun: 'Poivron Rouge California Wonder',
    famille: 'Solanaceae',
    categorie: 'LEGUME' as const,
    infosCulture: {
      profondeurPlantationCm: 1,
      espacementCm: 40,
      expositionSoleil: 'PLEIN_SOLEIL',
      joursGermination: 10,
      joursRecolte: 80,
      dureeRecolte: 8,
      temperatureMinSemis: 20,
      temperatureOptimaleCroissance: [22, 30],
      besoinsEau: 'MOYEN',
      typesolPrefere: ['limon', 'sable_limon'],
      phOptimal: [6.0, 6.8],
      plantesCompagnes: ['tomate', 'basilic', 'aubergine'],
      plantesIncompatibles: ['haricot', 'bette'],
      niveauDifficulte: 2,
      conseilsCulture: [
        'Besoin de chaleur constante',
        'Tuteurage léger si nécessaire',
        'Récolter vert ou rouge selon préférence'
      ],
      problemesCourants: ['pucerons', 'pourriture du collet'],
      rendementMoyenKgM2: 4,
      hauteurMoyenneCm: 80,
      resistanceFroid: false,
      resistanceMaladies: ['TMV']
    } as InfosCulture,
    calendrierDefaut: {
      moisSemis: [3, 4],
      moisPlantation: [5, 6],
      moisRecolte: [8, 9, 10]
    },
    sourceDonnees: 'MANUEL',
    estPersonnalise: false
  },

  // === LÉGUMES - BRASSICACÉES ===
  {
    nomScientifique: 'Brassica oleracea var. capitata',
    nomCommun: 'Chou Cabus Blanc de Brunswick',
    famille: 'Brassicaceae',
    categorie: 'LEGUME' as const,
    infosCulture: {
      profondeurPlantationCm: 1,
      espacementCm: 50,
      expositionSoleil: 'PLEIN_SOLEIL',
      joursGermination: 7,
      joursRecolte: 100,
      dureeRecolte: 4,
      temperatureMinSemis: 10,
      temperatureOptimaleCroissance: [15, 20],
      besoinsEau: 'ELEVE',
      typesolPrefere: ['limon', 'argile_limon'],
      phOptimal: [6.0, 7.5],
      plantesCompagnes: ['pomme de terre', 'oignon', 'céleri'],
      plantesIncompatibles: ['tomate', 'fraisier'],
      niveauDifficulte: 3,
      conseilsCulture: [
        'Sol riche en matière organique',
        'Arrosage régulier et abondant',
        'Protection contre altises'
      ],
      problemesCourants: ['altises', 'piéride du chou', 'hernie du chou'],
      rendementMoyenKgM2: 3,
      hauteurMoyenneCm: 30,
      resistanceFroid: true,
      resistanceMaladies: []
    } as InfosCulture,
    calendrierDefaut: {
      moisSemis: [3, 4, 7, 8],
      moisPlantation: [5, 6, 9],
      moisRecolte: [7, 8, 11, 12]
    },
    sourceDonnees: 'MANUEL',
    estPersonnalise: false
  },

  {
    nomScientifique: 'Raphanus sativus',
    nomCommun: 'Radis Rose de Pâques',
    famille: 'Brassicaceae',
    categorie: 'LEGUME' as const,
    infosCulture: {
      profondeurPlantationCm: 2,
      espacementCm: 5,
      expositionSoleil: 'MI_OMBRE',
      joursGermination: 4,
      joursRecolte: 25,
      dureeRecolte: 2,
      temperatureMinSemis: 5,
      temperatureOptimaleCroissance: [15, 20],
      besoinsEau: 'MOYEN',
      typesolPrefere: ['sable', 'limon_sable'],
      phOptimal: [6.0, 7.0],
      plantesCompagnes: ['carotte', 'laitue', 'épinard'],
      plantesIncompatibles: ['hysope'],
      niveauDifficulte: 1,
      conseilsCulture: [
        'Semis échelonnés toutes les 2 semaines',
        'Récolte rapide pour éviter le durcissement',
        'Sol meuble et frais'
      ],
      problemesCourants: ['vers du radis', 'montée en graine'],
      rendementMoyenKgM2: 2,
      hauteurMoyenneCm: 15,
      resistanceFroid: true,
      resistanceMaladies: []
    } as InfosCulture,
    calendrierDefaut: {
      moisSemis: [3, 4, 5, 8, 9],
      moisPlantation: [],
      moisRecolte: [4, 5, 6, 9, 10]
    },
    sourceDonnees: 'MANUEL',
    estPersonnalise: false
  },

  // === LÉGUMES - LÉGUMINEUSES ===
  {
    nomScientifique: 'Phaseolus vulgaris',
    nomCommun: 'Haricot Vert Contender',
    famille: 'Fabaceae',
    categorie: 'LEGUME' as const,
    infosCulture: {
      profondeurPlantationCm: 3,
      espacementCm: 40,
      expositionSoleil: 'PLEIN_SOLEIL',
      joursGermination: 8,
      joursRecolte: 60,
      dureeRecolte: 6,
      temperatureMinSemis: 12,
      temperatureOptimaleCroissance: [18, 25],
      besoinsEau: 'MOYEN',
      typesolPrefere: ['limon', 'sable_limon'],
      phOptimal: [6.0, 7.0],
      plantesCompagnes: ['tomate', 'carotte', 'chou'],
      plantesIncompatibles: ['oignon', 'fenouil'],
      niveauDifficulte: 1,
      conseilsCulture: [
        'Semis direct en place',
        'Buttage léger des plants',
        'Récolte régulière pour prolonger production'
      ],
      problemesCourants: ['anthracnose', 'pucerons noirs'],
      rendementMoyenKgM2: 2,
      hauteurMoyenneCm: 50,
      resistanceFroid: false,
      resistanceMaladies: ['mosaïque du haricot']
    } as InfosCulture,
    calendrierDefaut: {
      moisSemis: [5, 6, 7],
      moisPlantation: [],
      moisRecolte: [7, 8, 9]
    },
    sourceDonnees: 'MANUEL',
    estPersonnalise: false
  },

  {
    nomScientifique: 'Pisum sativum',
    nomCommun: 'Petit Pois Kelvedon Wonder',
    famille: 'Fabaceae',
    categorie: 'LEGUME' as const,
    infosCulture: {
      profondeurPlantationCm: 3,
      espacementCm: 5,
      expositionSoleil: 'PLEIN_SOLEIL',
      joursGermination: 10,
      joursRecolte: 70,
      dureeRecolte: 3,
      temperatureMinSemis: 5,
      temperatureOptimaleCroissance: [15, 20],
      besoinsEau: 'MOYEN',
      typesolPrefere: ['limon', 'argile_limon'],
      phOptimal: [6.0, 7.5],
      plantesCompagnes: ['carotte', 'navet', 'chou'],
      plantesIncompatibles: ['ail', 'échalote'],
      niveauDifficulte: 2,
      conseilsCulture: [
        'Tuteurage recommandé',
        'Semis précoce possible sous tunnel',
        'Arrosage modéré mais régulier'
      ],
      problemesCourants: ['mildiou', 'pucerons verts'],
      rendementMoyenKgM2: 1.5,
      hauteurMoyenneCm: 80,
      resistanceFroid: true,
      resistanceMaladies: []
    } as InfosCulture,
    calendrierDefaut: {
      moisSemis: [3, 4, 8, 9],
      moisPlantation: [],
      moisRecolte: [6, 7, 11]
    },
    sourceDonnees: 'MANUEL',
    estPersonnalise: false
  },

  // === LÉGUMES - CUCURBITACÉES ===
  {
    nomScientifique: 'Cucumis sativus',
    nomCommun: 'Concombre Long Anglais',
    famille: 'Cucurbitaceae',
    categorie: 'LEGUME' as const,
    infosCulture: {
      profondeurPlantationCm: 2,
      espacementCm: 100,
      expositionSoleil: 'PLEIN_SOLEIL',
      joursGermination: 6,
      joursRecolte: 60,
      dureeRecolte: 8,
      temperatureMinSemis: 18,
      temperatureOptimaleCroissance: [20, 30],
      besoinsEau: 'ELEVE',
      typesolPrefere: ['limon', 'limon_sable'],
      phOptimal: [6.0, 7.0],
      plantesCompagnes: ['radis', 'laitue', 'haricot'],
      plantesIncompatibles: ['tomate', 'pomme de terre'],
      niveauDifficulte: 2,
      conseilsCulture: [
        'Semis en godets puis repiquage',
        'Palissage vertical recommandé',
        'Arrosage copieux et régulier'
      ],
      problemesCourants: ['oïdium', 'pucerons', 'acariens'],
      rendementMoyenKgM2: 15,
      hauteurMoyenneCm: 200,
      resistanceFroid: false,
      resistanceMaladies: []
    } as InfosCulture,
    calendrierDefaut: {
      moisSemis: [4, 5],
      moisPlantation: [5, 6],
      moisRecolte: [7, 8, 9]
    },
    sourceDonnees: 'MANUEL',
    estPersonnalise: false
  },

  {
    nomScientifique: 'Cucurbita pepo',
    nomCommun: 'Courgette Verte de Milan',
    famille: 'Cucurbitaceae',
    categorie: 'LEGUME' as const,
    infosCulture: {
      profondeurPlantationCm: 3,
      espacementCm: 120,
      expositionSoleil: 'PLEIN_SOLEIL',
      joursGermination: 8,
      joursRecolte: 50,
      dureeRecolte: 12,
      temperatureMinSemis: 15,
      temperatureOptimaleCroissance: [18, 28],
      besoinsEau: 'ELEVE',
      typesolPrefere: ['limon', 'riche_compost'],
      phOptimal: [6.0, 7.0],
      plantesCompagnes: ['haricot', 'maïs', 'radis'],
      plantesIncompatibles: ['pomme de terre'],
      niveauDifficulte: 1,
      conseilsCulture: [
        'Sol très riche en matière organique',
        'Récolte très régulière nécessaire',
        'Paillage recommandé'
      ],
      problemesCourants: ['oïdium', 'pucerons', 'pourriture des fruits'],
      rendementMoyenKgM2: 8,
      hauteurMoyenneCm: 50,
      resistanceFroid: false,
      resistanceMaladies: []
    } as InfosCulture,
    calendrierDefaut: {
      moisSemis: [4, 5, 6],
      moisPlantation: [5, 6],
      moisRecolte: [7, 8, 9, 10]
    },
    sourceDonnees: 'MANUEL',
    estPersonnalise: false
  },

  // === HERBES AROMATIQUES ===
  {
    nomScientifique: 'Ocimum basilicum',
    nomCommun: 'Basilic Grand Vert',
    famille: 'Lamiaceae',
    categorie: 'HERBE_AROMATIQUE' as const,
    infosCulture: {
      profondeurPlantationCm: 0.5,
      espacementCm: 25,
      expositionSoleil: 'PLEIN_SOLEIL',
      joursGermination: 8,
      joursRecolte: 60,
      dureeRecolte: 16,
      temperatureMinSemis: 18,
      temperatureOptimaleCroissance: [20, 28],
      besoinsEau: 'MOYEN',
      typesolPrefere: ['limon', 'sable_limon'],
      phOptimal: [6.0, 7.0],
      plantesCompagnes: ['tomate', 'poivron', 'aubergine'],
      plantesIncompatibles: ['rue'],
      niveauDifficulte: 1,
      conseilsCulture: [
        'Pincer les fleurs régulièrement',
        'Récolte le matin après rosée',
        'Protection contre le froid'
      ],
      problemesCourants: ['fusariose', 'pucerons'],
      rendementMoyenKgM2: 1.5,
      hauteurMoyenneCm: 50,
      resistanceFroid: false,
      resistanceMaladies: []
    } as InfosCulture,
    calendrierDefaut: {
      moisSemis: [4, 5, 6],
      moisPlantation: [5, 6],
      moisRecolte: [6, 7, 8, 9, 10]
    },
    sourceDonnees: 'MANUEL',
    estPersonnalise: false
  },

  {
    nomScientifique: 'Petroselinum crispum',
    nomCommun: 'Persil Frisé Vert Foncé',
    famille: 'Apiaceae',
    categorie: 'HERBE_AROMATIQUE' as const,
    infosCulture: {
      profondeurPlantationCm: 1,
      espacementCm: 20,
      expositionSoleil: 'MI_OMBRE',
      joursGermination: 20,
      joursRecolte: 80,
      dureeRecolte: 20,
      temperatureMinSemis: 8,
      temperatureOptimaleCroissance: [15, 20],
      besoinsEau: 'MOYEN',
      typesolPrefere: ['limon', 'limon_sable'],
      phOptimal: [6.0, 7.0],
      plantesCompagnes: ['tomate', 'carotte', 'radis'],
      plantesIncompatibles: ['laitue'],
      niveauDifficulte: 2,
      conseilsCulture: [
        'Trempage des graines 24h avant semis',
        'Germination lente et irrégulière',
        'Récolte feuille par feuille'
      ],
      problemesCourants: ['fonte des semis', 'limaces'],
      rendementMoyenKgM2: 2,
      hauteurMoyenneCm: 30,
      resistanceFroid: true,
      resistanceMaladies: []
    } as InfosCulture,
    calendrierDefaut: {
      moisSemis: [3, 4, 8, 9],
      moisPlantation: [],
      moisRecolte: [5, 6, 7, 8, 9, 10, 11]
    },
    sourceDonnees: 'MANUEL',
    estPersonnalise: false
  },

  // === LÉGUMES RACINES ===
  {
    nomScientifique: 'Daucus carota',
    nomCommun: 'Carotte de Nantes 2',
    famille: 'Apiaceae',
    categorie: 'LEGUME' as const,
    infosCulture: {
      profondeurPlantationCm: 1,
      espacementCm: 5,
      expositionSoleil: 'PLEIN_SOLEIL',
      joursGermination: 12,
      joursRecolte: 110,
      dureeRecolte: 8,
      temperatureMinSemis: 8,
      temperatureOptimaleCroissance: [15, 22],
      besoinsEau: 'MOYEN',
      typesolPrefere: ['sable', 'limon_sable'],
      phOptimal: [6.0, 7.0],
      plantesCompagnes: ['oignon', 'poireau', 'radis'],
      plantesIncompatibles: ['aneth', 'menthe'],
      niveauDifficulte: 2,
      conseilsCulture: [
        'Sol profond et meuble indispensable',
        'Éclaircissage en plusieurs fois',
        'Éviter le fumier frais'
      ],
      problemesCourants: ['mouche de la carotte', 'alternaria'],
      rendementMoyenKgM2: 4,
      hauteurMoyenneCm: 25,
      resistanceFroid: true,
      resistanceMaladies: []
    } as InfosCulture,
    calendrierDefaut: {
      moisSemis: [3, 4, 5, 6, 7],
      moisPlantation: [],
      moisRecolte: [7, 8, 9, 10, 11]
    },
    sourceDonnees: 'MANUEL',
    estPersonnalise: false
  }

  // Total: 12 variétés de base
  // À étendre avec 88+ variétés supplémentaires pour atteindre 100+
];

export default varietesF21Data;