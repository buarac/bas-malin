export const varietesBase = [
  // LÉGUMES - Solanacées
  {
    nomScientifique: 'Solanum lycopersicum',
    nomCommun: 'Tomate cerise',
    famille: 'Solanaceae',
    categorie: 'LEGUME',
    infosCulture: {
      profondeurPlantationCm: 1,
      espacementCm: 50,
      joursGermination: 7,
      joursRecolte: 80,
      plantesCompagnes: ['basilic', 'persil', 'carotte'],
      plantesIncompatibles: ['pomme_de_terre', 'fenouil'],
      temperaturesOptimales: { min: 15, max: 30 },
      besoinsEau: 'moyen',
      exigencesSoleil: 'plein_soleil',
      niveauDifficulte: 2
    },
    calendrierDefaut: {
      moisSemis: [3, 4, 5],
      moisPlantation: [5, 6],
      moisRecolte: [7, 8, 9, 10]
    }
  },
  {
    nomScientifique: 'Solanum lycopersicum',
    nomCommun: 'Tomate grappe',
    famille: 'Solanaceae',
    categorie: 'LEGUME',
    infosCulture: {
      profondeurPlantationCm: 1,
      espacementCm: 60,
      joursGermination: 7,
      joursRecolte: 90,
      plantesCompagnes: ['basilic', 'persil', 'carotte'],
      plantesIncompatibles: ['pomme_de_terre', 'fenouil'],
      temperaturesOptimales: { min: 15, max: 30 },
      besoinsEau: 'moyen',
      exigencesSoleil: 'plein_soleil',
      niveauDifficulte: 3
    },
    calendrierDefaut: {
      moisSemis: [3, 4, 5],
      moisPlantation: [5, 6],
      moisRecolte: [7, 8, 9, 10]
    }
  },
  {
    nomScientifique: 'Capsicum annuum',
    nomCommun: 'Poivron',
    famille: 'Solanaceae',
    categorie: 'LEGUME',
    infosCulture: {
      profondeurPlantationCm: 1,
      espacementCm: 40,
      joursGermination: 10,
      joursRecolte: 100,
      plantesCompagnes: ['tomate', 'basilic', 'persil'],
      plantesIncompatibles: ['haricot'],
      temperaturesOptimales: { min: 18, max: 30 },
      besoinsEau: 'moyen',
      exigencesSoleil: 'plein_soleil',
      niveauDifficulte: 2
    },
    calendrierDefaut: {
      moisSemis: [3, 4],
      moisPlantation: [5, 6],
      moisRecolte: [7, 8, 9, 10]
    }
  },

  // LÉGUMES - Brassicacées
  {
    nomScientifique: 'Brassica oleracea var. capitata',
    nomCommun: 'Chou cabus',
    famille: 'Brassicaceae',
    categorie: 'LEGUME',
    infosCulture: {
      profondeurPlantationCm: 1,
      espacementCm: 50,
      joursGermination: 5,
      joursRecolte: 90,
      plantesCompagnes: ['carotte', 'pomme_de_terre', 'haricot'],
      plantesIncompatibles: ['tomate', 'radis'],
      temperaturesOptimales: { min: 10, max: 25 },
      besoinsEau: 'eleve',
      exigencesSoleil: 'plein_soleil',
      niveauDifficulte: 3
    },
    calendrierDefaut: {
      moisSemis: [3, 4, 7, 8],
      moisPlantation: [5, 6, 9],
      moisRecolte: [6, 7, 10, 11]
    }
  },
  {
    nomScientifique: 'Raphanus sativus',
    nomCommun: 'Radis rose',
    famille: 'Brassicaceae',
    categorie: 'LEGUME',
    infosCulture: {
      profondeurPlantationCm: 2,
      espacementCm: 5,
      joursGermination: 4,
      joursRecolte: 25,
      plantesCompagnes: ['carotte', 'laitue', 'épinard'],
      plantesIncompatibles: ['chou', 'navet'],
      temperaturesOptimales: { min: 8, max: 20 },
      besoinsEau: 'moyen',
      exigencesSoleil: 'mi_ombre',
      niveauDifficulte: 1
    },
    calendrierDefaut: {
      moisSemis: [3, 4, 5, 6, 7, 8, 9],
      moisPlantation: [],
      moisRecolte: [4, 5, 6, 7, 8, 9, 10]
    }
  },

  // LÉGUMES - Fabacées
  {
    nomScientifique: 'Phaseolus vulgaris',
    nomCommun: 'Haricot vert',
    famille: 'Fabaceae',
    categorie: 'LEGUME',
    infosCulture: {
      profondeurPlantationCm: 3,
      espacementCm: 10,
      joursGermination: 8,
      joursRecolte: 60,
      plantesCompagnes: ['carotte', 'chou', 'pomme_de_terre'],
      plantesIncompatibles: ['oignon', 'ail'],
      temperaturesOptimales: { min: 12, max: 28 },
      besoinsEau: 'moyen',
      exigencesSoleil: 'plein_soleil',
      niveauDifficulte: 1
    },
    calendrierDefaut: {
      moisSemis: [4, 5, 6, 7],
      moisPlantation: [],
      moisRecolte: [6, 7, 8, 9]
    }
  },
  {
    nomScientifique: 'Pisum sativum',
    nomCommun: 'Petit pois',
    famille: 'Fabaceae',
    categorie: 'LEGUME',
    infosCulture: {
      profondeurPlantationCm: 4,
      espacementCm: 8,
      joursGermination: 10,
      joursRecolte: 70,
      plantesCompagnes: ['carotte', 'radis', 'laitue'],
      plantesIncompatibles: ['oignon', 'ail'],
      temperaturesOptimales: { min: 8, max: 20 },
      besoinsEau: 'moyen',
      exigencesSoleil: 'plein_soleil',
      niveauDifficulte: 2
    },
    calendrierDefaut: {
      moisSemis: [3, 4, 8, 9],
      moisPlantation: [],
      moisRecolte: [5, 6, 10, 11]
    }
  },

  // LÉGUMES - Apiacées
  {
    nomScientifique: 'Daucus carota',
    nomCommun: 'Carotte',
    famille: 'Apiaceae',
    categorie: 'LEGUME',
    infosCulture: {
      profondeurPlantationCm: 1,
      espacementCm: 5,
      joursGermination: 12,
      joursRecolte: 90,
      plantesCompagnes: ['poireau', 'oignon', 'radis'],
      plantesIncompatibles: ['aneth', 'coriandre'],
      temperaturesOptimales: { min: 8, max: 25 },
      besoinsEau: 'moyen',
      exigencesSoleil: 'plein_soleil',
      niveauDifficulte: 2
    },
    calendrierDefaut: {
      moisSemis: [3, 4, 5, 6, 7],
      moisPlantation: [],
      moisRecolte: [6, 7, 8, 9, 10]
    }
  },

  // LÉGUMES - Astéracées
  {
    nomScientifique: 'Lactuca sativa',
    nomCommun: 'Laitue',
    famille: 'Asteraceae',
    categorie: 'LEGUME',
    infosCulture: {
      profondeurPlantationCm: 1,
      espacementCm: 25,
      joursGermination: 6,
      joursRecolte: 50,
      plantesCompagnes: ['radis', 'carotte', 'haricot'],
      plantesIncompatibles: ['tournesol'],
      temperaturesOptimales: { min: 10, max: 25 },
      besoinsEau: 'moyen',
      exigencesSoleil: 'mi_ombre',
      niveauDifficulte: 1
    },
    calendrierDefaut: {
      moisSemis: [3, 4, 5, 6, 7, 8],
      moisPlantation: [4, 5, 6, 7, 8, 9],
      moisRecolte: [5, 6, 7, 8, 9, 10]
    }
  },

  // HERBES AROMATIQUES
  {
    nomScientifique: 'Ocimum basilicum',
    nomCommun: 'Basilic',
    famille: 'Lamiaceae',
    categorie: 'HERBE_AROMATIQUE',
    infosCulture: {
      profondeurPlantationCm: 1,
      espacementCm: 20,
      joursGermination: 8,
      joursRecolte: 60,
      plantesCompagnes: ['tomate', 'poivron', 'aubergine'],
      plantesIncompatibles: ['rue'],
      temperaturesOptimales: { min: 15, max: 30 },
      besoinsEau: 'moyen',
      exigencesSoleil: 'plein_soleil',
      niveauDifficulte: 2
    },
    calendrierDefaut: {
      moisSemis: [4, 5, 6],
      moisPlantation: [5, 6, 7],
      moisRecolte: [6, 7, 8, 9, 10]
    }
  },
  {
    nomScientifique: 'Petroselinum crispum',
    nomCommun: 'Persil plat',
    famille: 'Apiaceae',
    categorie: 'HERBE_AROMATIQUE',
    infosCulture: {
      profondeurPlantationCm: 1,
      espacementCm: 15,
      joursGermination: 15,
      joursRecolte: 70,
      plantesCompagnes: ['tomate', 'carotte', 'radis'],
      plantesIncompatibles: ['laitue'],
      temperaturesOptimales: { min: 10, max: 25 },
      besoinsEau: 'moyen',
      exigencesSoleil: 'mi_ombre',
      niveauDifficulte: 1
    },
    calendrierDefaut: {
      moisSemis: [3, 4, 5, 8, 9],
      moisPlantation: [4, 5, 6, 9, 10],
      moisRecolte: [5, 6, 7, 8, 9, 10, 11]
    }
  },

  // FRUITS
  {
    nomScientifique: 'Fragaria x ananassa',
    nomCommun: 'Fraise',
    famille: 'Rosaceae',
    categorie: 'FRUIT',
    infosCulture: {
      profondeurPlantationCm: 2,
      espacementCm: 30,
      joursGermination: 14,
      joursRecolte: 365, // Vivace
      plantesCompagnes: ['ail', 'thym', 'bourrache'],
      plantesIncompatibles: ['chou', 'brocoli'],
      temperaturesOptimales: { min: 10, max: 25 },
      besoinsEau: 'eleve',
      exigencesSoleil: 'plein_soleil',
      niveauDifficulte: 2
    },
    calendrierDefaut: {
      moisSemis: [2, 3, 8, 9],
      moisPlantation: [3, 4, 9, 10],
      moisRecolte: [5, 6, 7, 8]
    }
  }
]

