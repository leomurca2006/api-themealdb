import { Router } from 'express'
import { chercherRecettes } from '../services/mealdb.service.js'

const router = Router()

// Les catégories de TheMealDB utilisées pour chaque partie du menu
// (Breakfast et Miscellaneous, qui contient surtout des sauces, ne sont pas utilisées)
const categoriesEntree = ['Starter', 'Side']
const categoriesPlat = ['Beef', 'Chicken', 'Lamb', 'Pork', 'Seafood', 'Pasta', 'Vegetarian', 'Vegan', 'Goat']
const categoriesDessert = ['Dessert']

// Renvoie un élément au hasard dans un tableau (même calcul que pour /api/recettes/hasard)
function auHasard(tableau) {
    const index = Math.floor(Math.random() * tableau.length)
    return tableau[index]
}

// GET /api/menu : un menu complet tiré au sort (entrée + plat + dessert)
router.get('/', async (req, res) => {
    const recettes = await chercherRecettes()

    // On sépare les recettes en 3 listes selon leur catégorie
    const entrees = recettes.filter((recette) => categoriesEntree.includes(recette.categorie))
    const plats = recettes.filter((recette) => categoriesPlat.includes(recette.categorie))
    const desserts = recettes.filter((recette) => categoriesDessert.includes(recette.categorie))

    res.json({
        entree: auHasard(entrees),
        plat: auHasard(plats),
        dessert: auHasard(desserts)
    })
})

export default router
