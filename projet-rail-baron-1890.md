# Projet Rail Baron 1890

## Vue d'ensemble

Rail Baron 1890 est un prototype de jeu de gestion ferroviaire solo sur navigateur, pensé pour retrouver une partie du ressenti de Railroad Tycoon période Amiga tout en restant compatible avec un hébergement web statique et gratuit de type InfinityFree.[cite:1][cite:20][cite:23] Le cœur du projet est la rentabilité d'un réseau ferroviaire par la création de voies commerciales, la gestion fine des échanges entre producteurs, industries et villes, puis l'affectation de convois spécialisés à des lignes rentables.[cite:20][cite:21][cite:23]

Le prototype actuel est une web app HTML/CSS/JavaScript autonome, sans backend obligatoire, afin de rester déployable sur un hébergement gratuit qui accepte les fichiers statiques, le JavaScript côté navigateur, PHP et MySQL, mais pas un environnement Node.js permanent.[cite:1][cite:6][cite:9][cite:12]

## Idée du projet

L'idée directrice est de créer un "Railroad Tycoon lite" jouable directement dans un navigateur, avec une lisibilité forte de la carte, des lignes, des stations, des cargaisons et des trains, plutôt qu'un simple tableau économique abstrait.[cite:20][cite:23][cite:49] Le jeu doit récompenser le joueur sur une durée limitée, ici une partie en 24 mois, en évaluant la qualité du réseau, l'affectation des lignes et la capacité à transformer les flux de ressources en bénéfice net.[cite:20][cite:23]

Le projet s'inspire des éléments qui reviennent dans les descriptions et souvenirs du premier Railroad Tycoon : vue d'ensemble de la carte, villes et industries reliées par rail, marchandises variées, importance des stations, achat de trains, wagons dédiés et chaînes économiques entre matières premières, industries de transformation et consommation urbaine.[cite:20][cite:21][cite:23][cite:65][cite:75]

## Sources d'inspiration et de recherche

Les principales sources de référence pour la direction du prototype sont les pages consacrées à Railroad Tycoon sur Amiga, des fiches de présentation du jeu, ainsi que des contenus plus larges sur les héritiers du genre et les mécaniques centrées sur stations, cargaisons, trains et économie de réseau.[cite:20][cite:21][cite:23][cite:36][cite:65][cite:70][cite:75]

Les sources techniques sur l'hébergement ont servi à cadrer le périmètre réalisable : InfinityFree permet l'hébergement d'un site web gratuit avec fichiers statiques, PHP et base MySQL, mais ne fournit pas d'hébergement Node.js permanent, ce qui impose une architecture majoritairement exécutée côté client.[cite:1][cite:6][cite:9][cite:12][cite:13]

| Type de source | Usage dans le projet | Références |
|---|---|---|
| Railroad Tycoon Amiga | Interface, ressenti, structure générale du gameplay | [cite:20][cite:21][cite:23] |
| Jeux voisins / genre railroad-like | Lecture des attentes sur trains, cargaisons, stations, lignes | [cite:36][cite:39][cite:65][cite:70] |
| Vidéos et descriptions modernes | Validation du besoin de lisibilité des convois et des flux | [cite:49][cite:54][cite:58][cite:75] |
| Hébergement InfinityFree | Définition des contraintes techniques du prototype web | [cite:1][cite:6][cite:9][cite:12][cite:13] |

## Ce qui a été fait

Le projet est passé d'un prototype V3 en fichier HTML unique à une V3.6 modulaire en temps réel, structurée en 8 fichiers JS, CSS et HTML séparés.[cite:1]

### V3 (originale)
Fichier HTML unique ~1600 lignes. Carte fixe, 6 ressources, construction de voies, achat de convois, animation continue, comptabilité mensuelle tour par tour.

### V3.5 (revue et refactor)
Suite à une review complète, 16 correctifs appliqués :

- **Architecture** : découpage modulaire en 8 fichiers JS (config, game-state, economy, tracks, trains, renderer, ui, main)
- **Bug critique corrigé** : les trains non-passagers restaient bloqués après la première livraison. Machine à états refaite en 4 phases (loading → moving → unloading → returning) sans inversion du from/to
- **Qualité** : noms de variables clarifiés (`monthlyRevenue`/`lifetimeProfit`), IDs séquentiels, constantes extraites dans `CONFIG`
- **Économie** : production différenciée par type de site (`prodRate`), démolition rembourse 25% du coût proportionnel
- **UI** : 14 sites affichés (plus seulement 8), log 50 entrées scrollable, survol carte avec surbrillance, `image-rendering: pixelated` retiré
- **Performance** : animation en pause quand l'onglet est en arrière-plan

