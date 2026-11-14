import { Router } from 'express'
import { chercherRecettes, chercherUneRecette } from '../services/mealdb.service.js'

const router = Router()

// GET /api/recettes : la liste de toutes les recettes
router.get('/', async (req, res) => {
    const recettes = await chercherRecettes()

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
