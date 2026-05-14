<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# maintenant décris précisément le gameplay original

Voici une synthèse complète et précise du gameplay original de Railroad Tycoon (1990).

***

## Boucle de jeu principale

Le jeu tourne en **temps réel pausable**, vu du dessus avec 4 niveaux de zoom (Regional → Area → Local → Detail). L'objectif est de faire fructifier 1 million de dollars en 40 à 100 ans selon la difficulté, en construisant et opérant un réseau ferroviaire rentable. Toute action se fait via une **barre de menus déroulants** (Game / Display / Reports / Build / Action), accessible au clavier ou à la souris.[^1][^2][^3]

***

## 1. Configuration initiale (Pre-Game)

Avant de jouer, le joueur choisit dans l'ordre :[^3]

1. **La carte** : Eastern USA (1830), Western USA (1866), England (1828), Europe (1900) — chacune avec sa propre technologie de locomotives disponible dès le départ
2. **Le niveau de difficulté** : Investor (40 ans), Financier (60 ans), Mogul (80 ans), Tycoon (100 ans) — affecte les revenus par livraison ET la durée de partie
3. **Les 3 niveaux de réalité** (toggles indépendants) :
    - No Collision / **Dispatcher Operation** (signaux et collisions actifs)
    - Friendly / **Cut-Throat Competition** (IA agressive)
    - Basic / **Complex Economy** (offre/demande réaliste)
4. **Le test de copy protection** : identifier une locomotive parmi une liste — si raté, pénalité sur les finances[^3]

Le **Difficulty Factor** (25% à 100%) est la somme de ces choix. Il conditionne le bonus de retraite final.[^3]

***

## 2. Construction du réseau

### Pose de voies (Detail Display uniquement)

La pose de rails se fait case par case sur l'**affichage Detail**, le plus zoomé. Le joueur déplace un curseur de construction (Construction Box) et pose des sections une par une. Règles importantes :[^3]

- Les **courbes à 45°** ralentissent les trains ; les **courbes à 90°** sont encore plus pénalisantes et à éviter[^4]
- Les **pentes** réduisent la vitesse selon la puissance de la locomotive et le nombre de wagons
- La **double voie** peut être ajoutée sur une section existante moyennant un surcoût
- Le jeu calcule automatiquement le **coût de terrain** selon la topographie (plaine < colline < montagne < rivière)
- Un menu "Remove Track / Build Track" bascule entre construction et démolition[^3]


### Ponts et tunnels

| Type | Coût | Résistance aux inondations |
| :-- | :-- | :-- |
| Pont en bois | 50 000 \$ | Vulnérable |
| Pont en acier | 200 000 \$ | Résistant |
| Pont en pierre | 400 000 \$ | Indestructible |
| Tunnel | Variable (très élevé) | Indestructible |

[^4][^3]

### Stations

Construites via le menu Build → Build Station, toujours sur le **Detail Display**. La première station construite obtient un **Engine Shop gratuit**. Après construction, la station paye **tarifs doublés** pendant toute la première période comptable de 2 ans.[^1][^4]

***

## 3. Les trains : construction et composition

### Construire un train

Un nouveau train ne peut être construit **qu'à un Engine Shop**. Le menu Build → Buy Engine ouvre une liste des locomotives disponibles à la date actuelle. La liste s'enrichit au fil du temps selon les années (exemple : le TGV devient disponible en Europe vers 1980).[^5][^1]

### Le Consist (composition du train)

C'est le cœur de l'opération. Chaque train a une composition de wagons ajustable à tout moment depuis son Train Report :[^4][^3]

- Chaque wagon ajouté coûte **5 000 \$** — mais **seulement si le total global de wagons augmente**
- Types de wagons : passenger, mail, beer, livestock, goods, hops, textiles, steel, chemicals, cotton, coal
- Un wagon ne peut charger **que son type spécifique** de cargo — un coal car ne chargera jamais du grain


### Types de trains (Train Types)

| Type | Comportement |
| :-- | :-- |
| **Local** | S'arrête à chaque station sur la route |
| **Through** | S'arrête seulement aux stations de sa liste de destinations |
| **Express** | Prend uniquement les cargos les plus rentables (mail, passagers) |
| **Limited** | Ne s'arrête qu'aux deux stations terminales, sans arrêts intermédiaires |

Le Limited est le plus rapide et donc le plus rentable pour les lignes mail/passagers sur longues distances.[^3]

### Nommer un train

Un train peut recevoir un nom **uniquement s'il bat le record de vitesse actuel** en vigueur. Un train nommé en service passager gagne **25% de revenu en plus**.[^3]

***

## 4. Le routage et la planification

### Destinations planifiées

Chaque train peut avoir **2 à 4 stops planifiés** définissant son circuit. Le train fait la navette en boucle entre ces destinations. Le Train Report permet de :[^3]

- Changer les destinations
- Modifier le consist à chaque station (un train peut donc changer de type de wagons en cours de route)


### Priority Orders

Une commande temporaire qui **dévie le train vers une destination non planifiée** pour ramasser un Priority Shipment ou répondre à un besoin urgent. Après livraison, le train reprend sa route normale.[^3]

### Priority Consist

