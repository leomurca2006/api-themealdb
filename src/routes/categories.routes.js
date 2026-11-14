import { Router } from 'express'
import { chercherCategories, chercherRecettes } from '../services/mealdb.service.js'

const router = Router()

// GET /api/categories : chaque catégorie avec son nombre de recettes
router.get('/', async (req, res) => {
    const categories = await chercherCategories()
    const recettes = await chercherRecettes()

    const resultat = []

    for (const categorie of categories) {
        // On compte les recettes qui appartiennent à cette catégorie
        const recettesDeLaCategorie = recettes.filter((recette) => recette.categorie === categorie.nom)

        resultat.push({
            nom: categorie.nom,
            image: categorie.image,
            nbRecettes: recettesDeLaCategorie.length
        })
    }

    res.json(resultat)
})

export default router