### V3.6 (temps réel)
- Gameplay converti en **temps réel** avec vitesse variable (⏸ Pause, ▶ 1×, ▶▶ 2×, ▶▶▶ 4×)
- Le mois défile automatiquement (~15s à 1×), construction et achat possibles en parallèle
- Barre de progression du mois visible dans le panneau Compagnie
- Fin de partie automatique après 24 mois avec pause automatique
- Delta-time dans la boucle `requestAnimationFrame`, `processMonthEnd` dans le module economy

### Mécaniques présentes (V3.6)

- Construction et suppression de lignes ferroviaires entre tous les types de sites.
- 6 ressources économiques distinctes (charbon, bois, grain, acier, textile, passagers).
- Fluctuation mensuelle des prix par ressource.
- Trains visibles circulant sur les voies avec animation continue.
- Wagons colorés selon la cargaison, chargement et déchargement visuels.
- Dépôts et stocks locaux par site, visibles sur la carte.
- Achat de convois dédiés à une ligne et une ressource.
- Machine à états des trains : chargement → trajet aller → déchargement → retour à vide.
- Comptabilité mensuelle automatique (recettes, entretien, bénéfice net).
- Production différenciée par type de site (mine 2.5×, ferme 2.5×, ville 1×, etc.).
- Survol de la carte avec surbrillance des sites.
- Thème clair/sombre.

## Ce qui reste à faire

Le prototype reste encore une base de travail. Pour se rapprocher davantage d'un véritable Railroad Tycoon jouable, plusieurs briques sont encore manquantes.[cite:20][cite:23][cite:65][cite:75]

### Gameplay

- Ajouter des tailles de gares différentes, avec rayon d'action et coût distinct.
- Permettre la composition manuelle des trains, wagon par wagon ou par classe de wagons.[cite:65][cite:75]
- Créer de vraies chaînes industrielles, par exemple charbon vers aciérie puis acier vers ville ou manufacture.[cite:70][cite:75]
- Introduire plusieurs locomotives avec vitesse, puissance, coût d'entretien et fiabilité différents.[cite:20][cite:23]
- Ajouter de meilleurs objectifs de scénario, plutôt qu'une seule contrainte de durée.

### Interface

- Créer des fenêtres rétro inspirées des interfaces Amiga et DOS, avec panneaux flottants, fiches de train et écrans de compagnie.[cite:20][cite:23]
- Ajouter une fiche détaillée pour chaque train, station et ligne.
- Permettre le double-clic sur train ou gare pour ouvrir un panneau de gestion.
- Ajouter des graphes économiques, rapports annuels et historiques de trafic.

### Simulation

- Gérer des stocks de destination plus réalistes, avec saturation, pénurie et réorientation des flux.[cite:64][cite:65]
- Faire apparaître des congestions, files d'attente ou croisements de trains.
- Ajouter une vraie logique de temps de parcours, d'accélération et d'arrêt en gare.
- Introduire une carte procédurale ou des cartes de scénarios multiples.

## Ce qui pourrait être amélioré

Le prototype actuel fonctionne, mais plusieurs aspects peuvent être nettement raffinés pour améliorer la profondeur de jeu et le plaisir visuel. Les priorités d'amélioration sont autant ergonomiques que ludiques.[cite:36][cite:39][cite:65]

| Domaine | État actuel | Amélioration possible |
|---|---|---|
| Économie | Prix et recettes assez simples | Offre/demande plus crédible, industries dépendantes, pénuries locales |
| Trains | Un train dédié par ligne et ressource | Horaires, aiguillages, priorités, panne, usure |
| Carte | Carte fixe | Génération procédurale, relief, coûts de terrain, rivières, tunnels |
| Interface | Interface rétro simple | Vraies fenêtres draggable, infobulles, raccourcis clavier, minimap |
| Lisibilité | Bonne base | Icônes de cargaison, surlignage de ligne, sens des flux, statut de gare |
| Rejouabilité | Partie unique de 24 mois | Scénarios, objectifs variés, difficulté progressive |

Une amélioration particulièrement importante serait de mieux distinguer la logique économique de la logique visuelle. Aujourd'hui, les trains sont visibles et les stocks existent, mais le modèle économique reste encore relativement compact. Un gain important viendrait d'une séparation plus nette entre production, stockage, demande, transformation et rentabilité de chaque tronçon.[cite:64][cite:65][cite:70][cite:75]

