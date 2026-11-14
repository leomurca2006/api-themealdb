import express from 'express'
import cors from 'cors'
import recettesRoutes from './routes/recettes.routes.js'
import statsRoutes from './routes/stats.routes.js'

const app = express()

app.use(cors())

app.get('/health', (req, res) => {
    res.json({ statut: 'ok', version: '1.0.0' })
})

app.use('/api/recettes', recettesRoutes)
app.use('/api/stats', statsRoutes)

// Aucune route ne correspond à l'URL demandée : on répond 404
app.use((req, res) => {
    res.status(404).json({ erreur: 'Route inconnue : ' + req.originalUrl })
})

// Une erreur est survenue dans une route (ex : TheMealDB ne répond pas) : on répond 500
app.use((err, req, res, next) => {
    console.error(err)
    res.status(500).json({ erreur: 'Erreur du serveur' })
})

export default app
