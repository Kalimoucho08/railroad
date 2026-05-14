# Économie de Railroad Tycoon Original (1990)
## Analyse complète pour recoder le système

***

## Vue d'ensemble du système économique

Railroad Tycoon (1990, MicroProse / MPS Labs, Sid Meier) est une simulation économique où le joueur gère une compagnie ferroviaire sur 100 ans avec un capital de départ d'un million de dollars — moitié en fonds propres, moitié en emprunt. Toute la mécanique économique repose sur un principe central : **le revenu naît du déplacement de marchandises d'un point de production (offre) vers un point de consommation (demande)** via le réseau ferroviaire. La vitesse, la distance, le type de fret et l'état économique global modulent ce revenu.[^1][^2][^3][^4]

La version Amiga est une adaptation directe de la version DOS originale et partage la même logique économique fondamentale.[^5][^6]

***

## 1. La carte et la génération du monde

### Génération procédurale des ressources

Le monde est généré de façon semi-aléatoire à chaque nouvelle partie. La logique de placement des industries n'est pas stockée directement dans le fichier carte mais repose sur **une valeur seed (uint16_t)** stockée en mémoire (offset 0x3736 dans le fichier .SVE), combinée aux coordonnées de la cellule et à sa "couleur de tuile", qui génère un index dans des **lookup tables codées en dur dans l'exécutable**.[^7]

Concrètement : `industrie_index = lookup_table[f(seed, map_color, x, y)]`. Cela explique pourquoi les villes, ressources et industries changent à chaque génération malgré une même carte de base.[^7]

### Rayon d'influence des stations

Les stations captent tout ce qui se trouve dans leur **rayon géographique** :

| Type de station | Coût | Rayon (en cases) |
|---|---|---|
| Dépôt | 50 000 $ | 3×3 |
| Station | 100 000 $ | 4×4 |
| Terminal | 200 000 $ | 5×5 |

Tout site industriel ou centre de population dans ce rayon alimente l'offre et la demande de la station.[^8][^9]

***

## 2. Le système offre / demande (Supply & Demand)

### Mode Économie Simple (Basic Economy)

Toute station desservant une ville de taille suffisante (**au moins deux villes ou une ville non-village dans son rayon**) accepte et paie **toutes les cargaisons**. C'est le mode "bac à sable" : n'importe quelle marchandise ramassée peut être livrée n'importe où.[^8][^1]

> Règle précise : une station avec seulement trois villages dans son rayon ne demandera rien. Il faut au minimum une ville (city) — pas juste des villages — pour générer de la demande.[^9]

### Mode Économie Complexe (Complex Economy)

La demande est **déterminée par le type d'industries et de population** dans le rayon de la station. Chaque type de site génère une offre ou une demande spécifique selon des tables fixes par région géographique.[^4][^1]

La production des générateurs de ressources atteint les stations par **intervalles de 3 mois** (trimestriels), à raison d'un certain nombre de wagons-chargements par an selon l'état économique.[^9]

### Production industrielle

**Exemple de taux de production normaux** (USA, économie normale) :

| Type de producteur | Production annuelle approx. |
|---|---|
| Mine de charbon | ~3 wagons/an |
| Ferme (grain) | ~3-4 wagons/an |
| Harbor | 3 hops + 6 cotton/an (Angleterre) |
| Gisement pétrolier | variable |

En période de **Dépression ou Panique**, les producteurs génèrent **moins** de marchandises ; en **Prospérité ou Boom**, ils en génèrent **davantage**.[^9]

### Chaînes de production (Cargo Conversions)

Quand une matière première arrive dans une station dotée d'une industrie de transformation, la conversion est **immédiate**. Le résultat transformed est aussitôt mis à disposition pour chargement.[^9]

#### USA — Chaînes de production

| Entrée | Industrie | Sortie (Classe) |
|---|---|---|
| Coal + Iron Ore | Steel Mill | Steel (slow freight) |
| Steel | Factory | Goods (fast freight) |
| Cattle | Stockyard | Livestock/Food (fast freight) |
| Grain | Grain Elevator | Grain (slow freight) |
| Logs | Lumber Yard | Paper/Lumber (slow freight) |
| Oil | Refinery | Petroleum (bulk) |

#### Angleterre — Chaînes de production

