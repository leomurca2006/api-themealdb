import { Router } from 'express'
import { chercherRecettes } from '../services/mealdb.service.js'

const router = Router()

// Calcule les statistiques d'une liste de recettes.
// Utilisée par les deux routes : toutes les recettes (/api/stats) et celles d'un pays (/api/stats/pays/:pays)
function calculerStats(recettes) {
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

    return {
        total: recettes.length,
        parCategorie: parCategorie,
        parPays: parPays,
        moyenneIngredients: Math.round(moyenne * 10) / 10, // arrondi à 1 chiffre après la virgule
        recetteAvecLePlusDIngredients: {
            id: plusDIngredients.id,
            nom: plusDIngredients.nom,
            nbIngredients: plusDIngredients.nbIngredients
        }
    }
}

// GET /api/stats : des chiffres calculés par notre code à partir de toutes les recettes
router.get('/', async (req, res) => {
    const recettes = await chercherRecettes()

    res.json(calculerStats(recettes))
})

// GET /api/stats/pays/:pays : les mêmes chiffres, mais seulement pour les recettes d'un pays
// ex : /api/stats/pays/british (insensible aux majuscules)
router.get('/pays/:pays', async (req, res) => {
    const recettes = await chercherRecettes()

    const recettesDuPays = recettes.filter((recette) =>
        recette.pays.toLowerCase() === req.params.pays.toLowerCase()
    )

    if (recettesDuPays.length === 0) {
        return res.status(404).json({ erreur: 'Aucune recette ne vient de ce pays : ' + req.params.pays })
    }

    const stats = calculerStats(recettesDuPays)

    // parPays n'est pas renvoyé : il ne contiendrait que ce pays
    res.json({
        pays: recettesDuPays[0].pays, // le nom bien écrit, ex : "British"
        total: stats.total,
        parCategorie: stats.parCategorie,
        moyenneIngredients: stats.moyenneIngredients,
        recetteAvecLePlusDIngredients: stats.recetteAvecLePlusDIngredients
    })
})

export default router
