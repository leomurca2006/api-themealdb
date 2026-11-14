import { Router } from 'express'
import { chercherRecettes } from '../services/mealdb.service.js'

const router = Router()

// GET /api/stats : des chiffres calculés par notre code à partir de toutes les recettes
router.get('/', async (req, res) => {
    const recettes = await chercherRecettes()

    const parCategorie = {}
    const parPays = {}
    let totalIngredients = 0
    let plusDIngredients = recettes[0]

    // Un seul parcours de toutes les recettes pour tout calculer
    for (const recette of recettes) {
        // Compter : si la catégorie existe déjà dans l'objet on ajoute 1, sinon on la crée à 1
        if (parCategorie[recette.categorie]) {
            parCategorie[recette.categorie] = parCategorie[recette.categorie] + 1
        } else {
            parCategorie[recette.categorie] = 1
        }

        if (parPays[recette.pays]) {
            parPays[recette.pays] = parPays[recette.pays] + 1
        } else {
            parPays[recette.pays] = 1
        }

        // Additionner les ingrédients pour faire la moyenne à la fin
        totalIngredients = totalIngredients + recette.nbIngredients

        // Garder la recette qui a le plus d'ingrédients
        if (recette.nbIngredients > plusDIngredients.nbIngredients) {
            plusDIngredients = recette
        }
    }

    const moyenne = totalIngredients / recettes.length

    res.json({
        total: recettes.length,
        parCategorie: parCategorie,
        parPays: parPays,
        moyenneIngredients: Math.round(moyenne * 10) / 10, // arrondi à 1 chiffre après la virgule
        recetteAvecLePlusDIngredients: {
            id: plusDIngredients.id,
            nom: plusDIngredients.nom,
            nbIngredients: plusDIngredients.nbIngredients
        }
    })
})

export default router