| Entrée | Industrie | Sortie |
|---|---|---|
| Coal | Steel Mill | Steel |
| Steel | Factory | Goods (fast freight) |
| Hops | Brewery | Beer (fast freight) |
| Cotton | Textile Mill | Textiles (slow freight) |
| Chemicals (salt) | Chem. Plant | Goods (fast freight) |

#### Europe — Chaînes de production

| Entrée | Industrie | Sortie |
|---|---|---|
| Coal | Steel Mill | Steel |
| Steel | Factory | Armements (fast freight) |
| Grapes | Winery | Wine (fast freight) |
| Wool | Textile Mill | Textiles (slow freight) |
| Nitrates | Chem. Plant | Fertilizer (slow freight) |

[^10][^9]

***

## 3. Les classes de fret et le revenu

### Cinq classes de fret

Le jeu distingue 5 classes de marchandises, chacune avec une **sensibilité différente à la vitesse et à la distance** :[^10][^9]

| Classe | Exemples | Sensibilité vitesse | Sensibilité distance |
|---|---|---|---|
| **Mail** | Courrier | Très haute | Très haute |
| **Passengers** | Passagers | Haute | Haute |
| **Fast Freight** | Food, Livestock, Goods, Beer, Wine, Armements | Moyenne | Moyenne |
| **Slow Freight** | Grain, Steel, Textiles, Hops, Paper | Faible | Faible |
| **Bulk Freight** | Coal, Petroleum, Wood, Chemicals, Cotton, Nitrates | Très faible | Très faible |

### La formule de revenu

La formule exacte encodée dans le binaire n'est pas publiquement documentée à la valeur-octet près (le code assembleur n'a pas été complètement rétro-ingénié publiquement), mais les manuels officiels, les guides stratégiques et les analyses de joueurs permettent de reconstituer la logique avec précision :[^7]

\[
R = \text{BaseRate}(\text{cargo\_class}) \times f(\text{distance}) \times g(\text{speed}) \times \text{DifficultyMult} \times \text{EcoMult} \times \text{StationRateMult}
\]

**Détail de chaque facteur :**

#### BaseRate (taux de base par classe)
- **Mail** = taux le plus élevé (~3–4× le bulk)
- **Passengers** = ~2–3× le bulk
- **Fast Freight** = ~1.5–2× le bulk
- **Slow Freight** = ~1–1.5× le bulk
- **Bulk Freight** = taux de base minimal

Les valeurs absolues varient par région géographique (les tarifs Est-Ouest aux USA-Ouest sont supérieurs aux tarifs Nord-Sud, par exemple).[^10]

#### f(distance) — l'effet de la distance
- Pour **Mail et Passengers** : la distance est un **multiplicateur fort**. Sur de longues distances, des TGV ou trains rapides entre grandes villes peuvent rapporter 200 000 £/voyage.[^11]
- Pour **Bulk Freight** : la distance n'a presque pas d'effet — c'est principalement la quantité (en wagons) qui compte.
- La relation n'est pas linéaire mais s'approche d'une **croissance avec plateau** pour les cargos time-sensitive.

#### g(speed) — l'effet de la vitesse
- **Plus le train arrive vite, plus il gagne**. C'est particulièrement vrai pour mail et passagers.
- Un train nommé (Named Train) qui bat un record de vitesse reçoit un bonus de revenu supplémentaire.[^12]
- Un train "Limited" (qui ne s'arrête qu'aux extrémités) court plus vite qu'un "Through" ou "Local".[^12]

#### DifficultyMult — le facteur de difficulté
- **Investor** (facile) : revenu le plus élevé
- **Financier** : légèrement réduit
- **Mogul** : plus réduit encore
- **Tycoon** (difficile) : revenu le plus bas par livraison[^1][^8]

Ce multiplicateur s'étend de 25% à 100% selon les niveaux combinés (difficulté + niveaux de réalité). Chaque niveau ajouté réduit le revenu mais augmente le bonus de retraite final.[^10]

#### EcoMult — le multiplicateur économique
Voir la section "Climat économique" ci-dessous. Il varie environ entre 0.5 (Dépression) et 1.5 (Boom).

#### StationRateMult — le taux de la station
- **Normal** : ×1.0
- **Double** : ×2.0 (pour les stations neuves ou reconstruites pendant toute leur première période comptable de 2 ans)[^8][^10]
- **Moitié** : ×0.5 (pendant une Rate War)[^13][^10]