Similaire aux Priority Orders mais pour la composition : le train charge temporairement un type de cargo différent, puis reprend son consist habituel.[^3]

### Wait Until Full

Ordre donné à une station spécifique : **le train attend d'être chargé à 100%** avant de repartir. Utile pour le bulk freight (charbon, minerai) mais contre-productif pour le mail et les passagers.[^3]

***

## 5. Le mode Dispatcher (signaux et collisions)

### Blocs de signalisation

En mode Dispatcher (réalité level activé), la carte est divisée en **blocs** délimités par les stations et les Signal Towers. La règle est simple : **un seul train à la fois dans un bloc de voie simple**.[^3]

Chaque station et chaque Signal Tower possèdent des signaux des deux côtés. Un train demande l'accès au bloc suivant : si le bloc est libre, le signal est vert ; s'il est occupé, le signal est rouge et le train attend.[^3]

### Double voie et dépassements

Sur double voie, les deux sens peuvent circuler simultanément, éliminant les attentes. Les Signal Towers (50 000 \$ environ) permettent aussi de créer des **évitements** (passing loops) sur voie simple, divisant un long bloc en deux plus courts et fluidifiant le trafic.[^1][^4][^3]

### Pausing Trains

N'importe quel train peut être mis en **pause manuelle** par le joueur depuis son Train Report — utile pour céder la voie sans installer de signaux supplémentaires.[^3]

### Collisions

En mode Dispatcher, une collision est possible si deux trains se retrouvent dans le même bloc. Elle déclenche une **animation de déraillement** et détruit les deux trains — perte financière immédiate.[^1][^3]

***

## 6. Interface et informations en jeu

### Les 4 niveaux d'affichage

| Affichage | Usage |
| :-- | :-- |
| **Regional Display** | Vue globale de toute la carte, géographie, concurrents |
| **Area Display** | Vue intermédiaire, shipping reports, resource map |
| **Local Display** | Vue précise, positions trains, stocks de cargo en stations |
| **Detail Display** | Construction de voies, stations, améliorations |

[^6][^3]

### Train Roster

Affiché en permanence sur le côté droit de l'écran : liste tous les trains avec leur numéro, position actuelle et statut. Cliquer sur un train ouvre son Train Report.[^3]

### Shipping Reports

Indiquent le **stock de cargo en attente dans chaque station** — essentiel pour savoir où envoyer de nouveaux trains ou augmenter la capacité.[^3]

### Train Messages (World View Window)

Fenêtre en haut à droite qui affiche en temps réel chaque **arrivée de train** : numéro, station, cargos livrés, revenu gagné. Peut être désactivée ou accélérée pour ne pas saturer l'attention.[^3]

### Vitesse du jeu

5 vitesses : Frozen (pause totale, construction possible), Slow, Moderate, Fast, **Turbo** (temps accéléré, sans pause pour les rapports fiscaux ni les news).[^3]

***

## 7. Rapports financiers et bilan

Accessible depuis le menu Reports :[^3]

- **Balance Sheet** : actif, passif, bénéfices cumulés
- **Income Statement** : revenus / dépenses par période et cumulés
- **Train Income** : revenu détaillé par train
- **Stocks** : cours des actions de toutes les compagnies
- **Accomplishments** : titre acquis, records battus
- **Efficiency** : ratio revenus/kilomètre de voie
- **History** : chronologie des événements de la partie

***

## 8. Fin de partie et classement

À la retraite (forcée ou volontaire), le joueur reçoit un **bonus de retraite** calculé sur la valeur de la compagnie × Difficulty Factor. Le titre final est déterminé par la performance : les pires joueurs deviennent "vendeur d'huile de serpent" ou "montreur de cirque", les meilleurs deviennent Président des États-Unis ou Premier Ministre. Le Hall of Fame conserve les meilleurs scores entre parties.[^1][^3]
<span style="display:none">[^10][^11][^12][^13][^14][^15][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://www.youtube.com/watch?v=cAznnXdDWnQ

[^2]: https://archive.org/details/railroad_tycoon_1990

[^3]: https://www.freegameempire.com/games/railroad-tycoon/manual

[^4]: https://freerails.readthedocs.io/en/latest/specification_rt1.html

[^5]: https://www.youtube.com/watch?v=TCuK0NDsZNc

[^6]: https://www.dosdays.co.uk/topics/Games/game_rails.php

[^7]: https://www.vogons.org/viewtopic.php?t=10289

[^8]: https://www.pcgamingwiki.com/wiki/Sid_Meier's_Railroad_Tycoon

[^9]: https://www.scribd.com/document/54686011/RRT3

[^10]: https://www.scribd.com/document/386364940/Railroad-Tycoon-Deluxe-pdf

[^11]: https://openretro.org/file/0b731eb2df7236fb5e83b1fe81f6416cc81e914a/Manual (en).pdf

[^12]: https://www.freegameempire.com/games/railroad-tycoon-deluxe/manual

[^13]: https://www.freegameempire.com/games/Railroad-Tycoon/manual

[^14]: https://www.youtube.com/watch?v=dKTgK6R8GmU

[^15]: https://archive.org/stream/railroadtycoonmanual/RailroadTycoon-TechnicalSupplement_djvu.txt

