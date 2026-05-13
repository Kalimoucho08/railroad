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

Le projet dispose déjà d'un prototype fonctionnel jouable dans un fichier HTML unique, adapté à un hébergement très simple.[cite:1] Une carte fixe relie plusieurs villes, sites de production et industries, avec un système de construction de voies entre nœuds et une logique de partie limitée dans le temps.[cite:20][cite:23]

Les mécaniques actuellement présentes sont les suivantes :

- Construction et suppression de lignes ferroviaires entre villes, producteurs et industries.
- Gestion d'au moins cinq ressources économiques distinctes, auxquelles s'ajoutent les passagers comme flux spécifique.[cite:20][cite:21][cite:23]
- Fluctuation de prix par ressource afin de donner un intérêt tactique aux choix de lignes et d'affectation.
- Trains visibles circulant sur les voies avec animation continue dans la carte.
- Wagons visibles, colorés selon la cargaison, qui se chargent et se déchargent dans les gares.
- Dépôts et stocks locaux par site, visibles sur la carte sous forme de mini-réserves.
- Achat manuel de convois dédiés à une ligne et à une ressource donnée.
- Calcul mensuel des recettes, de l'entretien et du bénéfice net.

Le prototype s'est donc déplacé d'une démonstration économique assez abstraite vers une représentation déjà plus proche d'un vrai jeu ferroviaire, où l'on voit circuler les trains, où les gares accumulent des stocks, et où l'affectation d'un train à une marchandise devient une décision lisible et concrète.[cite:36][cite:39][cite:65][cite:75]

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

À ce stade, Rail Baron 1890 n'est pas encore un jeu complet, mais c'est déjà un bon prototype directionnel. Il valide l'idée centrale, la compatibilité technique avec un hébergement simple, et plusieurs sensations de gameplay importantes : construire, affecter, observer les trains, voir les wagons se charger et lire les flux sur la carte.[cite:1][cite:20][cite:23][cite:65]

La valeur du prototype est donc moins dans sa finition actuelle que dans le fait qu'il prouve qu'un jeu de gestion ferroviaire solo, inspiré de Railroad Tycoon Amiga, peut être transposé de façon crédible dans une web app légère et hébergeable gratuitement, à condition de garder une architecture sobre et un périmètre de simulation maîtrisé.[cite:1][cite:6][cite:12][cite:20][cite:23]
