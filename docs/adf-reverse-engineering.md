# Reverse-engineering du fichier ADF Railroad Tycoon Amiga

**Source** : `~/coding/temp/Railroad.adf` (880 Ko, disquette Amiga DD, label "RAILA", 1991)

## Extraction

Outil utilisé : `unadf` (ADFlib v0.7.11a)
- 50 fichiers extraits
- Structure Amiga classique : `c/`, `l/`, `s/`, `devs/`, `fonts/`, `libs/`
- Exécutable principal : `game` (336 Ko, AmigaOS loadseg() binary)
- Fichier README : `readme.doc` — Railroad Tycoon Amiga V1, instructions d'installation
- Carte et sauvegarde : `rr4.map` (32 Ko), `rr4.sve` (16 Ko)
- Donnée célébrité : `fame.dta` (408 o)

## Fichiers image

| Type | Fichiers | Format supposé |
|---|---|---|
| 1 fichier ILBM standard | `colour.lbm` | IFF/ILBM, 320×256, 5 bitplanes, palette 32 couleurs |
| ~30 fichiers `.pix` | `page0–9.pix`, `locos*.pix`, `tracks.pix`, etc. | Format propriétaire MicroProse |

## Approches testées

### 1. ILBM standard (colour.lbm)
- Parsing correct des chunks IFF : BMHD, CAMG, CMAP, CRNG, BODY
- **Résultat** : image entièrement noire. Le BODY est composé uniquement de paires `0xD9 0x00` (byterun1 : répéter 0x00 × 40 = une ligne de bitplane vide). Soit l'image est volontairement noire (référence palette uniquement), soit la décompression est incorrecte.

### 2. Header 6 octets + byterun1 + bitplanes
- Header interprété comme : magic `0206`, width `0140` (320), height `00c8` (200)
- Décompression byterun1 standard (repeat count = 257 − n pour n > 0x80)
- Rendu en bitplanes (2 à 5)
- **Résultat** : tout noir ou quasi-monochrome. Les données décompressées contiennent 99% de zéros.

### 3. Header 6 octets + byterun1 + 4bpp chunky
- Même décompression, interprétation pixels en 4 bits par pixel (chunky/linéaire, nibble high puis low)
- **Résultat** : 15 couleurs uniques, 40–69% de noir selon les fichiers. Les aperçus ASCII montrent des structures (formes de locomotives, layouts d'interface), mais les thumbnails PNG apparaissent comme du bruit numérique.

### 4. Header 12 octets + byterun1 + 4bpp chunky
- Header étendu : `0206 0140 00c8 0000 000a 00a0` (12 octets identiques sur tous les fichiers)
- Même décompression et rendu
- **Résultat** : identique au précédent. Le changement d'offset ne modifie que marginalement la sortie décompressée.

### 5. Données brutes sans décompression
- Rendu direct des données compressées (sans byterun1) en 4bpp chunky et en bitplanes
- **Résultat** : 15 couleurs en chunky, 2–4 couleurs en bitplanes. Pas meilleur qu'avec décompression.

### 6. Nibble order inversé
- Low nibble puis high nibble au lieu de high puis low
- **Résultat** : identique (15 couleurs), simple permutation des indices de couleur.

### 7. Recherche de texte dans les binaires
- `strings` et regex sur `page0.pix` et l'exécutable `game`
- **Résultat** : aucun texte lisible dans les `.pix`. L'exécutable référence `page1.pix`, `eastus.pix`, `title.pix`, `logo.lbm`, `labs.lbm`, `colour`.

### 8. Analyse du magic `0206`
- Présent 34 fois dans l'exécutable `game`
- Apparaît dans des contextes variés (données, instructions JSR 68000)
- N'est probablement pas un magic number spécifique au format `.pix`
- Tous les `.pix` commencent par `0206 0140 00c8 0000 000a 00a0` — les 12 premiers octets sont identiques

## Outils qui auraient pu aider (non disponibles sans sudo)

| Outil | Utilité |
|---|---|
| `recoil` (pip) | Bibliothèque de décodage de formats d'images rétro |
| `fs-uae` | Émulateur Amiga — capture d'écran directe du jeu |
| `amitools` | Outils d'analyse de fichiers Amiga |
| `GraphicsMagick` | Peut gérer certains formats Amiga natifs |

## Hypothèses non résolues

1. **L'algorithme de compression** n'est peut-être pas du byterun1 standard. MicroProse utilisait possiblement une variante maison.
2. **Le format de pixels** pourrait être du bitplane entrelacé (interleaved), pas du chunky ni du bitplane standard.
3. **La palette** de `colour.lbm` (32 couleurs) n'est peut-être pas celle utilisée par les `.pix` — le jeu chargeait probablement des palettes différentes par écran.
4. **Les dimensions** indiquées dans le header (320×200) pourraient être celles du conteneur/écran, pas de l'image réelle. Certains fichiers sont trop petits pour remplir 320×200 en 4bpp.
5. **Le vrai format** est probablement documenté dans le code de l'exécutable `game` (336 Ko de code 68000).

## Prochaine piste recommandée

Utiliser **fs-uae** (émulateur Amiga) pour lancer l'ADF et faire des captures d'écran du jeu directement. C'est plus fiable que le reverse-engineering manuel d'un format propriétaire dont le codec est enfoui dans 336 Ko d'assembleur 68000.
