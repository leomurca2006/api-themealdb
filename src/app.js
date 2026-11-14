import express from 'express'
import cors from 'cors'

const app = express()

app.use(cors())

app.get('/health', (req, res) => {
    res.json({ statut: 'ok' })
})

export default app
