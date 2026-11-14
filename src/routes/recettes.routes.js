import { Router } from 'express'
import { chercherRecettes, chercherUneRecette } from '../services/mealdb.service.js'

const router = Router()

// GET /api/recettes : la liste des recettes, avec des filtres facultatifs
// ex : /api/recettes?categorie=Seafood&pays=Italian&ingredient=garlic&recherche=pasta
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

// GET /api/recettes/:id : une seule recette
router.get('/:id', async (req, res) => {
    const recette = await chercherUneRecette(req.params.id)

    if (recette === null) {
        return res.status(404).json({ erreur: 'Recette introuvable' })
    }

    res.json(recette)
})

export default router
