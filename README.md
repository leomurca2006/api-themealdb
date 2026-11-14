# API Recettes (TheMealDB)

API Node.js + Express qui récupère les recettes de [TheMealDB](https://www.themealdb.com/api.php) et les renvoie dans un format simplifié, en français, avec des filtres, une pagination, des statistiques et quelques routes en plus.

C'est la transposition du projet vu en cours (une API qui appelait l'API Rick and Morty) sur une API de recettes.

## Ce que fait l'API

- Elle récupère **toutes les recettes** de TheMealDB : comme TheMealDB n'a pas de route « toutes les recettes », elle les cherche lettre par lettre (`search.php?f=a` → `z`), soit **790 recettes**.
- Elle **transforme** chaque recette : les champs sont renommés en français et les 20 champs `strIngredient1…20` / `strMeasure1…20` deviennent une seule liste `ingredients`, sans les champs vides. Chaque recette contient aussi ses `instructions` de préparation (en anglais).
- Elle garde les recettes **en cache** (en mémoire) pour ne pas refaire les 26 appels à chaque requête.
- Elle **calcule** des chiffres qui n'existent pas dans TheMealDB (statistiques, ingrédients les plus utilisés, ingrédients communs…).

> Les données de TheMealDB sont en anglais : les **clés** du JSON sont en français (`nom`, `pays`…), mais les **valeurs** restent en anglais (`"Seafood"`, `"garlic"`). Les filtres prennent donc des mots anglais : `?ingredient=garlic`, pas `?ingredient=ail`.

### Transformation d'une recette

TheMealDB renvoie :

```json
{ "idMeal": "52772", "strMeal": "Teriyaki Chicken Casserole", "strCategory": "Chicken", "strArea": "Japanese",
  "strMealThumb": "https://...jpg", "strInstructions": "Preheat oven...",
  "strIngredient1": "soy sauce", "strMeasure1": "3/4 cup", "...": "...",
  "strIngredient10": "", "strIngredient11": null, "...": "jusqu'à strIngredient20" }
```

Notre API renvoie :

```json
{
  "id": "52772",
  "nom": "Teriyaki Chicken Casserole",
  "categorie": "Chicken",
  "pays": "Japanese",
  "image": "https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg",
  "instructions": "Preheat oven to 350° F. Spray a 9x13-inch baking pan with non-stick spray.\r\nCombine soy sauce, ...",
  "ingredients": [
    { "nom": "soy sauce", "quantite": "3/4 cup" },
    { "nom": "water", "quantite": "1/2 cup" }
  ],
  "nbIngredients": 9
}
```

Les recettes sans pays dans TheMealDB (190 recettes) ont `"pays": "Inconnu"`.

## Lancer le projet

