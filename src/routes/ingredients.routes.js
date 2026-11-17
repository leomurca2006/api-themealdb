import { Router } from 'express'
import { chercherRecettes } from '../services/mealdb.service.js'

const router = Router()

// GET /api/ingredients : les ingrédients les plus utilisés, du plus fréquent au moins fréquent
// ex : /api/ingredients?limite=10
router.get('/', async (req, res) => {
    const recettes = await chercherRecettes()

    // 10 ingrédients par défaut si ?limite n'est pas dans l'URL
    let limite = 10
    if (req.query.limite) {
        limite = Number(req.query.limite)
    }

    if (!Number.isInteger(limite) || limite < 1) {
        return res.status(400).json({ erreur: 'La limite doit être un nombre entier supérieur à 0' })
    }

    // 1. Compter dans combien de recettes apparaît chaque ingrédient
    // En minuscules, car TheMealDB écrit parfois "Garlic" et parfois "garlic"
    const compteur = {}

    for (const recette of recettes) {
        // Certaines recettes listent 2 fois le même ingrédient (ex : "Salt" et "salt") :
        // on ne compte chaque ingrédient qu'une fois par recette
        const dejaVus = []

        for (const ingredient of recette.ingredients) {
            const nom = ingredient.nom.toLowerCase()

            if (dejaVus.includes(nom)) {
                continue
            }
            dejaVus.push(nom)

            if (compteur[nom]) {
                compteur[nom] = compteur[nom] + 1
            } else {
                compteur[nom] = 1
            }
        }
    }

    // 2. Transformer l'objet { "salt": 300, ... } en tableau [{ nom: "salt", nbRecettes: 300 }, ...]
    const ingredients = []

    for (const nom of Object.keys(compteur)) {
        ingredients.push({ nom: nom, nbRecettes: compteur[nom] })
    }

    // 3. Trier du plus utilisé au moins utilisé, puis garder les premiers
    ingredients.sort((a, b) => b.nbRecettes - a.nbRecettes)

    res.json(ingredients.slice(0, limite))
})

export default router
