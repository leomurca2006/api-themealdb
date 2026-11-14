import express from 'express'
import cors from 'cors'

const app = express()

app.use(cors())

app.get('/health', (req, res) => {
    res.json({ statut: 'ok', version: '1.0.0' })
})

export default app