## Ce qui ne sera pas possible, ou difficilement possible

Certaines idées seraient peu réalistes ou mal adaptées au cadre technique retenu, surtout si l'objectif reste un hébergement gratuit et simple sur InfinityFree.[cite:1][cite:6][cite:9][cite:12][cite:13]

### Peu réaliste sur ce cadre

- Un backend Node.js permanent pour simulation serveur, matchmaking ou WebSocket temps réel, car InfinityFree ne fournit pas cet environnement sur son offre gratuite.[cite:6][cite:9][cite:12]
- Un multijoueur temps réel robuste avec simulation serveur autoritaire, car cela demanderait une infrastructure persistante, des connexions en continu et une logique serveur dédiée.[cite:6][cite:12]
- Une simulation très lourde avec centaines de trains, pathfinding complexe, signaux poussés et recalcul continu côté serveur, car le projet est pensé pour tourner majoritairement dans le navigateur et être hébergé léger.[cite:1][cite:13]
- Une dépendance forte au stockage persistant local du navigateur comme architecture centrale, car l'environnement de diffusion ciblé peut être contraignant et le projet doit rester portable et simple à héberger.[cite:1][cite:13]

### Techniquement possible mais à surveiller

- Sauvegarde cloud via PHP/MySQL, possible, mais à concevoir prudemment pour éviter trop d'accès concurrents ou trop d'écritures répétées.[cite:1][cite:10][cite:13]
- Cartes volumineuses avec beaucoup d'assets graphiques, possibles en théorie, mais à limiter pour rester légères et confortables sur un hébergement gratuit partagé.[cite:1][cite:13]
- Audio abondant, cinématiques ou assets lourds, possibles mais peu adaptés à un prototype web sobre et rapide à charger.[cite:1][cite:13]

## Pourquoi ces limites existent

Ces limites viennent de deux causes principales. D'une part, le choix d'un hébergement gratuit oriente naturellement vers une architecture simple, légère et peu dépendante d'un serveur applicatif complexe.[cite:1][cite:6][cite:12] D'autre part, l'ambition du projet est de retrouver le charme d'un grand jeu ferroviaire classique sans tomber dans un développement beaucoup trop vaste pour un premier prototype navigateur.[cite:20][cite:23][cite:65]

Le bon compromis consiste donc à faire vivre la majorité de la simulation dans le navigateur, à garder un cœur de gameplay très clair, puis à n'ajouter un backend PHP/MySQL qu'au moment où une vraie valeur apparaît, par exemple pour sauvegarder des parties, stocker des scores ou publier des scénarios.[cite:1][cite:12][cite:13]

## Direction recommandée pour la suite

La suite la plus cohérente serait une V4 centrée sur l'ergonomie et la profondeur ferroviaire plutôt que sur l'ajout de quantité brute. Le meilleur rendement de développement viendrait d'une interface plus fidèle au style Amiga, d'une meilleure gestion de gare, et d'une simulation économique plus locale.[cite:20][cite:23][cite:65][cite:75]

Ordre conseillé :

1. Refaire l'interface en panneaux rétro plus denses et plus proches du souvenir Amiga.[cite:20][cite:23]
2. Ajouter fiches de trains, gares et lignes avec gestion détaillée.[cite:65][cite:75]
3. Approfondir la chaîne économique et les stocks locaux.[cite:64][cite:70][cite:75]
4. Ajouter locomotives, types de wagons, coûts, vitesses et fiabilité.[cite:20][cite:23]
5. Prévoir ensuite seulement une sauvegarde PHP/MySQL si nécessaire.[cite:1][cite:10][cite:13]

## État de maturité du projet

À ce stade, Rail Baron 1890 est un prototype modulaire solide, jouable en temps réel, avec une architecture propre prête pour les extensions V4. La V3.6 valide le concept central, la compatibilité hébergement statique, et l'essentiel des sensations de gameplay : construire, affecter, observer les trains circuler, voir les wagons se charger et les flux transiter sur la carte.[cite:1][cite:20][cite:23][cite:65]

La V3.5 a assaini la base technique (revue de code, 16 correctifs, architecture modulaire). La V3.6 a résolu le problème UX majeur en passant au temps réel avec vitesse variable, rendant le jeu plus vivant et plus fidèle à l'esprit Railroad Tycoon.

Prochaine étape logique : V4 centrée sur l'interface rétro Amiga et la profondeur ferroviaire (locomotives multiples, chaînes industrielles, fiches détaillées).
