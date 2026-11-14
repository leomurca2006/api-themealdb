import { Router } from 'express'
import { chercherRecettes } from '../services/mealdb.service.js'

const router = Router()

// GET /api/recettes : la liste de toutes les recettes
router.get('/', async (req, res) => {
    const recettes = await chercherRecettes()

    res.json(recettes)
})

export default router
