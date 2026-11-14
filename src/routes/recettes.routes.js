import { Router } from 'express'
import { chercherRecettes, chercherUneRecette } from '../services/mealdb.service.js'

const router = Router()

// GET /api/recettes : la liste des recettes, avec des filtres facultatifs
// ex : /api/recettes?categorie=Seafood&pays=Italian&ingredient=garlic&sansIngredient=pork&recherche=pasta
router.get('/', async (req, res) => {
    let recettes = await chercherRecettes()

    // Chaque filtre n'est appliqué que s'il est présent dans l'URL.
    // On compare tout en minuscules pour ne pas tenir compte des majuscules.

    if (req.query.categorie) {
        recettes = recettes.filter((recette) =>
            recette.categorie.toLowerCase() === req.query.categorie.toLowerCase()
        )
    }

    if (req.query.pays) {
        recettes = recettes.filter((recette) =>
            recette.pays.toLowerCase() === req.query.pays.toLowerCase()
        )
    }

    if (req.query.ingredient) {
        recettes = recettes.filter((recette) =>
            recette.ingredients.some((ingredient) =>
                ingredient.nom.toLowerCase().includes(req.query.ingredient.toLowerCase())
            )
        )
    }

    // L'inverse de ?ingredient : on garde les recettes qui n'ont AUCUN ingrédient
    // contenant ces mots (ex : ?sansIngredient=pork,milk pour les recettes sans porc ni lait)
    if (req.query.sansIngredient) {
        // String() transforme aussi un paramètre répété (?sansIngredient=pork&sansIngredient=milk),
        // qu'Express donne sous forme de tableau, en texte "pork,milk"
        // "pork, Milk" -> ["pork", "milk"] (sans espaces, en minuscules, sans les vides)
        const exclus = []
        for (const mot of String(req.query.sansIngredient).split(',')) {
            if (mot.trim() !== '') {
                exclus.push(mot.trim().toLowerCase())
            }
        }

        // Pour CHAQUE mot exclu (.every), la recette ne doit avoir AUCUN ingrédient (!.some) qui le contient
        recettes = recettes.filter((recette) =>
            exclus.every((mot) =>
                !recette.ingredients.some((ingredient) =>
                    ingredient.nom.toLowerCase().includes(mot)
                )
            )
        )
    }

    if (req.query.recherche) {
        recettes = recettes.filter((recette) =>
            recette.nom.toLowerCase().includes(req.query.recherche.toLowerCase())
        )
    }

    // Tri facultatif : ?tri=nom (A -> Z) ou ?tri=nbIngredients (du plus petit au plus grand)
    if (req.query.tri) {
        // .sort() modifie le tableau d'origine : on trie une copie pour ne pas abîmer le cache
        recettes = recettes.slice()

        if (req.query.tri === 'nom') {
            recettes.sort((a, b) => a.nom.localeCompare(b.nom))
        } else if (req.query.tri === 'nbIngredients') {
            recettes.sort((a, b) => a.nbIngredients - b.nbIngredients)
        } else {
            return res.status(400).json({ erreur: 'Tri inconnu : utilisez tri=nom ou tri=nbIngredients' })
        }
    }

    // Pagination : on découpe la liste (déjà filtrée et triée) en pages de 20 recettes
    const parPage = 20
    const total = recettes.length
    const nbPages = Math.max(1, Math.ceil(total / parPage)) // au moins 1 page, même vide

    // Page 1 par défaut si ?page n'est pas dans l'URL
    let page = 1
    if (req.query.page) {
        page = Number(req.query.page)
    }

    // Page qui n'existe pas : 0, négative, trop grande, ou pas un nombre entier (ex : ?page=abc)
    if (!Number.isInteger(page) || page < 1 || page > nbPages) {
        return res.status(404).json({ erreur: 'Page inexistante (il y a ' + nbPages + ' page(s))' })
    }

    // Page 1 -> recettes 0 à 19, page 2 -> recettes 20 à 39, etc.
    const debut = (page - 1) * parPage
    const recettesDeLaPage = recettes.slice(debut, debut + parPage)

    res.json({
        page: page,
        nbPages: nbPages,
        total: total,
        recettes: recettesDeLaPage
    })
})

