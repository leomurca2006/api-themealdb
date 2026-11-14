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

    res.json(recettes)
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
