import express from 'express'
import cors from 'cors'
import recettesRoutes from './routes/recettes.routes.js'

const app = express()

app.use(cors())

app.get('/health', (req, res) => {
    res.json({ statut: 'ok', version: '1.0.0' })
})

app.use('/api/recettes', recettesRoutes)

export default app