// GET /api/recettes/hasard : une recette au hasard
// À déclarer AVANT /:id, sinon Express prendrait "hasard" pour un id
router.get('/hasard', async (req, res) => {
    const recettes = await chercherRecettes()

    // Math.random() donne un nombre entre 0 et 1 (1 exclu), ex : 0.42
    // x 790 recettes = 331.8, puis Math.floor arrondit vers le bas = 331
    // On obtient donc un indice entre 0 et 789
    const index = Math.floor(Math.random() * recettes.length)

    res.json(recettes[index])
})

// GET /api/recettes/comparer?ids=52772,52771 : les ingrédients communs à deux recettes
// À déclarer AVANT /:id, comme /hasard
router.get('/comparer', async (req, res) => {
    if (!req.query.ids) {
        return res.status(400).json({ erreur: 'Il faut donner deux ids, ex : ?ids=52772,52771' })
    }

    // "52772,52771" -> ["52772", "52771"]
    const ids = req.query.ids.split(',')

    if (ids.length !== 2) {
        return res.status(400).json({ erreur: 'Il faut donner exactement deux ids séparés par une virgule' })
    }

    const recette1 = await chercherUneRecette(ids[0].trim())
    const recette2 = await chercherUneRecette(ids[1].trim())

    if (recette1 === null || recette2 === null) {
        return res.status(404).json({ erreur: 'Une des deux recettes est introuvable' })
    }

    // Les noms des ingrédients de la recette 2, en minuscules
    const nomsRecette2 = recette2.ingredients.map((ingredient) => ingredient.nom.toLowerCase())

    // On garde les ingrédients de la recette 1 qui sont aussi dans la recette 2
    const communs = []

    for (const ingredient of recette1.ingredients) {
        const nom = ingredient.nom.toLowerCase()

        if (nomsRecette2.includes(nom) && !communs.includes(nom)) {
            communs.push(nom)
        }
    }

    res.json({
        recette1: { id: recette1.id, nom: recette1.nom, nbIngredients: recette1.nbIngredients },
        recette2: { id: recette2.id, nom: recette2.nom, nbIngredients: recette2.nbIngredients },
        nbIngredientsCommuns: communs.length,
        ingredientsCommuns: communs
    })
})

// GET /api/recettes/frigo?ingredients=chicken,rice,garlic
// Les recettes qui contiennent TOUS les ingrédients donnés ("qu'est-ce que je peux cuisiner ?")
// À déclarer AVANT /:id, comme /hasard et /comparer
router.get('/frigo', async (req, res) => {
    if (!req.query.ingredients) {
        return res.status(400).json({ erreur: 'Il faut donner des ingrédients, ex : ?ingredients=chicken,rice,garlic' })
    }

    // "Chicken, rice" -> ["chicken", "rice"] (sans espaces, en minuscules, sans les vides)
    const mots = []
    for (const mot of req.query.ingredients.split(',')) {
        if (mot.trim() !== '') {
            mots.push(mot.trim().toLowerCase())
        }
    }

    if (mots.length === 0) {
        return res.status(400).json({ erreur: 'Il faut donner au moins un ingrédient' })
    }

    const recettes = await chercherRecettes()

    // On garde une recette seulement si CHAQUE mot (.every) est trouvé
    // dans AU MOINS UN de ses ingrédients (.some)
    const trouvees = recettes.filter((recette) =>
        mots.every((mot) =>
            recette.ingredients.some((ingredient) =>
                ingredient.nom.toLowerCase().includes(mot)
            )
        )
    )

    res.json({
        ingredients: mots,
        total: trouvees.length,
        recettes: trouvees
    })
})

// GET /api/recettes/:id : une seule recette
router.get('/:id', async (req, res) => {
    const recette = await chercherUneRecette(req.params.id)

    if (recette === null) {
        return res.status(404).json({ erreur: 'Recette introuvable' })
    }

    res.json(recette)
})

export default router
