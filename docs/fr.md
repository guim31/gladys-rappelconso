# RappelConso

Les rappels de produits en France, dans Gladys Assistant : alimentation, puériculture, cosmétiques,
appareils, voitures… tels que publiés par [RappelConso](https://rappel.conso.gouv.fr), le site
officiel des rappels de l'administration (DGCCRF, DGAL et autres). Soyez prévenu quand un produit
des catégories, marques ou codes-barres que vous suivez est rappelé. Pas de compte, pas de clé
d'API.

Un complément, pas un système d'alerte officiel : vérifiez toujours la fiche de rappel et suivez
ses consignes. Non affiliée à l'administration.

## Ce que vous obtenez

- Un **appareil « Rappels de produits »** : rappels du jour et des 7 derniers jours dans votre
  sélection, dernier rappel avec sa date, et nombre de rappels en cours qui citent un de vos
  codes-barres.
- Un **déclencheur de scène** « nouveau rappel dans ma sélection », filtrable par catégorie, avec
  le produit, la marque, le motif, les risques et le lien du rappel en variables de scène.
- Un **déclencheur prioritaire** « un de mes codes-barres est rappelé », pour les produits que vous
  avez chez vous, même quand le rappel a été publié avant l'ajout du code-barres.
- Une **action de scène** qui lit les rappels de la semaine en une phrase.
- Un **widget de tableau de bord** avec les derniers rappels, vos codes-barres d'abord, et le lien
  des fiches officielles.

## Prérequis

- Gladys Assistant 5.1.0 ou plus récent (widgets, déclencheurs et actions de scène).
- Un accès Internet de Gladys vers `data.economie.gouv.fr`.
- Rien d'autre : les données sont ouvertes, lues sans compte.

## Configuration

### Réglages

| Réglage                      | Rôle                                                                                                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catégories                   | Les rappels de ces catégories sont suivis. Toutes par défaut ; environ 90 rappels par semaine, aux trois quarts alimentaires.                                    |
| Marques ou mots              | Facultatif. Seulement les rappels qui en citent un (marque, produit ou références), séparés par des virgules. Mots entiers ; accents et majuscules indifférents. |
| Codes-barres de vos produits | Facultatif. Les chiffres sous les codes-barres (EAN, 8 à 14 chiffres), séparés par des virgules. Suivis dans toutes les catégories.                              |
| Fréquence de mise à jour     | De 15 minutes à 6 heures ; 1 heure par défaut.                                                                                                                   |
| Langue des textes            | Noms des fonctionnalités (à leur création) et textes envoyés aux scènes. Les fiches de rappel restent en français.                                               |

Enregistrez, puis créez l'appareil dans l'onglet **Découverte** de l'intégration. Le bouton
**Afficher les rappels de la semaine** relit RappelConso et montre ce que contient votre sélection.

### La sélection suivie

Un rappel est dans votre sélection quand sa catégorie est suivie **et**, si vous avez saisi des
marques ou des mots, qu'il en cite un. Les mots valent pour toutes les catégories suivies, et
s'écrivent en français, comme les fiches. Par exemple, la catégorie « Alimentation » avec les mots
`lait infantile, petit pot` ne suit que les rappels de lait infantile et de petits pots ; pour suivre
aussi tous les articles de puériculture, laissez les mots vides et choisissez la seule catégorie
« Bébés-enfants ».

Les codes-barres sont suivis **quelles que soient les catégories** : un rappel qui en cite un est
toujours dans votre sélection. Ils sont aussi cherchés dans **tout l'historique** de RappelConso :
un rappel publié il y a des mois et toujours en cours compte aussi. Un rappel est en cours jusqu'à
la date de fin de sa procédure ; RappelConso ne remplit plus cette date depuis juillet 2026, si bien
que la plupart des rappels récents restent comptés.

## Appareil

| Fonctionnalité              | Type     | Valeur                                                                     |
| --------------------------- | -------- | -------------------------------------------------------------------------- |
| Rappels du jour             | Compteur | Rappels de votre sélection publiés aujourd'hui (fuseau horaire de Gladys). |
| Rappels sur 7 jours         | Compteur | La même chose sur les 7 derniers jours.                                    |
| Dernier rappel              | Texte    | Le plus récent, ex. `20/10 · Confit de canard 1240g (Jean larnaudie)`.     |
| Rappels de mes codes-barres | Compteur | Rappels en cours, de toute date, qui citent un de vos codes-barres.        |

Les compteurs gardent leur historique. « Rappels du jour » revient à 0 à la première mise à jour
après minuit.

## Widget de tableau de bord

**Rappels de produits** : le nombre de rappels de la semaine, puis jusqu'à 8 rappels : ceux qui
citent vos codes-barres d'abord (pastille rouge « Votre produit »), puis les plus récents de votre
sélection (pastille orange : la catégorie). Touchez une ligne pour voir le motif, les risques, la
conduite à tenir, et les liens vers la fiche de rappel et son affichette imprimable.

## Déclencheurs de scène

**RappelConso : nouveau rappel dans ma sélection.** Une fiche de rappel vue pour la première fois,
dans votre sélection. Filtre : les catégories (vide : toutes). Une fiche corrigée (nouvelle version
d'un rappel plus ancien) ne le déclenche pas, pas plus que les rappels de la semaine déjà publiés
quand vous élargissez votre sélection, ni ceux trouvés au tout premier démarrage.

**RappelConso : un de mes codes-barres est rappelé.** Un rappel en cours cite un de vos
codes-barres, pour la première fois. Filtre facultatif : un code-barres, en chiffres seuls et sans
zéros devant (`3017620422003`), tel que le donne la variable `barcode`. Il se déclenche aussi quand vous ajoutez le code-barres d'un produit déjà rappelé.

Variables des deux déclencheurs : produit, marque, catégorie (clé stable comme `food`), catégorie en
toutes lettres, motif, risques, lien de la fiche de rappel, un résumé en une phrase, et le
code-barres pour le second déclencheur. Produit, marque, motif et risques sont en français, tels que
RappelConso les publie.

## Action de scène

**RappelConso : lire les rappels de la semaine.** Sorties : les rappels de votre sélection sur
7 jours en une phrase (5 cités au plus, puis les rappels de vos codes-barres), leur nombre, et le
nombre de rappels en cours de vos codes-barres. Si RappelConso n'a jamais répondu, l'action échoue
avec un message clair.

## Exemples de scènes

- **Votre produit est rappelé** : déclencheur « un de mes codes-barres est rappelé », puis envoyer
  un message `{{triggerEvent.data.summary}} {{triggerEvent.data.url}}` et faire clignoter une lampe
  en rouge.
- **Puériculture** : déclencheur « nouveau rappel dans ma sélection » avec la catégorie
  « Bébés-enfants », puis envoyer un message avec le produit, le motif et le lien.
- **Résumé de la semaine** : chaque samedi à 10 h, l'action « lire les rappels de la semaine », puis
  envoyer son texte par message ou le faire lire à voix haute.

## Sources, conditions et quotas

Les rappels viennent du jeu de données ouvert
[RappelConso V2](https://data.economie.gouv.fr/explore/dataset/rappelconso-v2-gtin-espaces/) du
ministère de l'Économie, publié sous
[Licence Ouverte 2.0 (Etalab)](https://www.etalab.gouv.fr/licence-ouverte-open-licence/) : la
réutilisation est libre, la source citée. Source : RappelConso, DGCCRF et les autres
administrations qui y publient.

Chaque mise à jour envoie une requête (deux avec des codes-barres) à l'API Opendatasoft. Le quota
anonyme est de 50 000 requêtes par jour et par adresse : une fois par heure, c'est une cinquantaine
de requêtes par jour. Le jeu de données est mis à jour plusieurs fois par jour.

## Dépannage

- **L'appareil n'apparaît pas** : enregistrez la configuration, puis ouvrez l'onglet Découverte de
  l'intégration.
- **« RappelConso ne répond pas »** : data.economie.gouv.fr est injoignable ou surchargé. Les
  derniers rappels restent affichés et l'intégration réessaie à chaque mise à jour.
- **« Ignoré (pas un code-barres de 8 à 14 chiffres) »** : un code de la liste contient des lettres
  ou trop peu de chiffres ; saisissez les chiffres imprimés sous les barres.
- **Un rappel attendu manque** : vérifiez sa catégorie sur la fiche, et les mots saisis (mots
  entiers : `lait` ne trouve pas `laitier`).
- **Plus de détails** : réglez `LOG_LEVEL=debug` dans l'intégration et lisez ses logs.

## Limites

- La France seulement, et seulement ce que publie RappelConso : un rappel annoncé d'abord ailleurs
  peut apparaître plus tard.
- Un rappel est trouvé par catégorie, mots et codes-barres ; un produit vendu sous un autre nom ou
  sans code-barres sur la fiche peut échapper. Vérifiez toujours la fiche avant de jeter un produit.
- Les textes des fiches sont en français.
- « Rappels du jour » est mis à jour à la première mise à jour après minuit.
- Une fiche corrigée revient avec une nouvelle date de publication : elle compte de nouveau dans
  « Rappels du jour », « Rappels sur 7 jours » et le widget, mais ne déclenche pas « nouveau
  rappel ». Les fiches de véhicules ne sont jamais numérotées comme corrections : une fiche
  republiée peut le redéclencher, une fois par mois au plus.
- L'intégration retient sous `/data` ce qu'elle a annoncé : si ce volume n'est pas inscriptible,
  les rappels de codes-barres sont annoncés de nouveau à chaque redémarrage (un avertissement le
  dit dans les logs).
- Non affiliée à l'administration. Données : RappelConso, Licence Ouverte 2.0.
