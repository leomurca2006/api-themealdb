import { Router } from 'express'
import { chercherRecettes } from '../services/mealdb.service.js'

const router = Router()

// GET /api/pays : chaque pays avec son nombre de recettes, du plus au moins représenté
// On part de nos recettes et pas de list.php?a=list de TheMealDB : cette liste contient
// 195 pays (la plupart sans recette) avec des noms différents ("French" au lieu de "France")
router.get('/', async (req, res) => {
    const recettes = await chercherRecettes()

    // 1. Compter les recettes de chaque pays
    const compteur = {}

    for (const recette of recettes) {
        if (compteur[recette.pays]) {
            compteur[recette.pays] = compteur[recette.pays] + 1
        } else {
            compteur[recette.pays] = 1
        }
    }

    // 2. Transformer l'objet { "British": 59, ... } en tableau [{ nom: "British", nbRecettes: 59 }, ...]
    const pays = []

    for (const nom of Object.keys(compteur)) {
        pays.push({ nom: nom, nbRecettes: compteur[nom] })
    }

    // 3. Trier du pays qui a le plus de recettes à celui qui en a le moins
    pays.sort((a, b) => b.nbRecettes - a.nbRecettes)

    res.json(pays)
})

// GET /api/pays/:nom : un pays en particulier, avec ses recettes
// ex : /api/pays/british (insensible aux majuscules)
router.get('/:nom', async (req, res) => {
    const recettes = await chercherRecettes()

    // Les recettes de ce pays (comparaison en minuscules)
    const recettesDuPays = recettes.filter((recette) =>
        recette.pays.toLowerCase() === req.params.nom.toLowerCase()
    )

    if (recettesDuPays.length === 0) {
        return res.status(404).json({ erreur: 'Aucune recette ne vient de ce pays : ' + req.params.nom })
    }

    res.json({
        nom: recettesDuPays[0].pays, // le nom bien écrit, ex : "British" même si on a tapé "british"
        nbRecettes: recettesDuPays.length,
        // Pour chaque recette, juste l'essentiel (le détail est dans /api/recettes/:id)
        recettes: recettesDuPays.map((recette) => {
            return {
                id: recette.id,
                nom: recette.nom,
                categorie: recette.categorie,
                image: recette.image
            }
        })
    })
})

export default router