### L'effet du "Named Train" et du record de vitesse
Un train qui reçoit un nom et bat le record de vitesse du moment obtient un **bonus de revenu** sur la livraison qui a établi le record. Ce mécanisme pousse le joueur à utiliser les locomotives les plus récentes et les plus rapides pour les lignes mail/passagers.[^11][^12]

***

## 4. Les Shipments Prioritaires (Priority Shipments)

Un **Priority Shipment** est un événement spécial aléatoire : une marchandise urgente apparaît à un point de collecte (`P`) avec une destination finale (`D`). Le bonus affiché **diminue avec le temps** — chaque minute de retard réduit la récompense.[^12]

**Mécanique :**
1. Un bonus (pouvant aller jusqu'à 500 000 $) s'affiche à la création.
2. Un train doit ramasser le cargo avec le bon type de wagon.
3. La récompense décroît jusqu'à l'annulation si personne ne livre.
4. Le cargo peut être "relayé" entre stations intermédiaires.
5. La livraison réussie est comptabilisée dans les **Other Income** du rapport financier.

[^12]

***

## 5. Le réseau ferroviaire et ses effets économiques

### Coûts de construction

| Élément | Coût |
|---|---|
| Case de voie normale (terrain plat) | ~5 000 $ |
| Terrain pentu / montagne | Majoré |
| Pont en bois | 50 000 $ |
| Pont en acier | 200 000 $ |
| Pont en pierre (indestructible) | 400 000 $ |
| Tunnel | Très coûteux |
| Double voie (case) | Coût supplémentaire |
| Signal tower | ~25 000 $ |

[^9]

### Effets de la topographie sur la vitesse
Les courbes à 45° ralentissent les trains. Les courbes à 90° les ralentissent encore davantage et sont déconseillées. Les pentes montantes ralentissent les trains en fonction de leur charge et de la puissance de leur locomotive. Les signal towers permettent à plusieurs trains de se suivre sur la même voie, augmentant le débit.[^12][^9]

### Wagons et coûts
Chaque wagon ajouté à un train coûte **5 000 $** — mais seulement si le total de wagons de tout le réseau **augmente** lors d'un changement de composition (consist).[^8][^10]

### Limite de ressources
- Maximum 32 trains par joueur[^8]
- Maximum 32 stations par joueur[^8]
- La première station construite reçoit un Engine Shop gratuitement[^8]
- Un Engine Shop est nécessaire pour construire de nouveaux trains[^9]

***

## 6. Le climat économique

### Les cinq états de l'économie

Le jeu modélise un **cycle économique dynamique** avec 5 états possibles, référencés comme l'"Economic Climate" :[^10]

| État | Effet sur les revenus | Effet sur la production industrielle | Taux d'intérêt des obligations |
|---|---|---|---|
| **Boom** | +~50% | Élevée | Bas (favorable) |
| **Prosperity** | +~25% | Normale-haute | Modéré |
| **Normal** | ×1.0 (référence) | Normale | Moyen |
| **Recession** | −~20% | Réduite | Élevé |
| **Depression / Panic** | −~50% | Minimale | Très élevé, parfois blocage |

[^14][^15][^9]

### Transitions d'état
L'état économique évolue **aléatoirement** mais n'est pas totalement indépendant des actions du joueur. Des indicateurs comme le cash disponible, le rythme de construction, et les revenus générés semblent influencer (via un système de seeds) l'évolution du cycle.[^16]

L'état économique est représenté visuellement dans l'interface du jeu via un graphique d'évolution accessible depuis les rapports financiers.[^10]

***

## 7. Le marché boursier et le financement

### Capital initial et structure financière

Le joueur commence avec **1 000 000 $** : 500 000 $ en fonds propres (actions) et 500 000 $ en emprunt (obligation initiale).[^2][^1]

### Les obligations (Bonds)

Les obligations rapportent **500 000 $** chacune, mais le taux d'intérêt dépend de l'état économique du moment :[^17][^10]

- En Boom : taux bas (favorable)
- En Dépression : taux élevé, voire impossibilité d'émettre des obligations

**Pénalité de faillite :** chaque faillite déclarée augmente le taux d'intérêt de 1% pour les futures émissions d'obligations. Après un certain nombre de faillites, les obligations ne peuvent plus être émises.[^10][^8]

### Les actions

Le cours de l'action dépend de la **performance financière** (revenus, profits), de la **taille du réseau**, et des **actions achetées par les compétiteurs**. Si le cours d'un chemin de fer concurrent tombe sous **5 $** et y reste trop longtemps, la compagnie peut être **dissoute** et disparaît du jeu.[^8][^10]

### Emprunts à court terme

Des Short Term Loans sont disponibles mais à des taux encore plus élevés que les obligations.[^10]

***

## 8. Les concurrents (AI Railroads)

Le jeu propose jusqu'à 3 compagnies concurrentes contrôlées par l'IA, chacune modélisant la personnalité de magnats historiques :[^10]

- **Jay Gould** : aggressif en bourse, cherche à racheter vos actions
- **Jim Hill** : expansion territoriale rapide
- **J.P. Morgan** : stratégie équilibrée et prise de contrôle
- **Cornelius Vanderbilt** : etc.

En mode **Cut-Throat** (compétition féroce), les concurrents :
- Achètent vos actions pour tenter une prise de contrôle hostile
- Déclenchent des **Rate Wars** sur vos stations
- Construisent des lignes pour bloquer vos accès à des territoires rentables

En mode **Friendly**, aucune de ces actions n'est déclenchée.[^1][^10]

### Rate Wars (Guerres tarifaires)

Quand deux compagnies desservent la même ville, l'une peut déclencher une guerre tarifaire. La compagnie qui fournit le **meilleur service** (nombre de trains, rapidité, variété des marchandises livrées) gagne le monopole local. Le perdant est **éjecté de la ville** et perd son investissement en voies et stations.[^12][^10]

Pendant une Rate War, les revenus sont **divisés par deux** (×0.5) pour les deux parties.[^10]

***

## 9. Les améliorations de stations et leur effet économique

| Amélioration | Coût | Effet |
|---|---|---|
| Engine Shop | 100 000 $ | Permet la construction de trains |
| Switching Yard | 50 000 $ | Changement de composition 75% plus rapide |
| Maintenance Shop | 25 000 $ | Coût de maintenance −75% pour les trains passants |
| Cold Storage | 25 000 $ | Le cargo "Food" ne se périme jamais en station |
| Livestock Pens | 25 000 $ | Le cargo "Livestock" ne se périme jamais |
| Goods Storage | 25 000 $ | Le cargo "Goods" ne se périme jamais |
| Post Office | 50 000 $ | Le cargo "Mail" ne se périme jamais |
| Restaurant | 25 000 $ | Bonus de revenu sur les passagers |
| Hotel | 100 000 $ | Bonus de revenu supplémentaire sur les passagers |

[^9][^8]

> Note importante : les cargaisons périssables (passengers, mail, food, livestock) **se dégradent si elles restent trop longtemps en station sans être collectées**. Les améliorations correspondantes annulent cette dégradation.

***

## 10. Événements aléatoires (Random Events)

### Événements de réseau

| Événement | Déclencheur / Probabilité | Effet |
|---|---|---|
| **Inondation / Pont emporté** | Aléatoire (code non public) | Détruit les ponts en bois, bloque les trains en transit |
| **Déraillement / Accident** | Mode Dispatcher ou aléatoire | Destruction du train, perte financière |
| **Train wreck** | Collision en mode Dispatcher | Animation, train détruit |
| **Apparition/Disparition d'industrie** | Aléatoire, lié aux nearby stations | En mode complexe, change les flux de cargo disponibles |

Les ponts en pierre sont **indestructibles par les inondations** contrairement aux ponts en bois (vulnérables) et en acier (résistants mais pas invincibles).[^9][^10]

### Événements économiques et bourse

| Événement | Déclencheur | Effet |
|---|---|---|
| **Changement de climat économique** | Aléatoire/périodique | Modifie revenus et production |
| **Priority Shipment apparaît** | Aléatoire | Bonus temporaire décroissant |
| **Prise de contrôle hostile** | Compétiteur achète 50%+ | Perd le contrôle de sa compagnie |
| **Rachat d'un concurrent** | Joueur achète 50%+ | Contrôle une compagnie rivale |
| **Dissolution d'un concurrent** | Cours < 5 $ pendant longtemps | Compagnie disparaît |
| **Apparition de nouvelle locomotive** | Temporel (date en jeu) | Technologie disponible à l'achat |

[^7][^8][^9][^10]

***

## 11. Les coûts d'exploitation

### Maintenance des locomotives

Chaque locomotive a un coût annuel de maintenance qui **augmente avec l'âge** de la locomotive. Les stratèges recommandent de remplacer les locomotives quand leur maintenance annuelle dépasse ~15 000 $.[^11]

Fourchette observée : entre **8 000 $ et 18 000 $** par locomotive et par an.[^12]

### Intérêts des obligations

Le remboursement des intérêts est automatique et prélevé périodiquement. En cas d'incapacité à payer, la faillite est déclenchée.[^10]

### Coût du capital humain (implicite)

Le jeu ne modelise pas de salaires ou de coûts RH explicites — les coûts opérationnels sont simplifiés en maintenance + intérêts + construction.

***

## 12. Périodes comptables et temps de jeu

- Une **période comptable = 2 ans** de temps in-game[^2][^8]
- La durée totale de la partie dépend du niveau de difficulté : 40 ans (Investor), 60 ans (Financier), 80 ans (Mogul), 100 ans (Tycoon)[^1]
- Les rapports financiers (bilan, compte de résultat) sont générés à chaque fin de période
- **Les stations nouvellement construites ou reconstruites bénéficient de tarifs doublés pendant toute la première période comptable** suivant leur construction[^8][^9]

***

## 13. Algorithme de génération de la carte (synthèse technique)

D'après le travail de rétro-ingénierie sur le code DOS :[^7]

1. **Une seed 16 bits** est générée aléatoirement au lancement d'une nouvelle partie.
2. Chaque cellule de la carte a une **"couleur"** (type de terrain de base) stockée dans le fichier .MAP.
3. Pour chaque cellule, la game logic applique :
   ```
   index = lookup_table_1[seed XOR map_color XOR (x * PRIME1 + y * PRIME2)]
   ```
   (logique approximative — la fonction exacte est à l'offset `02BB:3033` dans le segment de code DOS)
4. L'index pointe vers une des 3 lookup tables pour déterminer : ville et taille, industrie ou producteur de ressource, et présence de la case.
5. Les stations adverses sont **encodées dans le .MAP** mais leurs voies ferrées sont stockées dans un fichier séparé.

***

## 14. Recommandations pour la recréation du système

### Architecture suggérée

Pour recoder fidèlement le système économique de Railroad Tycoon 1 dans une version modernisée :

**Module 1 — Génération du monde**
- Implémenter un générateur procédural avec seed configurable
- Tables de lookup pour industries/ressources par biome de terrain
- Rayon de station configurable par type

**Module 2 — Offre et demande**
- Chaque tile produit/consomme une quantité fixe de cargo par période (trimestrielle)
- En mode complexe, demande = table de compatibilité `{type_industrie → cargo_demandé}`
- Production × multiplicateur économique (×0.5 à ×1.5)

**Module 3 — Calcul de revenu**
```javascript
function calculateRevenue(cargo, distance, speed, stationRate, difficulty, economy) {
    const base = BASE_RATES[cargo.class]; // mail > pass > fast > slow > bulk
    const distFactor = distanceMultiplier(cargo.class, distance);
    const speedFactor = speedMultiplier(cargo.class, speed);
    return base * distFactor * speedFactor * stationRate * difficulty * economy;
}
```

**Module 4 — Cycle économique**
- Machine à 5 états : Boom → Prosperity → Normal → Recession → Depression
- Transitions probabilistes (légèrement influencées par les actions du joueur)
- Affecte les revenus, la production industrielle, et les taux d'intérêt

**Module 5 — Événements aléatoires**
- Inondations : probabilité par période × présence de ponts en bois
- Priority Shipments : spawn aléatoire, décroissance du bonus dans le temps
- Apparition/disparition d'industries : basse probabilité par période
- Arrivée de nouvelles locomotives : événements temporels fixes

**Module 6 — Finances**
- Système d'obligations : valeur fixe (500k), taux variable selon état économique
- Calcul du cours de l'action : fonction de revenus, taille réseau, cash
- Prise de contrôle hostile : déclenché quand IA détient >50% d'une compagnie

[^11][^1][^7][^12][^9][^8][^10]

***

## Note sur les limites de la documentation

Le code source original n'a jamais été publié. Les formules exactes de revenu (valeurs numériques précises de BASE_RATES, courbes exactes de f(distance) et g(speed)) n'ont été ni documentées officiellement par MicroProse ni complètement extraites par rétro-ingénierie publique. Les travaux de Wilczek_h sur VOGONS constituent l'effort de décompilation le plus avancé connu à ce jour mais portent principalement sur le rendu graphique et la structure des données, pas sur les formules économiques internes. Les valeurs présentées dans ce rapport sont des reconstructions précises basées sur le manuel officiel, le Technical Supplement, les Player Aid Cards, et l'analyse empirique de joueurs expérimentés — elles sont fonctionnellement équivalentes mais pas bit-perfect par rapport à l'original.[^18][^7]

---

## References

1. [Sid Meier's Railroad Tycoon - longplay fullplay - MicroProse, 1990 - PC / DOS - railroad strategy](https://www.youtube.com/watch?v=cAznnXdDWnQ) - Subscribe https://bit.ly/sub-cgs


#sidmeiersrailroadtycoon #railroadtycoon #strategygames #railroad...

2. [Sid Meier’s RailRoad Tycoon : Sid Meier; MicroProse Software, Inc. : Free Borrow & Streaming : Internet Archive](https://archive.org/details/railroad_tycoon_1990) - Manual available at https://archive.org/details/SID_MEIERS_RAILROAD_TYCOON_DELUXEPlatformsAmiga, Ata...

3. [Sid Meier's RAILROAD TYCOON (PC/DOS) Longplay, 1990, MicroProse, MPS Labs](https://www.youtube.com/watch?v=bekpo1o6rh4) - Sid Meier's RAILROAD TYCOON, 1990, MicroProse Software, MPS Labs - Playthrough 100% Difficulty facto...

4. [Railroad Tycoon (video game) - Wikipedia](https://en.wikipedia.org/wiki/Railroad_Tycoon_(video_game))

5. [Railroad Tycoon (Amiga) Longplay](https://www.youtube.com/watch?v=TCuK0NDsZNc) - Longplay of Sid Meier's Railroad Tycoon from 1993, made by MicroProse.
Railroad Tycoon was released ...

6. [Railroad Tycoon (Amiga) - OpenRetro Game Database](https://openretro.org/amiga/railroad-tycoon) - Drive your competitors out of business with buyouts and rate wars. Multiple types of resources to ca...

7. [Reverse Engineering Sid Meier's Railroad Tycoon](https://www.vogons.org/viewtopic.php?t=105451)

8. [Sid Meier’s Railroad Tycoon (1990)](https://freerails.readthedocs.io/en/latest/specification_rt1.html)

9. [Sid Meier's Railroad Tycoon](https://railroad-tycoon.fandom.com/wiki/Sid_Meier's_Railroad_Tycoon) - Sid Meier's Railroad Tycoon is a business simulation game where a player takes builds and manages a ...

10. [[PDF] Technical Supplement - DOS Days](https://www.dosdays.co.uk/media/games/rails/RailroadTycoon-TechnicalSupplement.pdf) - Technical Supplement. Railroad Tycoonis not copy-protected. This means ... 1/2" disks, two player ai...

11. [Railroad Tycoon Help](https://groups.google.com/g/comp.sys.ibm.pc.games.strategic/c/D6ZmUJ2wk3o)

12. [Unofficial Strategy Guide - DOS Days](https://www.dosdays.co.uk/media/games/rails/Rails_Strategy_Guide.txt)

13. [[PDF] Sid Meier's Railroad Tycoon Deluxe manual - Lucas' Abandonware](http://lucasabandonware.free.fr/manuels/Railroad%20Tycoon%20Deluxe.pdf) - There is a border color for normal rates, for half rates (only during rate wars), and double rates (...

14. [How to Calculate Revenue - Railroad Tycoon 2 Discussion - Forums](https://forum.dune2k.com/topic/23978-how-to-calculate-revenue/) - In another post I asked some questions as to how to set up train routes, or if there was a way to kn...

15. [Railroad Tycoon 2 : PopTop Software - Internet Archive](https://archive.org/details/railroad-tycoon-2) - The economy may fluctuate during gameplay, with five economic states possible: Booming, Prosperity, ...

16. [Managing the Economy - Railroad Tycoon 2 Discussion](https://forum.dune2k.com/topic/22750-managing-the-economy/) - RT2 always plays best when loads of money is being made and the Economy is in Boom but only relative...

17. [RRT3 FAQ - Hawk & Badger Railroad](https://hawkdawg.com/rrt/rrt3/RRT3_FAQ.txt) - Railroad Tycoon 3 is very steeped in economics, even more so than both Railroad Tycoon 1 and 2. ... ...

18. [Reverse Engineering Sid Meier's Railroad Tycoon for DOS from 1990](https://news.ycombinator.com/item?id=47015138) - Total income over the game was tracked in a 32-bit signed int, so if you earned too much money sudde...