Il faut [Node.js](https://nodejs.org/) (version 18 ou plus, pour `fetch` et `--watch`).

```bash
npm install
node --watch server.js
```

Le serveur démarre sur **http://localhost:3000**. Avec `--watch`, il redémarre tout seul à chaque modification d'un fichier.

Le premier appel à une route qui a besoin de toutes les recettes prend environ 1 seconde (26 appels à TheMealDB) ; les suivants sont instantanés grâce au cache.

## Structure du projet

```
├── server.js                       # lance le serveur sur le port 3000
├── package.json
├── .gitignore                      # node_modules
├── README.md
└── src/
    ├── app.js                      # crée l'app, cors, branche les routes, 404 et erreurs
    ├── routes/
    │   ├── recettes.routes.js      # liste, filtres, tri, pagination, hasard, comparer, frigo, élément
    │   ├── stats.routes.js         # statistiques
    │   ├── categories.routes.js    # catégories + nombre de recettes
    │   ├── ingredients.routes.js   # ingrédients les plus utilisés
    │   └── pays.routes.js          # pays + nombre de recettes
    └── services/
        └── mealdb.service.js       # SEUL fichier qui connaît TheMealDB (fetch + nettoyage + cache)
```

## Routes

| Méthode | Route | Description |
|---|---|---|
| GET | `/health` | Vérifie que le serveur tourne |
| GET | `/api/recettes` | Liste des recettes (filtres, tri, pagination) |
| GET | `/api/recettes/:id` | Une recette |
| GET | `/api/stats` | Statistiques calculées |
| GET | `/api/categories` | Chaque catégorie avec son nombre de recettes *(bonus)* |
| GET | `/api/ingredients` | Ingrédients les plus utilisés *(bonus)* |
| GET | `/api/pays` | Chaque pays avec son nombre de recettes *(bonus)* |
| GET | `/api/recettes/hasard` | Une recette au hasard *(bonus)* |
| GET | `/api/recettes/comparer` | Ingrédients communs à deux recettes *(bonus)* |
| GET | `/api/recettes/frigo` | Recettes qui contiennent tous les ingrédients donnés *(bonus)* |

---

### `GET /health`

http://localhost:3000/health

```json
{ "statut": "ok", "version": "1.0.0" }
```

---

### `GET /api/recettes` : liste, filtres, tri et pagination

http://localhost:3000/api/recettes

Renvoie 20 recettes par page :

```json
{
  "page": 1,
  "nbPages": 40,
  "total": 790,
  "recettes": [
    { "id": "53483", "nom": "Acaraje black-eyed pea fritters with shrimp filling", "categorie": "Seafood", "pays": "Inconnu", "image": "https://...", "instructions": "...", "ingredients": [ ... ], "nbIngredients": 18 },
    ...
  ]
}
```

**Paramètres (facultatifs et combinables)** :

| Paramètre | Effet | Exemple |
|---|---|---|
| `categorie` | catégorie exacte (insensible aux majuscules) | `?categorie=Seafood` |
| `pays` | pays exact (insensible aux majuscules) | `?pays=Italian` |
| `ingredient` | recettes dont un ingrédient contient ce mot | `?ingredient=garlic` |
| `sansIngredient` | recettes dont **aucun** ingrédient ne contient ces mots, séparés par des virgules (allergies, régimes) *(bonus)* | `?sansIngredient=pork,milk` |
| `recherche` | recettes dont le nom contient ce mot | `?recherche=chicken` |
| `tri` | `nom` (A → Z) ou `nbIngredients` (du plus petit au plus grand) *(bonus)* | `?tri=nbIngredients` |
| `page` | numéro de page (20 recettes par page, 1 par défaut) | `?page=2` |

On **filtre** d'abord, puis on **trie**, puis on **pagine** : `total` et `nbPages` correspondent aux recettes filtrées.

Exemple combiné : http://localhost:3000/api/recettes?categorie=Seafood&pays=Japanese

```json
{
  "page": 1,
  "nbPages": 1,
  "total": 2,
  "recettes": [
    {
      "id": "52773",
      "nom": "Honey Teriyaki Salmon",
      "categorie": "Seafood",
      "pays": "Japanese",
      "image": "https://www.themealdb.com/images/media/meals/xxyupu1468262513.jpg",
      "instructions": "Mix all the ingredients in the Honey Teriyaki Glaze together. Whisk to blend well. ...",
      "ingredients": [
        { "nom": "Salmon", "quantite": "1 lb" },
        { "nom": "Olive oil", "quantite": "1 tablespoon" },
        { "nom": "Soy Sauce", "quantite": "2 tablespoons" },
        { "nom": "Sake", "quantite": "2 tablespoons" },
        { "nom": "Sesame Seed", "quantite": "4 tablespoons" }
      ],
      "nbIngredients": 5
    },
    ...
  ]
}
```

Autres exemples :

- http://localhost:3000/api/recettes?categorie=Seafood&page=5 → `"page": 5, "nbPages": 5, "total": 84` et 4 recettes
- http://localhost:3000/api/recettes?categorie=Dessert&tri=nbIngredients → les 167 desserts, en commençant par *Caribbean Tamarind balls* (2 ingrédients)
- http://localhost:3000/api/recettes?ingredient=garlic&recherche=chicken
- http://localhost:3000/api/recettes?sansIngredient=pork → 746 recettes sans porc (44 en contiennent)
- http://localhost:3000/api/recettes?sansIngredient=pork,beef → 658 recettes sans porc ni bœuf
- http://localhost:3000/api/recettes?categorie=Dessert&sansIngredient=egg,milk → 35 desserts sans œuf ni lait

Erreurs :

- Page qui n'existe pas (`?page=41`, `?page=0`, `?page=abc`) → **404**
  ```json
  { "erreur": "Page inexistante (il y a 40 page(s))" }
  ```
- Tri inconnu (`?tri=prix`) → **400**
  ```json
  { "erreur": "Tri inconnu : utilisez tri=nom ou tri=nbIngredients" }
  ```
- Un filtre qui ne trouve rien (`?categorie=Licorne`) n'est pas une erreur : `200` avec `"total": 0` et `"recettes": []`.

---

### `GET /api/recettes/:id` : une recette

http://localhost:3000/api/recettes/52772

```json
{
  "id": "52772",
  "nom": "Teriyaki Chicken Casserole",
  "categorie": "Chicken",
  "pays": "Japanese",
  "image": "https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg",
  "instructions": "Preheat oven to 350° F. Spray a 9x13-inch baking pan with non-stick spray.\r\nCombine soy sauce, ...",
  "ingredients": [
    { "nom": "soy sauce", "quantite": "3/4 cup" },
    { "nom": "water", "quantite": "1/2 cup" },
    { "nom": "brown sugar", "quantite": "1/4 cup" },
    { "nom": "ground ginger", "quantite": "1/2 teaspoon" },
    { "nom": "minced garlic", "quantite": "1/2 teaspoon" },
    { "nom": "cornstarch", "quantite": "4 Tablespoons" },
    { "nom": "chicken breasts", "quantite": "2" },
    { "nom": "stir-fry vegetables", "quantite": "1 (12 oz.)" },
    { "nom": "brown rice", "quantite": "3 cups" }
  ],
  "nbIngredients": 9
}
```

Id inconnu (http://localhost:3000/api/recettes/1) → **404**. TheMealDB répond `200` avec `{ "meals": null }` (ou `"Invalid ID"` pour un id comme `abc`), notre API le transforme en vrai 404 :

```json
{ "erreur": "Recette introuvable" }
```

> Les ids de TheMealDB commencent vers 52 700 : `52772` est un identifiant, pas un nombre de recettes.

---

### `GET /api/stats` : statistiques

http://localhost:3000/api/stats

Chiffres calculés par notre code à partir des 790 recettes :

```json
{
  "total": 790,
  "parCategorie": { "Seafood": 84, "Miscellaneous": 33, "Lamb": 33, "...": "..." },
  "parPays": { "Inconnu": 190, "Turkish": 30, "Chinese": 27, "...": "..." },
  "moyenneIngredients": 10.3,
  "recetteAvecLePlusDIngredients": { "id": "52894", "nom": "Battenberg Cake", "nbIngredients": 20 }
}
```

(Plusieurs recettes ont 20 ingrédients, le maximum de TheMealDB : la route renvoie la première trouvée.)

---

### `GET /api/categories` : catégories *(bonus)*

http://localhost:3000/api/categories

Les 14 catégories de TheMealDB, avec le nombre de recettes de chacune :

```json
[
  { "nom": "Beef", "image": "https://www.themealdb.com/images/category/beef.png", "nbRecettes": 95 },
  { "nom": "Chicken", "image": "https://www.themealdb.com/images/category/chicken.png", "nbRecettes": 80 },
  ...
]
```

---

### `GET /api/pays` : pays *(bonus)*

http://localhost:3000/api/pays

Les 38 pays présents dans les recettes, du plus au moins représenté :

```json
[
  { "nom": "Inconnu", "nbRecettes": 190 },
  { "nom": "British", "nbRecettes": 59 },
  { "nom": "Spanish", "nbRecettes": 48 },
  { "nom": "United States", "nbRecettes": 33 },
  ...
  { "nom": "Slovakia", "nbRecettes": 4 }
]
```

Les noms sont ceux à utiliser dans le filtre `?pays=` (ex : http://localhost:3000/api/recettes?pays=British). La liste est calculée à partir des recettes et non avec `list.php?a=list` de TheMealDB, qui contient 195 pays (la plupart sans recette) avec des noms différents de ceux des recettes (« French » au lieu de « France »).

---

### `GET /api/ingredients` : ingrédients les plus utilisés *(bonus)*

http://localhost:3000/api/ingredients?limite=3

Triés du plus utilisé au moins utilisé, `limite` = 10 par défaut. Les noms sont comptés en minuscules (« Garlic » et « garlic » = le même ingrédient).

```json
[
  { "nom": "salt", "nbRecettes": 325 },
  { "nom": "garlic", "nbRecettes": 248 },
  { "nom": "onion", "nbRecettes": 227 }
]
```

Limite invalide (`?limite=0`, `?limite=abc`) → **400**

```json
{ "erreur": "La limite doit être un nombre entier supérieur à 0" }
```

---

### `GET /api/recettes/hasard` : une recette au hasard *(bonus)*

http://localhost:3000/api/recettes/hasard

Renvoie une recette tirée au sort parmi les 790 (avec `Math.random()`), au même format que `/api/recettes/:id`. Elle change à chaque appel.

---

### `GET /api/recettes/comparer` : ingrédients communs *(bonus)*

http://localhost:3000/api/recettes/comparer?ids=52772,53366

```json
{
  "recette1": { "id": "52772", "nom": "Teriyaki Chicken Casserole", "nbIngredients": 9 },
  "recette2": { "id": "53366", "nom": "Beef and Broccoli Stir-Fry", "nbIngredients": 14 },
  "nbIngredientsCommuns": 3,
  "ingredientsCommuns": ["soy sauce", "water", "cornstarch"]
}
```

Erreurs :

- Pas exactement deux ids (`?ids=52772`, `?ids=1,2,3`, pas de `ids`) → **400**
  ```json
  { "erreur": "Il faut donner exactement deux ids séparés par une virgule" }
  ```
- Une des deux recettes n'existe pas (`?ids=52772,1`) → **404**
  ```json
  { "erreur": "Une des deux recettes est introuvable" }
  ```

---

### `GET /api/recettes/frigo` : que puis-je cuisiner ? *(bonus)*

http://localhost:3000/api/recettes/frigo?ingredients=chicken,rice,garlic

Renvoie les recettes qui contiennent **tous** les ingrédients donnés (séparés par des virgules, insensible aux majuscules). Un ingrédient est trouvé si son nom contient le mot : `chicken` trouve aussi « chicken stock ». TheMealDB ne propose ce filtre multi-ingrédients que dans sa version payante.

```json
{
  "ingredients": ["chicken", "rice", "garlic"],
  "total": 16,
  "recettes": [
    { "id": "...", "nom": "Arroz al horno (baked rice)", "categorie": "...", "pays": "...", "image": "https://...", "instructions": "...", "ingredients": [ ... ], "nbIngredients": ... },
    { "id": "...", "nom": "Chicken & chorizo rice pot", "...": "..." },
    ...
  ]
}
```

Plus on donne d'ingrédients, moins il y a de résultats : `chicken` → 118 recettes, `chicken,rice` → 30, `chicken,rice,garlic` → 16.

Pas d'ingrédient (`?ingredients=` ou pas de paramètre) → **400**

```json
{ "erreur": "Il faut donner des ingrédients, ex : ?ingredients=chicken,rice,garlic" }
```

---

### Route inconnue et erreur serveur

N'importe quelle URL qui n'existe pas (ex : http://localhost:3000/api/recette) → **404**

```json
{ "erreur": "Route inconnue : /api/recette" }
```

Si TheMealDB ne répond pas (panne, pas d'internet) → **500**, le détail de l'erreur s'affiche dans la console du serveur :

```json
{ "erreur": "Erreur du serveur" }
```

## Utilisation de l'IA

J'ai utilisé **Claude Code** (l'assistant de programmation d'Anthropic, dans VS Code) pour réaliser ce projet. Concrètement :

- **Écriture du code** : Claude Code a écrit le code de chaque étape à partir de mes consignes, en suivant l'arborescence et le style imposés par le sujet et mon projet Rick and Morty du cours. Je l'ai utilisé pour que le code soit soigné et facile à comprendre, et pour régler les erreurs que j'ai rencontrées (fautes d'orthographe, import ajouté par erreur qui empêchait le serveur de démarrer…).
- **Explications** : après chaque étape, je lui ai demandé d'expliquer le code simplement pour pouvoir le comprendre et le réexpliquer (par exemple : pourquoi `return` avant `res.status(404)`, pourquoi `/hasard` doit être déclarée avant `/:id`, pourquoi trier une copie du tableau avec `.slice()`, la différence entre `?recherche` et `?ingredient`).
- **Tests** : Claude Code a testé chaque route (cas normaux et cas d'erreur) avant de passer à la suite ; j'ai aussi testé les routes dans mon navigateur, et testé moi-même l'erreur 500 en cassant volontairement l'adresse de TheMealDB.
- **Git** : il m'a aidé à organiser les commits (une branche par étape, fusionnée dans `main`) et à créer le dépôt GitHub. Les commits portent la mention `Co-Authored-By: Claude`.
- **README** : ce fichier a été rédigé avec Claude Code.

Mes choix et décisions pendant le projet : avancer étape par étape avec un commit par fonctionnalité, les messages de commit, le travail avec une branche par étape, l'ajout de la version dans `/health`, le tirage au sort avec `Math.random()`, et garder `"quantite": ""` quand TheMealDB ne donne pas de quantité.
