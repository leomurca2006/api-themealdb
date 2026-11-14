// Seul fichier du projet qui connaît l'API TheMealDB.

const BASE = 'https://www.themealdb.com/api/json/v1/1'

// Transforme une recette brute de TheMealDB en recette propre pour notre API
export function nettoyer(recette) {
    const ingredients = []

    // TheMealDB range les ingrédients dans 20 champs : strIngredient1 à strIngredient20
    for (let i = 1; i <= 20; i++) {
        const nom = recette['strIngredient' + i]
        const quantite = recette['strMeasure' + i]

        // On ignore les champs vides : null, "" ou seulement des espaces
        if (nom && nom.trim() !== '') {
            ingredients.push({
                nom: nom.trim(),
                quantite: quantite ? quantite.trim() : ''
            })
        }
    }

    return {
        id: recette.idMeal,
        nom: recette.strMeal,
        categorie: recette.strCategory,
        pays: recette.strArea || 'Inconnu', // certaines recettes n'ont pas de pays (null)
        image: recette.strMealThumb,
        ingredients: ingredients,
        nbIngredients: ingredients.length
    }
}

// Variable en mémoire : on garde les recettes pour ne pas refaire les 26 appels
let cache = null

// Récupère toutes les recettes en cherchant lettre par lettre (a -> z)
export async function chercherRecettes() {
    if (cache !== null) {
        return cache
    }

    const toutes = []
    const lettres = 'abcdefghijklmnopqrstuvwxyz'

    for (const lettre of lettres) {
        const response = await fetch(BASE + '/search.php?f=' + lettre)

        if (!response.ok) {
            throw new Error('Erreur ' + response.status + ' pour la lettre ' + lettre)
        }

        const donnees = await response.json()

        // Quand aucune recette ne commence par cette lettre, TheMealDB renvoie { meals: null }
        if (donnees.meals === null) {
            continue
        }

        for (const recette of donnees.meals) {
            toutes.push(nettoyer(recette))
        }
    }

    cache = toutes
    return toutes
}