export const typesIntervention = [
  // ARROSAGE
  {
    nom: 'Arrosage manuel',
    categorie: 'ARROSAGE',
    dureeDefautMinutes: 15,
    necessiteVerifMeteo: true,
    heureOptimaleJournee: ['matin', 'soir'],
    modeleSaisie: {
      champsRequis: ['quantite_eau'],
      champsOptionnels: ['temperature_eau', 'methode'],
      unitesMesure: { quantite_eau: 'litres' }
    },
    frequenceSuggeree: {
      intervalleJours: 2,
      variationsSaisonnieres: {
        ete: 1,
        printemps: 2,
        automne: 3,
        hiver: 7
      }
    }
  },
  {
    nom: 'Arrosage automatique',
    categorie: 'ARROSAGE',
    dureeDefautMinutes: 20,
    necessiteVerifMeteo: true,
    heureOptimaleJournee: ['matin'],
    modeleSaisie: {
      champsRequis: ['duree_minutes'],
      champsOptionnels: ['pression_bar', 'debit_l_min'],
      unitesMesure: { duree: 'minutes' }
    },
    frequenceSuggeree: {
      intervalleJours: 1,
      variationsSaisonnieres: {
        ete: 1,
        printemps: 2,
        automne: 3,
        hiver: 5
      }
    }
  },

  // FERTILISATION
  {
    nom: 'Fertilisation organique',
    categorie: 'FERTILISATION',
    dureeDefautMinutes: 30,
    necessiteVerifMeteo: false,
    heureOptimaleJournee: ['matin'],
    modeleSaisie: {
      champsRequis: ['type_fertilisant', 'quantite'],
      champsOptionnels: ['npk_ratio', 'methode_application'],
      unitesMesure: { quantite: 'kg' }
    },
    frequenceSuggeree: {
      intervalleJours: 14,
      variationsSaisonnieres: {
        ete: 14,
        printemps: 10,
        automne: 21,
        hiver: 60
      }
    }
  },
  {
    nom: 'Compostage surface',
    categorie: 'FERTILISATION',
    dureeDefautMinutes: 20,
    necessiteVerifMeteo: false,
    heureOptimaleJournee: ['matin', 'apres_midi'],
    modeleSaisie: {
      champsRequis: ['epaisseur_cm'],
      champsOptionnels: ['type_compost', 'origine'],
      unitesMesure: { epaisseur: 'cm' }
    },
    frequenceSuggeree: {
      intervalleJours: 30,
      variationsSaisonnieres: {
        ete: 30,
        printemps: 21,
        automne: 14,
        hiver: 90
      }
    }
  },

  // TRAITEMENT
  {
    nom: 'Traitement préventif bio',
    categorie: 'TRAITEMENT',
    dureeDefautMinutes: 25,
    necessiteVerifMeteo: true,
    heureOptimaleJournee: ['soir'],
    modeleSaisie: {
      champsRequis: ['produit_utilise', 'concentration'],
      champsOptionnels: ['cible_traitement', 'conditions_application'],
      unitesMesure: { concentration: 'pourcentage' }
    },
    frequenceSuggeree: {
      intervalleJours: 21,
      variationsSaisonnieres: {
        ete: 14,
        printemps: 21,
        automne: 30,
        hiver: 90
      }
    }
  },

  // TAILLE
  {
    nom: 'Taille formation',
    categorie: 'TAILLE',
    dureeDefautMinutes: 40,
    necessiteVerifMeteo: false,
    heureOptimaleJournee: ['matin'],
    modeleSaisie: {
      champsRequis: ['type_taille'],
      champsOptionnels: ['outils_utilises', 'branches_supprimees'],
      unitesMesure: {}
    },
    frequenceSuggeree: {
      intervalleJours: 60,
      variationsSaisonnieres: {
        ete: 30,
        printemps: 45,
        automne: 90,
        hiver: 180
      }
    }
  },

  // DÉSHERBAGE
  {
    nom: 'Désherbage manuel',
    categorie: 'DESHERBAGE',
    dureeDefautMinutes: 35,
    necessiteVerifMeteo: false,
    heureOptimaleJournee: ['matin', 'apres_midi'],
    modeleSaisie: {
      champsRequis: ['surface_m2'],
      champsOptionnels: ['outils_utilises', 'methode'],
      unitesMesure: { surface: 'm2' }
    },
    frequenceSuggeree: {
      intervalleJours: 14,
      variationsSaisonnieres: {
        ete: 7,
        printemps: 10,
        automne: 21,
        hiver: 60
      }
    }
  },

  // MAINTENANCE
  {
    nom: 'Binage',
    categorie: 'MAINTENANCE',
    dureeDefautMinutes: 25,
    necessiteVerifMeteo: false,
    heureOptimaleJournee: ['matin'],
    modeleSaisie: {
      champsRequis: ['profondeur_cm'],
      champsOptionnels: ['outil_utilise'],
      unitesMesure: { profondeur: 'cm' }
    },
    frequenceSuggeree: {
      intervalleJours: 21,
      variationsSaisonnieres: {
        ete: 14,
        printemps: 21,
        automne: 30,
        hiver: 90
      }
    }
  },

  // OBSERVATION
  {
    nom: 'Observation sanitaire',
    categorie: 'OBSERVATION',
    dureeDefautMinutes: 10,
    necessiteVerifMeteo: false,
    heureOptimaleJournee: ['matin', 'apres_midi'],
    modeleSaisie: {
      champsRequis: ['etat_general'],
      champsOptionnels: ['problemes_detectes', 'actions_recommandees'],
      unitesMesure: {}
    },
    frequenceSuggeree: {
      intervalleJours: 7,
      variationsSaisonnieres: {
        ete: 3,
        printemps: 7,
        automne: 14,
        hiver: 30
      }
    }
  }
]